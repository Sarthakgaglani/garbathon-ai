import asyncio
import json
import logging
import time
from typing import Optional

from backend.app.config import settings
from backend.app.domain.schemas import ChunkAnalysis
from backend.app.services.prompts import SCAM_DETECTION_SYSTEM_PROMPT, build_chunk_user_prompt
from backend.app.services.replay_cache import ReplayCache

logger = logging.getLogger("scam_shield.gemini")


class GeminiClient:
    """
    Client for analyzing audio chunks via Google Gemini with structured JSON output.
    Features:
    - 8s timeout with 1 retry.
    - Fallback model (GEMINI_FALLBACK_MODEL) on error.
    - Skip-chunk empty fallback to ensure stream never crashes.
    - Tracks consecutive failures for transparent replay mode fallback.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        fallback_model: Optional[str] = None,
    ):
        self.api_key = api_key or settings.gemini_api_key
        self.primary_model = model or settings.gemini_model
        self.fallback_model = fallback_model or settings.gemini_fallback_model
        self.consecutive_failures = 0
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized with primary model: {self.primary_model}")
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")

    def _call_model(self, model_name: str, wav_bytes: bytes, prompt_text: str) -> Optional[ChunkAnalysis]:
        from google.genai import types

        audio_part = types.Part.from_bytes(
            data=wav_bytes,
            mime_type="audio/wav",
        )

        response = self._client.models.generate_content(
            model=model_name,
            contents=[audio_part, prompt_text],
            config=types.GenerateContentConfig(
                system_instruction=SCAM_DETECTION_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ChunkAnalysis,
                temperature=0.1,
            ),
        )

        if response.parsed:
            return response.parsed  # type: ignore
        if response.text:
            data = json.loads(response.text)
            return ChunkAnalysis.model_validate(data)
        return None

    async def analyze_chunk(
        self,
        wav_bytes: bytes,
        prior_summary: str = "",
        chunk_index: int = 0,
        call_id: str = "",
        expected_lang: str = "Gujarati/Hindi/English",
    ) -> ChunkAnalysis:
        """
        Public analyze_chunk method. Slices through Gemini with 8s timeout,
        one retry, fallback model, and safe fallback ChunkAnalysis on failure.
        """
        start_time = time.perf_counter()

        # If no client or no API key, skip immediately
        if not self._client or not self.api_key:
            logger.debug("No Gemini API key available; returning empty ChunkAnalysis")
            return ChunkAnalysis(
                transcript="[Audio processing in replay mode]",
                language="gu",
                flags=[],
                summary_so_far=prior_summary,
            )

        prompt_text = build_chunk_user_prompt(
            chunk_index=chunk_index,
            rolling_summary=prior_summary,
            expected_lang=expected_lang,
        )

        # Attempt 1: Primary Model (with 8s timeout)
        for attempt in (1, 2):
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(self._call_model, self.primary_model, wav_bytes, prompt_text),
                    timeout=8.0,
                )
                if result:
                    self.consecutive_failures = 0
                    latency = (time.perf_counter() - start_time) * 1000
                    logger.info(
                        f"[Gemini Primary] Chunk {chunk_index} analyzed in {latency:.0f}ms | Flags: {len(result.flags)}"
                    )
                    return result
            except Exception as e:
                logger.warning(f"Primary model attempt {attempt} failed: {e}")
                await asyncio.sleep(0.3)

        # Attempt 2: Fallback Model
        try:
            logger.info(f"Trying fallback model: {self.fallback_model}")
            fallback_result = await asyncio.wait_for(
                asyncio.to_thread(self._call_model, self.fallback_model, wav_bytes, prompt_text),
                timeout=8.0,
            )
            if fallback_result:
                self.consecutive_failures = 0
                return fallback_result
        except Exception as e:
            logger.error(f"Fallback model failed: {e}")

        # If both fail, increment consecutive failures and return empty ChunkAnalysis
        self.consecutive_failures += 1
        logger.warning(
            f"All Gemini attempts failed for chunk {chunk_index} (consecutive failures: {self.consecutive_failures}). Skipping chunk."
        )

        return ChunkAnalysis(
            transcript="[Chunk skipped due to analysis timeout]",
            language="gu",
            flags=[],
            summary_so_far=prior_summary,
        )


gemini_service = GeminiClient()
