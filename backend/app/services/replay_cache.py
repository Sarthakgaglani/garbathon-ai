import json
from pathlib import Path
from typing import Optional
from backend.app.domain.schemas import ChunkAnalysis


class ReplayCache:
    """
    Manages pre-computed chunk analyses in samples/cache/{call_id}.json.
    Ensures 100% offline reliability for live presentations and offline judges.
    """

    def __init__(self, cache_dir: str | Path = "samples/cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_cache_path(self, call_id: str) -> Path:
        return self.cache_dir / f"{call_id}.json"

    def has_cache(self, call_id: str) -> bool:
        return self.get_cache_path(call_id).is_file()

    def load_call_cache(self, call_id: str) -> list[ChunkAnalysis]:
        cache_path = self.get_cache_path(call_id)
        if not cache_path.is_file():
            return []
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            chunks = [ChunkAnalysis.model_validate(c) for c in data.get("chunks", [])]
            return chunks
        except Exception as e:
            print(f"Error loading cache for {call_id}: {e}")
            return []

    def get_chunk(self, call_id: str, chunk_index: int) -> Optional[ChunkAnalysis]:
        chunks = self.load_call_cache(call_id)
        if 0 <= chunk_index < len(chunks):
            return chunks[chunk_index]
        return None

    def save_call_cache(self, call_id: str, chunks: list[ChunkAnalysis], metadata: Optional[dict] = None) -> None:
        cache_path = self.get_cache_path(call_id)
        payload = {
            "call_id": call_id,
            "metadata": metadata or {},
            "chunks": [c.model_dump() for c in chunks],
        }
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
