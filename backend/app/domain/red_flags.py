from enum import Enum


class FlagType(str, Enum):
    URGENCY = "urgency"
    THREAT = "threat"
    AUTHORITY_CLAIM = "authority_claim"
    ISOLATION = "isolation"
    OTP_REQUEST = "otp_request"
    MONEY_REQUEST = "money_request"


WEIGHTS: dict[FlagType, int] = {
    FlagType.URGENCY: 1,
    FlagType.THREAT: 2,
    FlagType.AUTHORITY_CLAIM: 2,
    FlagType.ISOLATION: 3,
    FlagType.OTP_REQUEST: 4,
    FlagType.MONEY_REQUEST: 4,
}

CRITICAL_FLAGS: set[FlagType] = {
    FlagType.OTP_REQUEST,
    FlagType.MONEY_REQUEST,
    FlagType.ISOLATION,
}
