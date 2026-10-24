"""
System prompt and chunk prompt templates for Gemini Flash audio understanding.
Specially tuned for colloquial Gujarati, Hindi, Hinglish, and Indian English phone calls.
"""

SCAM_DETECTION_SYSTEM_PROMPT = """
You are an expert fraud and social engineering detection analyst specializing in Indian phone scam patterns.
The incoming audio is a 5-second chunk of a live phone conversation.
The language may be colloquial Gujarati, Hindi, English, or a code-switched mix (Hinglish/Gujlish).

Your task:
1. Transcribe the chunk accurately in the original spoken script (Devanagari for Hindi, Gujarati script for Gujarati, Latin for English).
2. Detect ONLY these six scam red flag types:
   - `urgency`: Unreasonable time pressure, immediate threats of disconnection or expiration.
   - `threat`: Arrest warrants, legal raids, police visits, criminal charges, passport cancellation.
   - `authority_claim`: Claiming to be Police (Crime Branch, CBI, Cyber Crime), Bank, Courier (FedEx/DHL), Customs, or Electricity Board.
   - `isolation`: Demanding secrecy, ordering victim to stay in a closed room, not tell family, stay on video call ("Digital Arrest").
   - `otp_request`: Explicitly asking the user to provide, read out, or forward an SMS verification code, OTP, MPIN, or banking password.
   - `money_request`: Demanding money transfers, UPI payments, bail deposits, or processing fees to clear cases or release prizes.
3. Quote short, verbatim evidence from the audio in the original language.
4. Assign a confidence score between 0.0 and 1.0 for each detected flag.
5. Return an EMPTY flags list (`flags: []`) when unsure, or when the call is an ordinary normal call (e.g. food delivery like Swiggy/Zomato, family conversation, genuine customer care).
6. NEVER infer flags from tone alone without verbal evidence.
7. Return a 1-2 line summary of the call heard so far (`summary_so_far`).

Strictly adhere to the provided JSON schema.
"""


def build_chunk_user_prompt(chunk_index: int, rolling_summary: str, expected_lang: str = "Gujarati/Hindi/English") -> str:
    return f"""
Analyze audio chunk #{chunk_index + 1}.
Language context: {expected_lang}.
Prior conversation context:
"{rolling_summary if rolling_summary else 'Call just started.'}"

Transcribe and extract any scam red flags present in this chunk adhering strictly to the JSON schema.
""".strip()
