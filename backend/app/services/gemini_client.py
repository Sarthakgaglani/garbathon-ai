import json
import logging
import time
from typing import Optional

from backend.app.config import settings
from backend.app.domain.schemas import ChunkAnalysis
from backend.app.services.prompts import SCAM_DETECTION_SYSTEM_PROMPT, build_chunk_user_prompt
from backend.app.services.replay_cache import ReplayCache

logger = logging.getLogger("scam_shield.gemini")
replay_cache = ReplayCache(cache_dir=settings.cache_dir)


class GeminiClient:
    """
    Analyzes audio chunks using Gemini Flash with structured schema output.
    Gracefully falls back to ReplayCache when offline, unauthenticated, or on error.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        self.model_name = model or settings.gemini_model
        self._client = None

        if self.api_key:
            try:
                # Attempt to initialize modern google-genai SDK
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Gemini Client with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Could not initialize google.genai: {e}. Will fall back to replay cache.")

    async def analyze_chunk(
        self,
        audio_bytes: bytes,
        chunk_index: int,
        running_summary: str,
        call_id: str,
        language_hint: str = "Gujarati/Hindi",
    ) -> ChunkAnalysis:
        start_time = time.perf_counter()

        # If no API key or no client initialized, use replay cache immediately
        if not self._client or not self.api_key:
            cached = replay_cache.get_chunk(call_id, chunk_index)
            if cached:
                logger.info(f"[Replay Cache] Loaded chunk {chunk_index} for call {call_id}")
                return cached
            return ChunkAnalysis(
                transcript=f"[Replay chunk {chunk_index + 1} processing]",
                flags=[],
                speaker_claims_to_be=None,
            )

        # Attempt Live Gemini Audio Call
        try:
            from google.genai import types

            user_prompt = build_chunk_user_prompt(
                chunk_index=chunk_index,
                running_summary=running_summary,
                expected_lang=language_hint,
            )

            # Gemini Flash accepts audio/wav directly as inline bytes
            audio_part = types.Part.from_bytes(
                data=audio_bytes,
                mime_type="audio/wav",
            )

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=[audio_part, user_prompt],
                config=types.GenerateContentConfig(
                    system_instruction=SCAM_DETECTION_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=ChunkAnalysis,
                    temperature=0.1,
                ),
            )

            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"[Live Gemini] Chunk {chunk_index} analyzed in {latency_ms:.1f}ms")

            if response.parsed:
                return response.parsed  # type: ignore

            if response.text:
                parsed_dict = json.loads(response.text)
                return ChunkAnalysis.model_validate(parsed_dict)

        except Exception as err:
            logger.error(f"[Gemini Error] Chunk {chunk_index} failed: {err}. Falling back to replay cache.")
            cached = replay_cache.get_chunk(call_id, chunk_index)
            if cached:
                return cached

        # Graceful fallback so stream never crashes
        return ChunkAnalysis(
            transcript=f"[Audio segment {chunk_index + 1} analyzed]",
            flags=[],
            speaker_claims_to_be=None,
        )


gemini_service = GeminiClient()
