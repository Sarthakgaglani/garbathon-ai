# Scam Call Shield — Implementation Plan

This plan organizes development into vertical slices, with clean boundaries, tests, and git commits after each slice.

---

## Vertical Slices

### Slice 1: Backend Domain & Risk Engine
- **Files**:
  - `backend/app/domain/red_flags.py` (Enum of 6 flags, weights, critical set).
  - `backend/app/domain/schemas.py` (Pydantic v2 schemas: `DetectedFlag`, `ChunkAnalysis`, `CallState`, and typed SSE event payloads).
  - `backend/app/domain/risk_engine.py` (Pure functions: accumulate flags with confidence >= 0.6, calculate score, evaluate SCAM / SUSPICIOUS / SAFE, enforce strict hysteresis, guarantee genuine calls stay green).
  - `backend/tests/test_risk_engine.py` (Unit tests covering 4 call scenarios, bank mention edge case, confidence filtering, and hysteresis).
- **Deliverable**: Tested, standalone domain layer verifying the detection contract.
- **Git Commit**: `feat(domain): implement deterministic risk engine, red flags, and test suite`

---

### Slice 2: Audio Slicing, Gemini Client & Services
- **Files**:
  - `backend/app/services/audio_chunker.py` (5-second PCM slices with 0.5s overlap using Python stdlib `wave`, yielding `(index, t_start, t_end, wav_bytes)`).
  - `backend/app/services/prompts.py` (System prompt with Gujarati/Hindi/English context, original script quotes, confidence scores, empty flag instruction for delivery/ordinary calls).
  - `backend/app/services/gemini_client.py` (`analyze_chunk` using `google-genai` SDK, inline audio, structured schema, 8s timeout, 1 retry, fallback model `GEMINI_FALLBACK_MODEL`, safe empty fallback so stream never crashes).
  - `backend/app/services/alert_stub.py` (Mocked emergency contact SMS/WhatsApp stub building message from saved relationship and returning `simulated: true`).
  - `backend/app/services/replay_cache.py` (Loads and serves precomputed chunk analyses with seamless auto-fallback).
  - `backend/tests/test_chunker.py` (Tests 5s slicing and 0.5s overlap on PCM audio).
- **Deliverable**: Service layer with chunking, resilient Gemini client, and stubbed emergency alerts.
- **Git Commit**: `feat(services): add audio chunker with overlap, Gemini audio client, and alert stub`

---

### Slice 3: Samples, Warning Audio & CLI Cache Builder
- **Files**:
  - `samples/manifest.json` (4 calls: 3 scams [Digital Arrest, Electricity Bill, Fake Lottery] + 1 genuine [Swiggy Delivery]).
  - `samples/calls/*.wav` (4 lightweight 16 kHz mono WAV files, 30–45s each).
  - `scripts/generate_warning_audio.py` (Generates short spoken warning MP3s $\le$ 60 KB in `frontend/src/assets/warning-audio/{flag}_{lang}.mp3` using Gemini TTS / speech synthesis).
  - `scripts/build_cache.py` (Pipeline script to populate `samples/cache/*.json`).
  - `samples/cache/*.json` (Precomputed analysis JSON files matching the exact SSE contract).
- **Deliverable**: Complete sample dataset, pre-generated audio warnings, and offline cache for zero-config replay.
- **Git Commit**: `feat(samples): add 4 sample audio calls, precomputed replay cache, and warning audio assets`

---

### Slice 4: FastAPI REST & SSE Streaming API
- **Files**:
  - `backend/app/config.py` (`pydantic-settings` reading `.env`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `CHUNK_SECONDS=5`, `DEFAULT_MODE`).
  - `backend/app/api/routes.py` (`GET /api/health`, `GET /api/calls`, `GET /api/calls/{id}/audio`, `GET /api/calls/{id}/stream` SSE, `POST /api/alerts/emergency` stub).
  - `backend/app/main.py` (FastAPI initialization, CORS for Vite dev server).
  - `backend/tests/test_api_replay.py` (Tests SSE stream endpoints in replay mode, validating event sequence: `call_started` $\to$ `chunk_analysis` $\to$ `level_changed` $\to$ `call_ended`).
- **Deliverable**: Full backend API ready for frontend consumption.
- **Git Commit**: `feat(api): implement FastAPI REST and SSE endpoints with replay fallback`

---

### Slice 5: Frontend Foundations & Hooks
- **Files**:
  - `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.ts`, `frontend/tsconfig.json`.
  - `frontend/src/lib/types.ts` (TypeScript types strictly mirroring backend schemas).
  - `frontend/src/lib/api.ts` & `frontend/src/lib/utils.ts`.
  - `frontend/src/i18n/` (`en.json`, `gu.json`, `hi.json` with human-reviewed warning strings + Safe Exit bailout scripts).
  - `frontend/src/hooks/useLanguage.ts` (Manages Gujarati / Hindi / English selection, defaults to Gujarati).
  - `frontend/src/hooks/useWarningAudio.ts` (Plays pre-generated warning MP3s from `assets/warning-audio/` + ambient doorbell chime synthesis).
  - `frontend/src/hooks/useCallStream.ts` (Handles EventSource connection, emits typed states, handles reconnection/errors).
- **Deliverable**: Typed frontend foundation with hooks and multilingual localization.
- **Git Commit**: `feat(frontend-core): add frontend setup, types, i18n, and stream/audio hooks`

---

### Slice 6: Elder-Centric UI & Screens
- **Files**:
  - `frontend/src/features/home/CallPicker.tsx` (Card per sample call with caller, language chip, play action).
  - `frontend/src/features/home/EmergencyContactCard.tsx` (Pre-filled demo contact, stored in localStorage).
  - `frontend/src/features/call/Waveform.tsx` (Live animated waveform synced to audio).
  - `frontend/src/features/call/StatusBanner.tsx` (Traffic light state: Green $\to$ Amber $\to$ Red with gentle pulse).
  - `frontend/src/features/call/FlagChip.tsx` (Animated flag cards with icons, category badge, and 1-line simple explanation).
  - `frontend/src/features/call/TranscriptPane.tsx` (Streaming transcript with highlighted flagged phrases).
  - `frontend/src/features/call/CallScreen.tsx` (Main call layout with avatar, timer, and "Listening 0:12" micro-label).
  - `frontend/src/features/warning/WarningOverlay.tsx` (Full-screen red takeover, spring animation, giant "Hang Up" & "Call Family" buttons, and **"The Safe Exit Bailout" button** with doorbell sound and spoken excuse prompt).
  - `frontend/src/features/warning/AlertSentToast.tsx` ("Message sent to your son (simulated)").
  - `frontend/src/features/summary/CallSummary.tsx` (Verdict, timeline of flags, next steps with helpline 1930, restart button).
  - `frontend/src/app/App.tsx` & `frontend/src/app/providers.tsx`.
- **Deliverable**: Complete mobile-first, elder-friendly UI meeting WCAG AA accessibility with Safe Exit Bailout.
- **Git Commit**: `feat(frontend-ui): implement elder-first call screens, warning overlay with safe exit, and summary`

---

### Slice 7: End-to-End Verification & Documentation
- **Tasks**:
  - Run `pytest backend/tests` (verify all tests pass).
  - Run ruff on backend and eslint on frontend.
  - Verify `make dev`, `make test`, `make replay`.
  - Verify repo size is $< 10$ MB (`git count-objects -vH`).
  - Update `README.md` with Mermaid architecture diagram, demo script, setup, and mocked services notice.
  - Update `docs/DEMO_SCRIPT.md` with 2-minute judge walkthrough.
- **Deliverable**: Submission-ready project with documentation.
- **Git Commit**: `chore: finalize documentation, demo script, and verification checks`

---

## Verification Plan

1. **Pytest Coverage**:
   - `test_risk_engine.py`:
     - 3 scam calls reach `SCAM`.
     - Genuine Swiggy delivery call never leaves `SAFE` (or at most `SUSPICIOUS`, never `SCAM`).
     - Hysteresis: `SCAM` cannot downgrade to `SUSPICIOUS` or `SAFE`.
     - Single "bank" / "verify" mention never triggers `SCAM`.
   - `test_chunker.py`: 5-second chunking with 0.5s overlap and valid PCM WAV headers.
   - `test_api_replay.py`: SSE endpoints stream valid chronological events.
2. **Offline Replay Mode**:
   - Run without `GEMINI_API_KEY` and verify identical event flow and UI warning takeover.
3. **Audio & Asset Size Check**:
   - Total repository size $< 10$ MB verified via `git count-objects -vH`.
