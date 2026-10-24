from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
from backend.app.domain.red_flags import FlagType


class Level(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    SCAM = "SCAM"

    def rank(self) -> int:
        ranks = {Level.SAFE: 1, Level.SUSPICIOUS: 2, Level.SCAM: 3}
        return ranks[self]

    def __ge__(self, other: "Level") -> bool:
        if self.__class__ is other.__class__:
            return self.rank() >= other.rank()
        return NotImplemented

    def __gt__(self, other: "Level") -> bool:
        if self.__class__ is other.__class__:
            return self.rank() > other.rank()
        return NotImplemented

    def __le__(self, other: "Level") -> bool:
        if self.__class__ is other.__class__:
            return self.rank() <= other.rank()
        return NotImplemented

    def __lt__(self, other: "Level") -> bool:
        if self.__class__ is other.__class__:
            return self.rank() < other.rank()
        return NotImplemented


class DetectedFlag(BaseModel):
    type: FlagType
    evidence: str = Field(description="Short quote from audio in original spoken language")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")


class ChunkAnalysis(BaseModel):
    transcript: str = Field(default="", description="Verbatim transcript in original script")
    language: str = Field(default="gu", description="Language of chunk (gu, hi, or en)")
    flags: list[DetectedFlag] = Field(default_factory=list, description="Detected scam red flags in this chunk")
    speaker_claims_to_be: Optional[str] = Field(default=None, description="Who speaker claims to be (Police, CBI, Courier, Bank, etc.)")
    summary_so_far: str = Field(default="", description="1-2 line summary of conversation so far")


class CallState(BaseModel):
    level: Level = Level.SAFE
    flags: list[FlagType] = Field(default_factory=list, description="Accumulated distinct flags (confidence >= 0.6)")
    score: int = 0
    summary: str = ""
    chunk_index: int = 0
    duration_sec: float = 0.0
    speaker_claims_to_be: Optional[str] = None
    transcript_history: list[str] = Field(default_factory=list)
    all_evidence: list[dict[str, Any]] = Field(default_factory=list)


# --- Typed SSE Event Models ---

class CallStartedData(BaseModel):
    call_id: str
    total_chunks: int
    mode: str = "live"


class ChunkAnalysisData(BaseModel):
    index: int
    t_start: float
    t_end: float
    transcript: str
    new_flags: list[DetectedFlag]
    state: CallState


class LevelChangedData(BaseModel):
    level: Level
    previous_level: Level
    score: int


class ScamDetectedData(BaseModel):
    flags: list[FlagType]
    evidence: list[str]
    t: float


class AlertSentData(BaseModel):
    contact: str
    message: str
    simulated: bool = True


class CallEndedData(BaseModel):
    final_level: Level
    final_score: int
    summary: str


class ErrorData(BaseModel):
    code: str
    message: str
    recoverable: bool = True
