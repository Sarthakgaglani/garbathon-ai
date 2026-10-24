import asyncio
import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from backend.app.config import settings
from backend.app.domain.risk_engine import RiskEngine
from backend.app.domain.schemas import CallState, Level, StreamEvent
from backend.app.services.audio_chunker import AudioChunker
from backend.app.services.gemini_client import gemini_service

logger = logging.getLogger("scam_shield.routes")
router = APIRouter(prefix="/api")


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Scam Call Shield API",
        "gemini_model": settings.gemini_model,
        "live_gemini_active": bool(settings.gemini_api_key),
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


@router.get("/calls/{call_id}/stream")
async def stream_call_analysis(call_id: str, delay_per_chunk: float = 2.0):
    """
    SSE stream yielding chunk-by-chunk scam detection analysis and updated risk state.
    `delay_per_chunk` provides a realistic pace for demo presentation (default 2.0 seconds).
    """
    wav_path = settings.calls_dir / f"{call_id}.wav"
    if not wav_path.is_file():
        raise HTTPException(status_code=404, detail=f"Audio sample for call {call_id} not found")

    async def event_generator():
        state = CallState(call_id=call_id, level=Level.SAFE)
        chunks = list(AudioChunker.slice_wav_file(wav_path, chunk_duration_sec=settings.audio_chunk_duration_sec))
        total_chunks = len(chunks)

        logger.info(f"Starting SSE stream for {call_id} ({total_chunks} chunks)")

        for index, (chunk_idx, start_time, chunk_bytes) in enumerate(chunks):
            is_last = (index == total_chunks - 1)

            # Analyze chunk via Gemini (or cached replay)
            analysis = await gemini_service.analyze_chunk(
                audio_bytes=chunk_bytes,
                chunk_index=chunk_idx,
                running_summary=state.running_summary,
                call_id=call_id,
            )

            # Update deterministic risk state machine
            state = RiskEngine.update(
                state=state,
                analysis=analysis,
                chunk_duration_sec=settings.audio_chunk_duration_sec,
            )

            logger.info(
                f"[{call_id}] Chunk {chunk_idx + 1}/{total_chunks} -> "
                f"Level: {state.level.value}, Score: {state.score}, Flags: {[f.value for f in state.flags]}"
            )

            event_payload = StreamEvent(
                type="chunk_update",
                state=state,
                chunk=analysis,
                is_final=is_last,
            )

            payload_json = json.dumps(event_payload.model_dump(), ensure_ascii=False)
            yield f"event: chunk_update\ndata: {payload_json}\n\n"

            # Wait between chunks so the user & judges see real-time phone progression
            if not is_last:
                await asyncio.sleep(delay_per_chunk)

        # Final completion event
        final_json = json.dumps({"call_id": call_id, "final_level": state.level.value, "final_score": state.score})
        yield f"event: call_completed\ndata: {final_json}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
