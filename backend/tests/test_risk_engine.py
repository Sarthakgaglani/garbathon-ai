import pytest
from backend.app.domain.red_flags import FlagType
from backend.app.domain.schemas import CallState, ChunkAnalysis, DetectedFlag, Level
from backend.app.domain.risk_engine import RiskEngine


def test_genuine_bank_call_never_reaches_scam():
    """
    Test Case 1: Genuine Bank Support Call.
    Bank customer care states they are from HDFC bank, verifies recent transaction,
    reminds customer NEVER to share OTP.
    Expected: Remains SAFE (or at most low score), NEVER reaches SCAM.
    """
    state = CallState(call_id="genuine_bank_support")

    chunk1 = ChunkAnalysis(
        transcript="Namaste sir, this is Priya calling from HDFC Bank customer support regarding your branch query.",
        flags=[
            DetectedFlag(
                type=FlagType.AUTHORITY_CLAIM,
                evidence="HDFC Bank customer support",
                explanation_gu="કૉલ કરનાર બેંક કર્મચારી હોવાનો દાવો કરે છે.",
                explanation_hi="कॉलर बैंक कर्मचारी होने का दावा कर रहा है.",
            )
        ],
        speaker_claims_to_be="HDFC Bank Support",
    )
    state = RiskEngine.update(state, chunk1)
    assert state.level == Level.SAFE  # Authority alone (weight 2) < 3 -> SAFE
    assert state.score == 2

    # Chunk 2 has no flags (just verifying an address)
    chunk2 = ChunkAnalysis(
        transcript="I am confirming your recent address change request from yesterday.",
        flags=[],
        speaker_claims_to_be="HDFC Bank Support",
    )
    state = RiskEngine.update(state, chunk2)
    assert state.level == Level.SAFE
    assert state.score == 2

    # Chunk 3 reiterates bank safety advice (no scam flags)
    chunk3 = ChunkAnalysis(
        transcript="Please remember that HDFC Bank never asks for your OTP, CVV or password. Have a good day.",
        flags=[],
        speaker_claims_to_be="HDFC Bank Support",
    )
    state = RiskEngine.update(state, chunk3)
    assert state.level == Level.SAFE
    assert state.level != Level.SCAM


def test_scam_digital_arrest_reaches_scam():
    """
    Test Case 2: Digital Arrest Scam.
    Caller claims to be Mumbai Police / CBI, threatens arrest over drugs in parcel,
    orders isolation, demands ₹1,50,000 security deposit.
    Expected: Transitions SAFE -> SUSPICIOUS -> SCAM.
    """
    state = CallState(call_id="scam_digital_arrest")

    # Chunk 1: Authority claim
    chunk1 = ChunkAnalysis(
        transcript="Hello, I am Inspector Rathore from Mumbai Crime Branch.",
        flags=[
            DetectedFlag(
                type=FlagType.AUTHORITY_CLAIM,
                evidence="Inspector Rathore from Mumbai Crime Branch",
                explanation_gu="પોલીસ અધિકારી હોવાનો દાવો કરે છે.",
                explanation_hi="पुलिस अधिकारी होने का दावा कर रहा है.",
            )
        ],
        speaker_claims_to_be="Mumbai Crime Branch",
    )
    state = RiskEngine.update(state, chunk1)
    assert state.level == Level.SAFE

    # Chunk 2: Threat of arrest
    chunk2 = ChunkAnalysis(
        transcript="A parcel in your name contains narcotics. An arrest warrant has been issued against your Aadhaar.",
        flags=[
            DetectedFlag(
                type=FlagType.THREAT,
                evidence="arrest warrant has been issued against your Aadhaar",
                explanation_gu="ધરપકડ કરવાની ધમકી આપી રહ્યા છે.",
                explanation_hi="गिरफ्तारी का वारंट जारी होने की धमकी दे रहा है.",
            )
        ],
    )
    state = RiskEngine.update(state, chunk2)
    # Score: 2 (authority) + 4 (threat) = 6 >= 3 -> SUSPICIOUS
    assert state.level == Level.SUSPICIOUS

    # Chunk 3: Isolation and Money transfer
    chunk3 = ChunkAnalysis(
        transcript="Go to a closed room, do not tell your family. Transfer 1.5 lakh rupees to RBI verification account immediately.",
        flags=[
            DetectedFlag(
                type=FlagType.ISOLATION,
                evidence="Go to a closed room, do not tell your family",
                explanation_gu="પરિવારથી છુપાવવા અને એકલા રહેવા દબાણ કરે છે.",
                explanation_hi="कमरा बंद रखने और परिवार को न बताने का दबाव बना रहा है.",
            ),
            DetectedFlag(
                type=FlagType.MONEY_REQUEST,
                evidence="Transfer 1.5 lakh rupees",
                explanation_gu="પૈસા ટ્રાન્સફર કરવાની માંગણી કરે છે.",
                explanation_hi="तुरंत पैसे ट्रांसफर करने की मांग कर रहा है.",
            ),
        ],
    )
    state = RiskEngine.update(state, chunk3)
    assert state.level == Level.SCAM
    assert state.score >= 8


def test_scam_electricity_kyc_reaches_scam():
    """
    Test Case 3: Electricity Bill Disconnection Scam.
    Caller claims power will be cut tonight at 9:30 PM, demands OTP to prevent disconnection.
    Expected: Transitions to SCAM.
    """
    state = CallState(call_id="scam_electricity_kyc")

    chunk1 = ChunkAnalysis(
        transcript="Dear customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill.",
        flags=[
            DetectedFlag(
                type=FlagType.AUTHORITY_CLAIM,
                evidence="Electricity board notification",
                explanation_gu="લાઈટ બિલ અધિકારી હોવાનો દાવો.",
                explanation_hi="बिजली विभाग से होने का दावा.",
            ),
            DetectedFlag(
                type=FlagType.URGENCY,
                evidence="disconnected tonight at 9:30 PM",
                explanation_gu="આજે રાત્રે લાઈટ કાપી નાખવાની ઉતાવળ કરે છે.",
                explanation_hi="आज रात बिजली काटने की जल्दबाजी दिखा रहा है.",
            ),
        ],
        speaker_claims_to_be="State Electricity Board",
    )
    state = RiskEngine.update(state, chunk1)
    assert state.level == Level.SUSPICIOUS  # Authority(2) + Urgency(2) = 4 >= 3

    chunk2 = ChunkAnalysis(
        transcript="To stop disconnection, quickly read out the 6-digit verification OTP received on your mobile.",
        flags=[
            DetectedFlag(
                type=FlagType.OTP_REQUEST,
                evidence="read out the 6-digit verification OTP",
                explanation_gu="ઓટીપી (OTP) માંગે છે જે ક્યારેય ન આપવો જોઈએ.",
                explanation_hi="मोबाइल पर आया 6-अंकों का OTP मांग रहा है.",
            )
        ],
    )
    state = RiskEngine.update(state, chunk2)
    # OTP_REQUEST is critical and distinct flags = {AUTHORITY, URGENCY, OTP} >= 2
    assert state.level == Level.SCAM


def test_scam_bank_lottery_reaches_scam():
    """
    Test Case 4: Fake Lottery / Account Block Scam.
    Demands processing fee via UPI to release ₹25 lakh prize.
    Expected: Transitions to SCAM.
    """
    state = CallState(call_id="scam_bank_lottery")

    chunk1 = ChunkAnalysis(
        transcript="Congratulations, you have won 25 lakh rupees lottery from government lucky draw!",
        flags=[
            DetectedFlag(
                type=FlagType.URGENCY,
                evidence="Claim before 5 PM today or prize lapses",
                explanation_gu="સમય મર્યાદાનું દબાણ કરે છે.",
                explanation_hi="समय सीमा का दबाव बना रहा है.",
            )
        ],
    )
    state = RiskEngine.update(state, chunk1)
    assert state.level == Level.SAFE

    chunk2 = ChunkAnalysis(
        transcript="Pay 5000 rupees government tax registration fee immediately to UPI ID to release the cheque.",
        flags=[
            DetectedFlag(
                type=FlagType.MONEY_REQUEST,
                evidence="Pay 5000 rupees immediately to UPI",
                explanation_gu="લોટરી માટે પૈસા ભરવાનું કહે છે.",
                explanation_hi="लॉटरी के लिए पैसे भरने को कह रहा है.",
            )
        ],
    )
    state = RiskEngine.update(state, chunk2)
    # Critical flag (MONEY_REQUEST) + multiple signals (URGENCY + MONEY_REQUEST)
    assert state.level == Level.SCAM


def test_hysteresis_never_downgrades():
    """
    Test Case 5: Hysteresis.
    Once a call reaches SCAM, subsequent benign chunks must never downgrade it to SAFE or SUSPICIOUS.
    """
    state = CallState(call_id="test_hysteresis")
    scam_chunk = ChunkAnalysis(
        transcript="Send money right now or go to jail.",
        flags=[
            DetectedFlag(
                type=FlagType.THREAT,
                evidence="go to jail",
                explanation_gu="ધમકી",
                explanation_hi="धमकी",
            ),
            DetectedFlag(
                type=FlagType.MONEY_REQUEST,
                evidence="Send money right now",
                explanation_gu="પૈસા",
                explanation_hi="पैसे",
            ),
        ],
    )
    state = RiskEngine.update(state, scam_chunk)
    assert state.level == Level.SCAM

    # Next chunk is silent or polite
    polite_chunk = ChunkAnalysis(
        transcript="Thank you for your time, have a good day.",
        flags=[],
    )
    state = RiskEngine.update(state, polite_chunk)
    assert state.level == Level.SCAM, "Hysteresis violated: SCAM state was downgraded!"
