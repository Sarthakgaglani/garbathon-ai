# Scam Call Shield — Specification

## 1. Product Overview
**Scam Call Shield** is an elder-focused voice AI assistant that monitors phone calls in 5-second chunks as they play, detects scam red flags mid-call, alerts the user visually with traffic-light states and a full-screen takeover, speaks warnings aloud in the user's chosen language (Gujarati, Hindi, or English), and simulates an emergency alert to a saved family member.

- **Primary Users**: Elders and first-time smartphone users who are vulnerable when isolated on phone calls.
- **Core Experience**: Acts like a calm family member sitting next to the elder, providing non-technical, reassuring, actionable advice.
- **Genuine Call Guarantee**: The genuine call (Swiggy delivery) must remain **SAFE (Green)** the entire time.

---

## 2. Hard Constraints & Technologies

- **AI & Hosting**: Google technologies only:
  - Gemini Audio Understanding via official `google-genai` SDK for audio chunk analysis.
  - Gemini Speech Generation for pre-generating static warning audio clips (`.mp3`/`.ogg`, $\le$ 60 KB each).
  - No Web Speech API for recognition; no non-Google AI services.
- **Model Configuration**:
  - Primary: `GEMINI_MODEL` from `.env` (default `gemini-4-argon` or active Flash model).
  - Fallback: `GEMINI_FALLBACK_MODEL` on 404 / quota / permission errors.
  - Never hardcoded in source code.
- **Mocked Services**:
  - Emergency contact SMS / WhatsApp alert: `POST /api/alerts/emergency` stub endpoint + UI toast ("Simulated").
- **Offline / Replay Mode**:
  - Works with **NO API key** and **NO internet connection**.
  - Uses precomputed analysis JSON in `samples/cache/{id}.json`.
  - Automatically falls back to replay if no API key is present or on consecutive API errors.
  - Replay SSE stream emits identical events with the same cadence as live mode.
- **Repository Constraints**:
  - Total repository size $< 10$ MB.
  - Single branch (`main`).
  - No secrets in git history (`.env` ignored, `.env.example` committed).
  - Audio files: 16 kHz mono WAV, 30–45s each, 4 files total.

---

## 3. Architecture & Data Flow

```text
Sample Call (.wav) ──► audio_chunker (5s slices, 0.5s overlap)
                             │
                             ▼
              gemini_client.analyze_chunk (audio/wav inline + rolling summary + JSON schema)
                             │
                             ▼
              ChunkAnalysis { transcript, language, flags[], speaker_claims_to_be, summary_so_far }
                             │
                             ▼
              risk_engine (deterministic scoring + hysteresis state machine)
                             │
                             ▼
              SSE Stream (/api/calls/{id}/stream)
                             │
                             ▼
              React Call Screen (Traffic light, flags, transcript, audio warning, emergency alert)
```

### Separation of Responsibilities:
- **LLM Role**: Extracts raw transcription and red flags (`FlagType`, `evidence`, `confidence`).
- **Deterministic Code Role**: Decides the verdict (`SAFE`, `SUSPICIOUS`, `SCAM`). The LLM never sets the state level.
- **Warning Audio & Text**: 100% static, human-reviewed, localized strings keyed by flag type and language. Never free-form LLM text shown to elders.

---

## 4. Contract Specifications

### 4.1 Red Flags & Weights (`domain/red_flags.py`)
| Flag Type | Description | Weight | Critical? |
|---|---|:---:|:---:|
| `URGENCY` | Time pressure, panic, immediate deadlines | 1 | No |
| `THREAT` | Arrest warrants, jail, account blocks, legal raids | 2 | No |
| `AUTHORITY_CLAIM` | Impersonating Police, CBI, Bank, Courier, Customs, Electricity Board | 2 | No |
| `ISOLATION` | "Don't hang up", "don't tell anyone", "stay in closed room" | 3 | **Yes** |
| `OTP_REQUEST` | Asking for SMS OTP, MPIN, CVV, or passwords | 4 | **Yes** |
| `MONEY_REQUEST` | Demanding UPI transfer, bail deposit, or fee | 4 | **Yes** |

### 4.2 Risk Engine Rules (`domain/risk_engine.py`)
- Accumulate distinct flags with `confidence >= 0.6`.
- **SCAM**: `(distinct_flags >= 2 AND at least 1 CRITICAL)` OR `score >= 8`.
- **SUSPICIOUS**: `score >= 3`.
- **SAFE**: `score < 3`.
- **Hysteresis Guarantee**:
  - `SCAM` level can **never** downgrade mid-call.
  - `SUSPICIOUS` level can **never** drop back to `SAFE`.
- **False Positive Prevention**: A single mention of "bank" or "verify" alone (score = 2) must never reach SCAM.

### 4.3 SSE Event Types (`domain/schemas.py`)
- `call_started`: `{ call_id, total_chunks, mode }`
- `chunk_analysis`: `{ index, t_start, t_end, transcript, new_flags[], state }`
- `level_changed`: `{ level, previous_level, score }`
- `scam_detected`: `{ flags, evidence, t }`
- `alert_sent`: `{ contact, message, simulated: true }`
- `call_ended`: `{ final_level, final_score, summary }`
- `error`: `{ code, message, recoverable }`

### 4.4 Static Warning Copy (Bilingual & Trilingual)
| Flag Type | English | Gujarati (ગુજરાતી) | Hindi (हिन्दी) |
|---|---|---|---|
| **THREAT / AUTHORITY** | Police never arrest anyone over a phone or video call. | પોલીસ ક્યારેય ફોન કે વીડિયો કૉલ પર કોઈની ધરપકડ કરતી નથી. | पुलिस कभी भी फोन या वीडियो कॉल पर किसी को गिरफ्तार नहीं करती। |
| **OTP** | Never share an OTP. Banks never ask for it on a call. | ક્યારેય ઓટીપી આપશો નહીં. બેંક ક્યારેય કૉલ પર ઓટીપી માંગતી નથી. | कभी भी ओटीપી शेयर न करें। बैंक कभी कॉल पर ओटीपी नहीं मांगते। |
| **MONEY** | No real officer asks you to transfer money to close a case. | કોઈ સાચા અધિકારી કેસ બંધ કરવા માટે પૈસા ટ્રાન્સફર કરવાનું કહેતા નથી. | कोई भी असली अधिकारी केस रफा-दफा करने के लिए पैसे ट्रांसफर करने को नहीं कहता। |
| **URGENCY** | Scammers rush you so you can't think. | ગઠિયા તમને વિચારવાનો સમય ન મળે એટલે ઉતાવળ કરાવે છે. | धोखेबाज आपको जल्दबाजी में डालते हैं ताकि आप सोच न सकें। |
| **ISOLATION** | Real officers never tell you to hide this from your family. | સાચા અધિકારીઓ ક્યારેય આ વાત પરિવારથી છુપાવવા કહેતા નથી. | असली पुलिस या अधिकारी कभी इसे परिवार से छिपाने के लिए नहीं कहते। |
| **FINAL / SCAM** | This is a scam. Hang up now and call your family. | આ છેતરપિંડી છે. હમણાં જ ફોન કાપી નાખો અને પરિવારને કૉલ કરો. | यह धोखाधड़ी है। तुरंत फोन काट दें और अपने परिवार को कॉल करें। |
| **SAFE EXIT (Bailout)** | Doorbell chime + "Someone is at the door, I will visit the police station in person." | ડોરબેલનો અવાજ + "મારા ઘરે મહેમાન આવ્યા છે, હું દરવાજો ખોલવા જાઉં છું. હું પોલીસ સ્ટેશને રૂબરૂ આવીશ." | डोरबेल की घंटी + "घर पर मेहमान आए हैं, मैं दरवाजा खोलने जा रहा हूँ। मैं थाने खुद आऊँगा।" |

---

## 5. Frontend & Elder-First Design

- **Typography**: Minimum 18px base text, Google Fonts (*Noto Sans Gujarati*, *Noto Sans Devanagari*, *Inter*).
- **Touch Targets**: Minimum 48px $\times$ 48px targets.
- **Contrast**: WCAG AA compliant.
- **Traffic Light Tokens**:
  - `SAFE`: Emerald `#16A34A`
  - `SUSPICIOUS`: Amber `#F59E0B`
  - `SCAM`: Red `#DC2626`
- **Call Screen Background**: Dark navy `#0F172A`.
- **4 Key Screens**:
  1. **Home**: CallPicker (3 scams + 1 Swiggy delivery genuine), EmergencyContactCard (saved in localStorage), Mode toggle (Live AI / Demo).
  2. **Call Screen**: Caller avatar, number, timer, live synced Waveform, StatusBanner, FlagChips pop-in, TranscriptPane with highlights, "Listening 0:12" micro-label.
  3. **Warning Overlay & "Safe Exit Bailout"**: Full-screen red takeover with spring animation, huge headline, "What I heard" evidence list, automatic pre-generated audio playback, giant "Hang Up" button, "Call Family" button, AlertSentToast ("Message sent to your son (simulated)"), and **"The Safe Exit Bailout" button** (triggers an ambient doorbell chime + family interruption audio, giving the elder an effortless, non-confrontational reason to disconnect immediately).
  4. **Summary Screen**: Final verdict, timeline of detected flags, "What to do next" (National Cyber Helpline 1930 & cybercrime.gov.in), and restart option. Genuine call finishes on calm green: "No scam signs found."
