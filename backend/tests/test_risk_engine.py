import pytest
from backend.app.domain.red_flags import FlagType
from backend.app.domain.schemas import CallState, ChunkAnalysis, DetectedFlag, Level
from backend.app.domain.risk_engine import RiskEngine


def test_genuine_swiggy_delivery_stays_safe():
    """
    Genuine Call: Swiggy delivery partner calling customer.
    Must stay SAFE the whole time and never reach SCAM.
    """
    state = CallState()

    chunk1 = ChunkAnalysis(
        transcript="Hello sir, Swiggy delivery partner calling. I have arrived at your apartment gate.",
        language="en",
        flags=[],
        speaker_claims_to_be="Swiggy Delivery Partner",
        summary_so_far="Delivery driver calling from apartment gate.",
    )
    state, new_flags, changed = RiskEngine.update(state, chunk1)
    assert state.level == Level.SAFE
    assert state.score == 0
    assert len(state.flags) == 0

    chunk2 = ChunkAnalysis(
        transcript="Can you please confirm your flat number? Is it 302 on the third floor?",
        language="en",
        flags=[],
        speaker_claims_to_be="Swiggy Delivery Partner",
        summary_so_far="Driver confirming flat number 302.",
    )
    state, new_flags, changed = RiskEngine.update(state, chunk2)
    assert state.level == Level.SAFE
    assert state.score == 0

    chunk3 = ChunkAnalysis(
        transcript="Thank you sir, I have left the food package with the security guard as requested. Have a good evening.",
        language="en",
        flags=[],
        speaker_claims_to_be="Swiggy Delivery Partner",
        summary_so_far="Food delivered to security guard.",
    )
    state, new_flags, changed = RiskEngine.update(state, chunk3)
    assert state.level == Level.SAFE
    assert state.score == 0
    assert state.level != Level.SCAM


def test_scam_digital_arrest_reaches_scam():
    """
    Digital arrest scam call in Gujarati/Hindi:
    Authority -> Threat -> Isolation -> Money Request -> SCAM.
    """
    state = CallState()

    # Chunk 1: Authority claim
    chunk1 = ChunkAnalysis(
        transcript="હું મુંબઈ ક્રાઈમ બ્રાન્ચમાંથી ઇન્સ્પેક્ટર રાઠોડ બોલું છું.",
        language="gu",
        flags=[DetectedFlag(type=FlagType.AUTHORITY_CLAIM, evidence="ઇન્સ્પેક્ટર રાઠોડ ક્રાઈમ બ્રાન્ચ", confidence=0.95)],
        speaker_claims_to_be="Crime Branch Police",
    )
    state, new_flags, changed = RiskEngine.update(state, chunk1)
    assert state.level == Level.SAFE  # Weight 2 < 3 -> SAFE
    assert state.score == 2

    # Chunk 2: Legal threat
    chunk2 = ChunkAnalysis(
        transcript="તમારા નામના પાર્સલમાંથી નશીલા પદાર્થો મળ્યા છે. સુપ્રીમ કોર્ટનું ધરપકડ વોરંટ નીકળ્યું છે.",
        language="gu",
        flags=[DetectedFlag(type=FlagType.THREAT, evidence="ધરપકડ વોરંટ નીકળ્યું છે", confidence=0.92)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk2)
    # Authority (2) + Threat (2) = 4 >= 3 -> SUSPICIOUS
    assert state.level == Level.SUSPICIOUS
    assert state.score == 4

    # Chunk 3: Isolation
    chunk3 = ChunkAnalysis(
        transcript="દરવાજો બંધ કરી દો, કોઈને જણાવશો નહીં, આ ડિજિટલ અરેસ્ટ છે.",
        language="gu",
        flags=[DetectedFlag(type=FlagType.ISOLATION, evidence="કોઈને જણાવશો નહીં ડિજિટલ અરેસ્ટ", confidence=0.96)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk3)
    # Authority (2) + Threat (2) + Isolation (3, CRITICAL) = 7
    # >=2 distinct flags and at least 1 CRITICAL -> SCAM!
    assert state.level == Level.SCAM

    # Chunk 4: Money request
    chunk4 = ChunkAnalysis(
        transcript="તરત જ ₹1,50,000 ટ્રાન્સફર કરો કેસ રદ કરવા માટે.",
        language="gu",
        flags=[DetectedFlag(type=FlagType.MONEY_REQUEST, evidence="₹1,50,000 ટ્રાન્સફર કરો", confidence=0.98)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk4)
    assert state.level == Level.SCAM
    assert state.score == 11


def test_scam_electricity_kyc_reaches_scam():
    """
    Electricity bill cutoff urgency + OTP request -> SCAM.
    """
    state = CallState()

    chunk1 = ChunkAnalysis(
        transcript="बिजली विभाग से बोल रहे हैं, आज रात 9:30 बजे बिजली कट जाएगी.",
        language="hi",
        flags=[
            DetectedFlag(type=FlagType.AUTHORITY_CLAIM, evidence="बिजली विभाग से बोल रहे हैं", confidence=0.9),
            DetectedFlag(type=FlagType.URGENCY, evidence="आज रात 9:30 बजे बिजली कट जाएगी", confidence=0.88),
        ],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk1)
    # Authority (2) + Urgency (1) = 3 -> SUSPICIOUS
    assert state.level == Level.SUSPICIOUS

    chunk2 = ChunkAnalysis(
        transcript="जल्दी से मोबाइल पर आया 6-डिजिट OTP बताओ वरना लाइट कट जाएगी.",
        language="hi",
        flags=[DetectedFlag(type=FlagType.OTP_REQUEST, evidence="6-डिजिट OTP बताओ", confidence=0.95)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk2)
    # Authority (2) + Urgency (1) + OTP (4, CRITICAL) = 7
    # Multiple distinct flags + OTP critical -> SCAM!
    assert state.level == Level.SCAM


def test_scam_bank_lottery_reaches_scam():
    """
    Lottery claim + Upfront money request -> SCAM.
    """
    state = CallState()

    chunk1 = ChunkAnalysis(
        transcript="Congratulations, State Bank lucky draw lottery 25 Lakh won. Valid today only.",
        language="en",
        flags=[
            DetectedFlag(type=FlagType.AUTHORITY_CLAIM, evidence="State Bank lucky draw", confidence=0.85),
            DetectedFlag(type=FlagType.URGENCY, evidence="Valid today only", confidence=0.8),
        ],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk1)
    assert state.level == Level.SUSPICIOUS

    chunk2 = ChunkAnalysis(
        transcript="Transfer 5000 rupees registration fee to UPI to release cheque.",
        language="en",
        flags=[DetectedFlag(type=FlagType.MONEY_REQUEST, evidence="Transfer 5000 rupees to UPI", confidence=0.92)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk2)
    assert state.level == Level.SCAM


def test_confidence_filtering():
    """
    Flags with confidence < 0.6 must be ignored by the risk engine.
    """
    state = CallState()
    chunk = ChunkAnalysis(
        transcript="Maybe something suspicious.",
        language="en",
        flags=[DetectedFlag(type=FlagType.MONEY_REQUEST, evidence="unclear money whisper", confidence=0.45)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk)
    assert state.score == 0
    assert len(state.flags) == 0
    assert state.level == Level.SAFE


def test_single_bank_mention_never_scams():
    """
    A single authority/bank mention alone (score = 2) must never reach SCAM.
    """
    state = CallState()
    chunk = ChunkAnalysis(
        transcript="This is State Bank of India customer care verifying an ATM card delivery.",
        language="en",
        flags=[DetectedFlag(type=FlagType.AUTHORITY_CLAIM, evidence="State Bank of India customer care", confidence=0.9)],
    )
    state, new_flags, changed = RiskEngine.update(state, chunk)
    assert state.score == 2
    assert state.level == Level.SAFE
    assert state.level != Level.SCAM


def test_hysteresis_preserves_scam_and_suspicious():
    """
    SCAM can never downgrade to SUSPICIOUS or SAFE.
    SUSPICIOUS can never downgrade to SAFE.
    """
    state = CallState(level=Level.SUSPICIOUS)
    # Silent chunk
    chunk_benign = ChunkAnalysis(transcript="Silence", language="en", flags=[])
    state, _, _ = RiskEngine.update(state, chunk_benign)
    assert state.level == Level.SUSPICIOUS, "SUSPICIOUS was downgraded to SAFE!"

    # Elevate to SCAM
    state.level = Level.SCAM
    state, _, _ = RiskEngine.update(state, chunk_benign)
    assert state.level == Level.SCAM, "SCAM was downgraded!"
