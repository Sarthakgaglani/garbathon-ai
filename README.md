# Scam Call Shield — Real-time Fraud Defense for Senior Citizens

[![Tests](https://img.shields.io/badge/tests-6%20passed-brightgreen.svg)]()
[![Gemini](https://img.shields.io/badge/Gemini-Flash%20Audio-blue.svg)]()
[![Languages](https://img.shields.io/badge/Languages-Gujarati%20%7C%20Hindi%20%7C%20English-orange.svg)]()
[![Repo Size](https://img.shields.io/badge/Repo%20Size-%3C%205MB%20(Under%2010MB%20limit)-success.svg)]()

> **Scam Call Shield** protects elderly citizens from high-pressure telephone scams ("Digital Arrest", fake courier drug busts, power disconnection threats, and OTP phishing) using Gemini Flash audio analysis, a deterministic zero-false-alarm risk engine, and an accessible, high-contrast traffic-light UI with full-screen emergency takeover.

---

## 1. System Architecture & Data Flow

```text
Incoming Call Audio (.wav)
          │
          ▼
   Audio Chunker (5s 16kHz slices via stdlib `wave`)
          │
          ▼
   Gemini Audio Analysis (Audio chunk + prior context + JSON Schema)
          │
          ▼
   Structured Signals: { transcript, flags: [ { type, evidence, explanation_gu, explanation_hi } ] }
          │
          ▼
   Risk Engine (Weights + Critical Flag Rules + Hysteresis State Machine)
          │
          ▼
   Server-Sent Events (SSE Stream `/api/calls/{id}/stream`)
          │
          ▼
   React Frontend (Traffic light state, live transcript, flag chips, audio alerts, emergency takeover)
```

---

## 2. Core Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Audio Model** | Gemini Flash (`gemini-2.5-flash` / `gemini-1.5-flash`) | Native Gujarati, Hindi, and Hinglish audio comprehension, sub-second latency, structured JSON schema enforcement. |
| **Streaming Pipeline** | 5s audio chunking with SSE | Server slices the audio into ~5s chunks and streams structured updates reliably without WebSocket reconnection overhead. |
| **Risk Engine** | Deterministic Python State Machine | LLM extracts semantic signals; our code decides the verdict. Requires 2+ distinct flags for critical signals, ensuring genuine bank calls never trigger false alarms. |
| **Elder Accessibility** | 18px+ typography, 48px+ touch targets, WCAG AA contrast | Simple traffic lights (Green/Amber/Red), giant "Hang up" & "Call Family" buttons, and automatic voice readouts in Gujarati & Hindi. |
| **Safety Net** | Pre-computed Replay Cache (`samples/cache/`) | 100% offline-ready demo mode that works without internet or API keys. |

---

## 3. Project Structure

```text
scam-call-shield/
├── README.md                  # Setup, demo script, architecture diagram
├── .env.example               # GEMINI_API_KEY=, GEMINI_MODEL=
├── .gitignore                 # .env, node_modules, venv, __pycache__, dist
├── Makefile                   # make dev / make test / make replay / make check-size
├── docs/
│   ├── SPEC.md                # Full technical specification
│   └── DEMO_SCRIPT.md         # 3-minute presentation script for judges
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py            # FastAPI application with CORS
│   │   ├── config.py          # Settings and environment variables
│   │   ├── api/
│   │   │   └── routes.py      # GET /calls, GET /calls/{id}/stream (SSE)
│   │   ├── domain/
│   │   │   ├── schemas.py     # Pydantic schemas (RedFlag, ChunkAnalysis, CallState)
│   │   │   ├── red_flags.py   # FlagType enum + weights + critical flags
│   │   │   └── risk_engine.py # Scoring + SAFE/SUSPICIOUS/SCAM state machine
│   │   └── services/
│   │       ├── audio_chunker.py   # Slices WAV using stdlib `wave`
│   │       ├── gemini_client.py   # analyze_chunk() with structured output
│   │       ├── prompts.py         # Gujarati/Hindi/Hinglish detection prompt
│   │       └── replay_cache.py    # Load/save cached analyses
│   └── tests/
│       ├── test_risk_engine.py    # 4 scenario tests + hysteresis verification
│       └── test_chunker.py        # 5s slicing verification
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── app/               # App.tsx, main.tsx, index.css
│       ├── features/call/     # CallScreen, WarningOverlay, FlagChip, TranscriptPane, LanguageSwitcher
│       ├── hooks/             # useCallStream.ts (SSE EventSource), useSpeech.ts (Audio readout)
│       ├── lib/               # api.ts, types.ts, utils.ts
│       └── i18n/              # gu.json (Gujarati), hi.json (Hindi), en.json (English)
└── samples/
    ├── manifest.json          # Call metadata, language, expected verdict
    ├── calls/                 # 16kHz mono WAV samples (scam + genuine)
    └── cache/                 # Precomputed chunk analysis JSON per call
```

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Setup Backend
```bash
# Clone the repository
git clone <repo-url>
cd scam-call-shield

# Optional: Set Gemini API key for live analysis (or leave empty for offline Replay Mode)
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key

# Run tests to verify the risk engine
python -m pytest backend/tests -v
```

### 2. Start the Backend API
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API runs at `http://localhost:8000` (Docs: `http://localhost:8000/docs`).

### 3. Start the Frontend
In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Test Scenarios Included

| Scenario | Audio Sample | Language | Expected Verdict | Why? |
|----------|--------------|----------|------------------|------|
| **1. Digital Arrest** | `scam_digital_arrest.wav` | Gujarati / Hindi | 🚨 **SCAM** | Impersonates Crime Branch, threatens arrest, orders victim into isolation room, demands ₹1,50,000 RBI transfer. |
| **2. Electricity Disconnection** | `scam_electricity_kyc.wav` | Hindi / Hinglish | 🚨 **SCAM** | Claims power cutoff tonight at 9:30 PM, creates extreme urgency, demands SMS OTP. |
| **3. Fake Bank Lottery** | `scam_bank_lottery.wav` | Gujarati / English | 🚨 **SCAM** | Fictitious ₹25 Lakh SBI lucky draw, requires upfront ₹5,000 UPI registration fee. |
| **4. Genuine Bank Support** | `genuine_bank_support.wav` | Gujarati / English | 🟢 **SAFE** | Real customer care verifying branch address change; warns user never to share OTP. Zero false alarm! |

---

## 6. Deterministic Risk Engine Contract

```python
CRITICAL = {FlagType.OTP_REQUEST, FlagType.MONEY_REQUEST, FlagType.ISOLATION}

def update(state: CallState, analysis: ChunkAnalysis) -> CallState:
    state.flags.update(f.type for f in analysis.flags)
    score = sum(WEIGHTS[t] for t in state.flags)

    # Requires 2+ distinct signals for critical flags or high cumulative score
    if (state.flags & CRITICAL and len(state.flags) >= 2) or score >= 8:
        state.level = Level.SCAM
    elif score >= 3:
        state.level = max(state.level, Level.SUSPICIOUS)
    
    # Hysteresis: once SCAM, state never downgrades mid-call
    return state
```

---

## 7. Compliance with 10MB Repository Limit

- Audio files are resampled to **16 kHz mono WAV**.
- Total sample audio footprint is **~2.08 MB**.
- All temporary files, virtualenvs, build outputs, and `.env` are strictly excluded in `.gitignore`.
- Run `make check-size` or `git count-objects -vH` to verify repository size.
