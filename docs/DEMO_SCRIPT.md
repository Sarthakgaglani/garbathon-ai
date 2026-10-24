# Scam Call Shield — Demo Script & Walkthrough

This script guides presenters and judges through a 3-minute live demonstration of Scam Call Shield.

---

## 1. Demo Setup (Offline or Online)
Scam Call Shield operates in two modes:
1. **Live Gemini Mode**: Requires `GEMINI_API_KEY` set in `.env`. Calls Gemini with 16kHz audio slices.
2. **Deterministic Replay Mode (Default if no key or offline)**: Loads pre-computed, verified analyses from `samples/cache/` so the demo never fails on stage.

---

## 2. Test Call Scenarios

| Scenario | Audio ID | Target Language | Typical Flow & Red Flags | Expected Verdict |
|----------|----------|-----------------|--------------------------|------------------|
| **1. Digital Arrest Scam** | `scam_digital_arrest` | Gujarati / Hindi | Caller claims to be Crime Branch / CBI officer; claims narcotics found in FedEx parcel; orders victim into isolated room; demands ₹1,50,000 security deposit. | 🚨 **SCAM** (Authority + Threat + Isolation + Money) |
| **2. Electricity Disconnection Scam** | `scam_electricity_kyc` | Hindi / Hinglish | Caller warns electricity will be cut at 9:30 PM due to pending bill; directs user to download app or share OTP. | 🚨 **SCAM** (Authority + Urgency + OTP) |
| **3. Fake Lottery / Bank Prize** | `scam_bank_lottery` | Gujarati / English | Caller claims ₹25 Lakh lottery won; demands immediate processing fee transfer. | 🚨 **SCAM** (Urgency + Money Request) |
| **4. Genuine Bank Customer Support** | `genuine_bank_support` | Gujarati / English | HDFC customer care verifying address update; explicitly warns user: *"We will NEVER ask for your OTP or password"*. | 🟢 **SAFE** (No scam flags; zero false alarm) |

---

## 3. Demo Step-by-Step Flow

### Step 1: Show the Home / Dial Screen
- Point out the clean, accessible dial layout designed for senior citizens.
- Demonstrate the language switcher at the top: **ગુજરાતી (Gujarati)**, **हिन्दी (Hindi)**, and **English**.
- Note the large fonts (18px+) and prominent high-contrast buttons.

### Step 2: Run Scenario 1 — "Digital Arrest"
- Select **Digital Arrest Scam** and tap **Start Call Simulation**.
- **Chunk 1 (0-5s)**: Status shows **SAFE** (Green). Caller introduces himself as Officer Rathore.
- **Chunk 2 (5-10s)**: Status shifts to **SUSPICIOUS** (Amber). Flag chip appears: *Authority Claim ("Mumbai Police Crime Branch")*.
- **Chunk 3 (10-15s)**: Threat flag triggers: *"Passport will be cancelled, arrest warrant issued"*.
- **Chunk 4 (15-20s)**: Isolation + Money Request flags trigger: *"Lock your room, do not tell family, transfer ₹1,50,000"*.
- **SCAM Takeover Event**:
  - Screen flashes and transforms into a **Full-Screen Red Alert**.
  - Headline in Gujarati: **"આ છેતરપિંડી છે – ફોન કાપી નાખો!"**
  - Audio alert announces the danger in Gujarati aloud.
  - Two giant buttons: **Hang Up** and **Call Family Member (+91 98765 43210)**.

### Step 3: Run Scenario 4 — "Genuine Bank Support"
- Reset and run the **Genuine Bank Support** call.
- The agent mentions "Bank" and "Account Verification".
- Show that despite discussing sensitive banking topics, the risk engine remains **SAFE** (Green).
- Emphasize to the judges: **"The LLM extracts signals, but our deterministic risk engine decides the verdict. This is what keeps genuine calls green and prevents alert fatigue."**

---

## 4. Key Takeaways for Judges
1. **Elder Accessibility**: Gujarati & Hindi audio readout, clear visual traffic lights, simple one-touch emergency actions.
2. **Explainability**: Every detected flag cites direct timestamped evidence from the audio and gives a 1-sentence Gujarati/Hindi explanation.
3. **Robustness**: 100% test coverage on the state machine; genuine calls never hit SCAM; offline replay safety net ensures bulletproof reliability.
