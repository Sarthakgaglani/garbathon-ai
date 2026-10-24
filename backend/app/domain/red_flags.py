from enum import Enum


class FlagType(str, Enum):
    URGENCY = "urgency"
    THREAT = "threat"  # arrest, account block, legal action
    OTP_REQUEST = "otp_request"
    MONEY_REQUEST = "money_request"
    AUTHORITY_CLAIM = "authority_claim"  # police, CBI, bank, courier
    ISOLATION = "isolation"  # "don't tell anyone", "stay on video call"


WEIGHTS: dict[FlagType, int] = {
    FlagType.AUTHORITY_CLAIM: 2,
    FlagType.URGENCY: 2,
    FlagType.THREAT: 4,
    FlagType.OTP_REQUEST: 4,
    FlagType.MONEY_REQUEST: 4,
    FlagType.ISOLATION: 4,
}

CRITICAL_FLAGS: set[FlagType] = {
    FlagType.OTP_REQUEST,
    FlagType.MONEY_REQUEST,
    FlagType.ISOLATION,
}
