# Scam Call Shield — Technical Specification

## 1. System Overview
Scam Call Shield is an intelligent, real-time defensive audio monitor designed to protect vulnerable individuals—especially senior citizens—against sophisticated telephone fraud. The system specializes in Indian colloquial telephone patterns, supporting Gujarati, Hindi, Hinglish, and Indian English.

## 2. Core Decisions & Architecture

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Audio Model** | Gemini Flash (`gemini-2.5-flash` / `gemini-1.5-flash`) | Native audio understanding with Indian dialect/accent comprehension, sub-second latency, structured JSON schema enforcement. |
| **Streaming Pipeline** | 5s audio chunking with SSE (Server-Sent Events) | Reliable, low-latency delivery over standard HTTP without WebSocket reconnection complexities. |
| **Backend** | Python 3.10+ + FastAPI + Pydantic v2 | Strict schema verification, asynchronous stream orchestration, zero client-side key exposure. |
| **Risk Engine** | Deterministic state machine with hysteresis | LLM extracts semantic signals; deterministic code controls the verdict to strictly prevent false positives on genuine bank/support calls. |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion | High-framerate responsive UI with accessibility accommodations, high contrast, and animated emergency takeover. |
| **Safety Net** | Pre-computed Replay Cache | Guaranteed 100% offline demo execution if network drops or API limits occur. |

## 3. Data Flow

```text
Incoming Call Audio (.wav)
          │
          ▼
   Audio Chunker (5s 16kHz mono slices)
          │
          ▼
   Gemini Audio Analysis (Audio chunk + rolling context + JSON Schema)
          │
          ▼
   Structured Output: { transcript, flags: [ { type, evidence, explanation_gu, explanation_hi } ], claims }
          │
          ▼
   Risk Engine (Weights + Critical Flag Rules + Hysteresis)
          │
          ▼
   SSE Stream (`/calls/{id}/stream`)
          │
          ▼
   React Frontend (Traffic light state, live transcript, flag badges, audio readout, emergency takeover)
```

## 4. Detection Contract & Risk Engine

### Flag Classification
- **Critical Flags** (Weight: 4):
  - `otp_request`: Asking for SMS OTP, PIN, or verification code.
  - `money_request`: Demanding UPI transfer, RTGS/NEFT, or gift cards to "verify" or "secure" funds.
  - `isolation`: Demanding silence ("don't tell family", "don't disconnect video call", "close your door").
- **Supporting Flags** (Weight: 2 - 4):
  - `threat` (Weight: 4): Arrest warrant, immediate bank account freeze, police visit, criminal case.
  - `urgency` (Weight: 2): "Within 10 minutes", "immediately", timer pressure.
  - `authority_claim` (Weight: 2): Impersonating CBI, Mumbai Police, RBI, Customs/FedEx, Electricity Board.

### Verdict State Machine
- `Level.SAFE` (Score < 3): Normal conversation. Genuine customer care verification statements (e.g. "Do not share OTP with anyone") do NOT trigger scam flags.
- `Level.SUSPICIOUS` (Score 3 - 7): Caller exhibits suspicious urgency or unverified claims. Visual amber warning displayed.
- `Level.SCAM` (Score >= 8 OR (Any Critical Flag AND >= 2 distinct flags)): Full-screen red emergency takeover.
- **Hysteresis Guarantee**: Once `SCAM` level is reached in a call session, it can NEVER downgrade to `SUSPICIOUS` or `SAFE`.

## 5. Elder-First Design Principles
- **Base Typography**: >= 18px body, >= 28px headings, high-contrast WCAG AA compliance.
- **Touch Targets**: Minimum 48px x 48px touch targets for buttons.
- **Multilingual Support**: Live toggle between Gujarati (ગુજરાતી), Hindi (हिन्दी), and English.
- **Full-Screen Emergency Takeover**: At `SCAM` level, the UI locks into a high-visibility red banner with one-tap "Hang Up" (કાપી નાખો) and "Call Family Member" (સગાને ફોન કરો) actions.
- **Voice Readout**: Instant synthesized speech / pre-recorded warning readout alerting the user aloud in their preferred language.
