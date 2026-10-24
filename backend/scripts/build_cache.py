"""
CLI script to build or refresh precomputed chunk analysis cache in samples/cache/{id}.json.
Usage:
    python backend/scripts/build_cache.py [--live]
"""
import argparse
import asyncio
import json
import logging
from pathlib import Path

from backend.app.config import settings
from backend.app.services.audio_chunker import AudioChunker
from backend.app.services.gemini_client import gemini_service
from backend.app.services.replay_cache import ReplayCache

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("build_cache")


async def build_cache_for_call(call_id: str, live: bool = False):
    wav_path = settings.calls_dir / f"{call_id}.wav"
    cache = ReplayCache(cache_dir=settings.cache_dir)

    if not wav_path.is_file():
        logger.error(f"WAV file not found: {wav_path}")
        return

    logger.info(f"Processing call: {call_id} (live={live})")
    chunks = list(AudioChunker.slice_wav_file(wav_path, chunk_duration_sec=settings.chunk_seconds, overlap_sec=settings.overlap_seconds))
    logger.info(f"Sliced {len(chunks)} chunks for {call_id}")

    if not live:
        # Verify existing cache
        existing = cache.load_call_cache(call_id)
        logger.info(f"Replay cache has {len(existing)} precomputed chunks for {call_id}")
        return

    # Live pipeline via Gemini
    analyzed_chunks = []
    summary = ""
    for idx, t_start, t_end, wav_bytes in chunks:
        logger.info(f"Analyzing chunk {idx} ({t_start:.1f}s - {t_end:.1f}s)...")
        analysis = await gemini_service.analyze_chunk(
            wav_bytes=wav_bytes,
            prior_summary=summary,
            chunk_index=idx,
            call_id=call_id,
        )
        analyzed_chunks.append(analysis)
        summary = analysis.summary_so_far

    cache.save_call_cache(call_id, analyzed_chunks, metadata={"built_via": "gemini_live"})
    logger.info(f"Cache successfully generated and saved for {call_id}")


async def main():
    parser = argparse.ArgumentParser(description="Build or verify Scam Call Shield cache")
    parser.add_argument("--live", action="store_true", help="Run live Gemini analysis instead of dry check")
    parser.add_argument("--call-id", type=str, default="", help="Specific call ID to process")
    args = parser.parse_args()

    manifest_file = settings.samples_dir / "manifest.json"
    with open(manifest_file, "r", encoding="utf-8") as f:
        calls = json.load(f)

    for item in calls:
        cid = item["id"]
        if args.call_id and args.call_id != cid:
            continue
        await build_cache_for_call(cid, live=args.live)


if __name__ == "__main__":
    asyncio.run(main())
