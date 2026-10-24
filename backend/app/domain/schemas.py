from enum import Enum
from typing import Optional
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
    evidence: str = Field(description="Short quote from audio, in original language spoken")
    explanation_gu: str = Field(description="One simple sentence in Gujarati explaining the risk to an elder")
    explanation_hi: str = Field(description="One simple sentence in Hindi explaining the risk to an elder")
    explanation_en: str = Field(default="", description="One simple sentence in English")


class ChunkAnalysis(BaseModel):
    transcript: str = Field(description="Verbatim or close transcript of the chunk audio")
    flags: list[DetectedFlag] = Field(default_factory=list, description="List of detected scam flags in this chunk")
    speaker_claims_to_be: Optional[str] = Field(default=None, description="Who the caller claims to represent (e.g. Police, Bank, Courier)")


class CallState(BaseModel):
    call_id: str
    chunk_index: int = 0
    duration_sec: float = 0.0
    level: Level = Level.SAFE
    score: int = 0
    flags: list[FlagType] = Field(default_factory=list)
    all_detected_flags: list[DetectedFlag] = Field(default_factory=list)
    transcript_history: list[str] = Field(default_factory=list)
    speaker_claims_to_be: Optional[str] = None
    running_summary: str = ""


class StreamEvent(BaseModel):
    type: str = "chunk_update"
    state: CallState
    chunk: ChunkAnalysis
    is_final: bool = False
