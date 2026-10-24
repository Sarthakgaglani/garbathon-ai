from backend.app.domain.red_flags import CRITICAL_FLAGS, WEIGHTS, FlagType
from backend.app.domain.schemas import CallState, ChunkAnalysis, Level


class RiskEngine:
    """
    Deterministic risk scoring and state machine for scam call detection.
    Enforces strict hysteresis: SAFE -> SUSPICIOUS -> SCAM.
    A state, once upgraded to SCAM, can NEVER downgrade mid-call.
    """

    @staticmethod
    def update(state: CallState, analysis: ChunkAnalysis, chunk_duration_sec: float = 5.0) -> CallState:
        # 1. Increment chunk index and duration
        state.chunk_index += 1
        state.duration_sec = state.chunk_index * chunk_duration_sec

        # 2. Update transcripts
        if analysis.transcript and analysis.transcript.strip():
            state.transcript_history.append(analysis.transcript.strip())

        # 3. Update claimed identity if found
        if analysis.speaker_claims_to_be:
            state.speaker_claims_to_be = analysis.speaker_claims_to_be

        # 4. Accumulate distinct flags
        existing_flag_set = set(state.flags)
        for flag in analysis.flags:
            existing_flag_set.add(flag.type)
            state.all_detected_flags.append(flag)
        state.flags = list(existing_flag_set)

        # 5. Compute deterministic score based on distinct accumulated flags
        score = sum(WEIGHTS.get(flag_type, 0) for flag_type in existing_flag_set)
        state.score = score

        # 6. Evaluate state machine thresholds
        has_critical = bool(existing_flag_set & CRITICAL_FLAGS)
        has_multiple_signals = len(existing_flag_set) >= 2

        if (has_critical and has_multiple_signals) or score >= 8:
            new_level = Level.SCAM
        elif score >= 3:
            new_level = Level.SUSPICIOUS
        else:
            new_level = Level.SAFE

        # 7. Apply hysteresis (never downgrade)
        if state.level == Level.SCAM:
            pass  # Already SCAM, never change
        elif new_level > state.level:
            state.level = new_level

        # 8. Update running summary
        flags_str = ", ".join(f.value for f in state.flags) if state.flags else "none"
        claims = state.speaker_claims_to_be or "Unspecified"
        state.running_summary = (
            f"Speaker claimed: {claims}. Flags observed: [{flags_str}]. "
            f"Current Risk Level: {state.level.value} (Score: {state.score})."
        )

        return state
