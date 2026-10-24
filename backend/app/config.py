import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"          # Free tier: 1500 req/day, 1M TPM
    gemini_fallback_model: str = "gemini-2.0-flash-lite"  # Free tier fallback
    chunk_seconds: float = 5.0
    overlap_seconds: float = 0.5
    default_mode: str = "replay"  # "live" or "replay"
    port: int = 8000
    host: str = "0.0.0.0"

    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    samples_dir: Path = Path(__file__).resolve().parent.parent.parent / "samples"
    calls_dir: Path = Path(__file__).resolve().parent.parent.parent / "samples" / "calls"
    cache_dir: Path = Path(__file__).resolve().parent.parent.parent / "samples" / "cache"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
