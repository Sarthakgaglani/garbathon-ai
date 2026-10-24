from typing import Optional, Tuple
from backend.app.domain.red_flags import CRITICAL_FLAGS, WEIGHTS, FlagType
from backend.app.domain.schemas import CallState, ChunkAnalysis, DetectedFlag, Level

CONFIDENCE_THRESHOLD = 0.6


class RiskEngine:
    """
    Deterministic risk scoring and state machine for scam call detection.
    Guarantees:
    1. Accumulate distinct flags only when confidence >= 0.6.
    2. SCAM if (>=2 distinct flags AND at least 1 CRITICAL) OR score >= 8.
    3. SUSPICIOUS if score >= 3.
    4. Strict hysteresis: SCAM can NEVER downgrade; SUSPICIOUS can NEVER drop to SAFE.
    5. A single authority/bank mention alone never triggers SCAM.
    """

    @staticmethod
    def update(
        state: CallState,
        analysis: ChunkAnalysis,
        chunk_duration_sec: float = 5.0,
    ) -> Tuple[CallState, list[DetectedFlag], Optional[Level]]:
        previous_level = state.level

        # 1. Update temporal stats
        state.chunk_index += 1
        state.duration_sec = state.chunk_index * chunk_duration_sec

        # 2. Update transcripts & claims
        if analysis.transcript and analysis.transcript.strip():
            state.transcript_history.append(analysis.transcript.strip())

        if analysis.speaker_claims_to_be:
            state.speaker_claims_to_be = analysis.speaker_claims_to_be

        if analysis.summary_so_far:
            state.summary = analysis.summary_so_far

        # 3. Filter flags with confidence >= 0.6
        existing_flags = set(state.flags)
        newly_accepted_flags: list[DetectedFlag] = []

        for flag in analysis.flags:
            if flag.confidence >= CONFIDENCE_THRESHOLD:
                if flag.type not in existing_flags:
                    existing_flags.add(flag.type)
                    newly_accepted_flags.append(flag)
                    state.all_evidence.append({
                        "type": flag.type.value,
                        "evidence": flag.evidence,
                        "confidence": flag.confidence,
                        "t": state.duration_sec,
                    })

        state.flags = list(existing_flags)

        # 4. Calculate score
        score = sum(WEIGHTS.get(f, 0) for f in existing_flags)
        state.score = score

        # 5. Evaluate target level
        has_critical = bool(existing_flags & CRITICAL_FLAGS)
        has_multiple_flags = len(existing_flags) >= 2

        if (has_multiple_flags and has_critical) or score >= 8:
            target_level = Level.SCAM
        elif score >= 3:
            target_level = Level.SUSPICIOUS
        else:
            target_level = Level.SAFE

        # 6. Apply strict hysteresis
        if state.level == Level.SCAM:
            pass  # Never downgrade from SCAM
        elif state.level == Level.SUSPICIOUS:
            state.level = max(Level.SUSPICIOUS, target_level)  # Can only stay or upgrade to SCAM
        else:
            state.level = target_level

        level_changed = state.level if state.level != previous_level else None
        return state, newly_accepted_flags, level_changed
