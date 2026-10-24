import asyncio
import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from backend.app.config import settings
from backend.app.domain.risk_engine import RiskEngine
from backend.app.domain.schemas import (
    AlertSentData,
    CallEndedData,
    CallStartedData,
    CallState,
    ChunkAnalysis,
    ChunkAnalysisData,
    Level,
    LevelChangedData,
    ScamDetectedData,
)
from backend.app.services.alert_stub import AlertStub
from backend.app.services.audio_chunker import AudioChunker
from backend.app.services.gemini_client import gemini_service
from backend.app.services.replay_cache import ReplayCache

logger = logging.getLogger("scam_shield.routes")
router = APIRouter(prefix="/api")
replay_cache = ReplayCache(cache_dir=settings.cache_dir)


class EmergencyAlertRequest(BaseModel):
    contact_phone: str
    relationship: str = "Son"
    elder_name: str = "Grandparent"
    detected_flags: list[str] = []


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Scam Call Shield API",
        "gemini_model": settings.gemini_model,
        "gemini_fallback_model": settings.gemini_fallback_model,
        "live_gemini_active": bool(settings.gemini_api_key),
        "default_mode": "live" if settings.gemini_api_key else "replay",
    }


@router.get("/calls")
def list_sample_calls():
    manifest_path = settings.samples_dir / "manifest.json"
    if not manifest_path.is_file():
        raise HTTPException(status_code=404, detail="Manifest file not found")
    with open(manifest_path, "r", encoding="utf-8") as f:
        calls = json.load(f)
    return calls


@router.get("/calls/{call_id}/audio")
def get_call_audio(call_id: str):
    wav_path = settings.calls_dir / f"{call_id}.wav"
    if not wav_path.is_file():
        raise HTTPException(status_code=404, detail=f"Audio file for {call_id} not found")
    return FileResponse(
        path=str(wav_path),
        media_type="audio/wav",
        filename=f"{call_id}.wav",
    )


@router.post("/alerts/emergency")
def send_emergency_alert(payload: EmergencyAlertRequest):
    result = AlertStub.send_emergency_alert(
        contact_phone=payload.contact_phone,
        relationship=payload.relationship,
        elder_name=payload.elder_name,
        detected_flags=payload.detected_flags,
    )
    return result


@router.get("/calls/{call_id}/stream")
async def stream_call_analysis(
    call_id: str,
    mode: str = Query("replay", description="Execution mode: 'live' or 'replay'"),
    lang: str = Query("gu", description="Language: 'gu', 'hi', or 'en'"),
    delay_per_chunk: float = Query(1.8, description="Pacing delay between chunks in seconds"),
    emergency_contact: str = Query("+91 98765 43210", description="Saved emergency phone number"),
    relationship: str = Query("Son", description="Family relationship"),
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits typed events:
    - call_started
    - chunk_analysis
    - level_changed
    - scam_detected
    - alert_sent (simulated emergency message)
    - call_ended
    """
    wav_path = settings.calls_dir / f"{call_id}.wav"
    if not wav_path.is_file():
        raise HTTPException(status_code=404, detail=f"Audio file for {call_id} not found")

    # Determine execution mode: if live requested but no API key, auto-fallback to replay
    active_mode = mode
    if active_mode == "live" and not settings.gemini_api_key:
        logger.info(f"No GEMINI_API_KEY present; auto-fallback to replay mode for {call_id}")
        active_mode = "replay"

    async def event_generator():
        chunks = list(
            AudioChunker.slice_wav_file(
                wav_path,
                chunk_duration_sec=settings.chunk_seconds,
                overlap_sec=settings.overlap_seconds,
            )
        )
        total_chunks = len(chunks)
        state = CallState()
        scam_already_flagged = False
        cached_chunks = replay_cache.load_call_cache(call_id) if active_mode == "replay" else []

        # 1. Event: call_started
        started_event = CallStartedData(call_id=call_id, total_chunks=total_chunks, mode=active_mode)
        yield f"event: call_started\ndata: {started_event.model_dump_json()}\n\n"

        for idx, t_start, t_end, wav_bytes in chunks:
            analysis: Optional[ChunkAnalysis] = None
            previous_level = state.level

            # Analyze Chunk (via Replay Cache or Live Gemini)
            if active_mode == "replay" and idx < len(cached_chunks):
                analysis = cached_chunks[idx]
            else:
                # Live Gemini Audio analysis
                analysis = await gemini_service.analyze_chunk(
                    wav_bytes=wav_bytes,
                    prior_summary=state.summary,
                    chunk_index=idx,
                    call_id=call_id,
                    expected_lang=lang,
                )
                # Auto-fallback to cache if consecutive failures >= 2
                if gemini_service.consecutive_failures >= 2 and idx < len(cached_chunks):
                    logger.warning(f"Consecutive Gemini failures; falling back to replay cache for chunk {idx}")
                    analysis = cached_chunks[idx]

            if not analysis:
                analysis = ChunkAnalysis(
                    transcript="[Audio chunk processed]",
                    language=lang,
                    flags=[],
                    summary_so_far=state.summary,
                )

            # Update Risk Engine state machine
            state, newly_accepted_flags, level_changed = RiskEngine.update(
                state=state,
                analysis=analysis,
                chunk_duration_sec=settings.chunk_seconds,
            )

            # 2. Event: chunk_analysis
            chunk_event = ChunkAnalysisData(
                index=idx,
                t_start=t_start,
                t_end=t_end,
                transcript=analysis.transcript,
                new_flags=newly_accepted_flags,
                state=state,
            )
            yield f"event: chunk_analysis\ndata: {chunk_event.model_dump_json()}\n\n"

            # 3. Event: level_changed (if level transitioned)
            if level_changed:
                level_event = LevelChangedData(
                    level=state.level,
                    previous_level=previous_level,
                    score=state.score,
                )
                yield f"event: level_changed\ndata: {level_event.model_dump_json()}\n\n"

            # 4. Event: scam_detected + alert_sent (on reaching SCAM level)
            if state.level == Level.SCAM and not scam_already_flagged:
                scam_already_flagged = True
                scam_event = ScamDetectedData(
                    flags=state.flags,
                    evidence=[e.get("evidence", "") for e in state.all_evidence],
                    t=t_end,
                )
                yield f"event: scam_detected\ndata: {scam_event.model_dump_json()}\n\n"

                # Send simulated emergency alert
                alert_result = AlertStub.send_emergency_alert(
                    contact_phone=emergency_contact,
                    relationship=relationship,
                    detected_flags=[f.value for f in state.flags],
                )
                alert_event = AlertSentData(
                    contact=alert_result["contact"],
                    message=alert_result["message"],
                    simulated=True,
                )
                yield f"event: alert_sent\ndata: {alert_event.model_dump_json()}\n\n"

            # Pace chunks so presentation flows like a real incoming call
            await asyncio.sleep(delay_per_chunk)

        # 5. Event: call_ended
        ended_event = CallEndedData(
            final_level=state.level,
            final_score=state.score,
            summary=state.summary or f"Call completed with status {state.level.value}",
        )
        yield f"event: call_ended\ndata: {ended_event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
