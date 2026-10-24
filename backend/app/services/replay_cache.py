import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.app.domain.schemas import ChunkAnalysis

logger = logging.getLogger("scam_shield.cache")


class ReplayCache:
    """
    Loads and persists precomputed chunk analyses from samples/cache/{id}.json.
    Ensures zero-config offline execution for presentations and evaluations.
    """

    def __init__(self, cache_dir: str | Path = "samples/cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_cache_path(self, call_id: str) -> Path:
        return self.cache_dir / f"{call_id}.json"

    def has_cache(self, call_id: str) -> bool:
        return self.get_cache_path(call_id).is_file()

    def load_call_cache(self, call_id: str) -> List[ChunkAnalysis]:
        cache_path = self.get_cache_path(call_id)
        if not cache_path.is_file():
            logger.warning(f"No cache file found at {cache_path}")
            return []
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            chunks_raw = data.get("chunks", [])
            return [ChunkAnalysis.model_validate(c) for c in chunks_raw]
        except Exception as e:
            logger.error(f"Failed to read cache for {call_id}: {e}")
            return []

    def get_chunk(self, call_id: str, chunk_index: int) -> Optional[ChunkAnalysis]:
        chunks = self.load_call_cache(call_id)
        if 0 <= chunk_index < len(chunks):
            return chunks[chunk_index]
        return None

    def save_call_cache(
        self,
        call_id: str,
        chunks: List[ChunkAnalysis],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        cache_path = self.get_cache_path(call_id)
        payload = {
            "call_id": call_id,
            "metadata": metadata or {},
            "total_chunks": len(chunks),
            "chunks": [c.model_dump() for c in chunks],
        }
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(chunks)} cached chunks to {cache_path}")
