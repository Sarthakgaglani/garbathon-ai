# Scam Call Shield — 2-Minute Demo Script for Hackathon Judges

---

## Pitch Hook (15 Seconds)
> *"In India, over ₹1,750 Crores were stolen in 2024 through 'Digital Arrest' and courier fraud. Seniors fall victim because scammers isolate them on the phone. Scam Call Shield is an AI guardian that listens in 5-second chunks, warns the elder mid-call in Gujarati or Hindi, and gives them a cultural safe-exit excuse to hang up without fear."*

---

## Step 1: Zero False Alarms — Genuine Swiggy Delivery Call (30 Seconds)
1. On the Home screen, select **"Genuine Swiggy Delivery (સ્વિગી ડિલિવરી)"**.
2. Tap **"Start Call Simulation"**.
3. Point out to judges:
   - The driver calls from the apartment gate and confirms flat number 302.
   - The status banner stays **SAFE (Green)** the entire time.
   - **Key Judge Takeaway**: *"Notice that our LLM extracts transcription signals, but our own deterministic risk engine decides the verdict. Genuine calls will never trigger false panic."*
4. Tap **"Hang Up"** and return to Home.

---

## Step 2: Mid-Call Scam Detection — Digital Arrest in Gujarati (45 Seconds)
1. Select **"Digital Arrest Scam (ડિજિટલ અરેસ્ટ)"** and ensure language is set to **ગુજરાતી (Gujarati)**.
2. Tap **"Start Call Simulation"**.
3. Watch the real-time progression:
   - **0s–5s (Green)**: Caller identifies as Mumbai Police Crime Branch inspector.
   - **5s–10s (Amber - Be Careful)**: Flag pops in: *Authority Claim*.
   - **10s–15s (Amber to Red)**: Flag pops in: *Threat of arrest warrant*.
   - **15s–20s (Red - SCAM TAKEOVER)**: Flags trigger for *Forced Isolation* ("Lock your room, don't tell family") + *Money Request* (₹1,50,000 deposit).
4. **Full-Screen Red Takeover Event**:
   - The screen locks into an emergency red alert: **"આ છેતરપિંડી છે – ફોન કાપી નાખો!"**
   - The warning is spoken aloud automatically.
   - An emergency simulated SMS toast notifies the son: *"Message sent to your son (simulated)"*.

---

## Step 3: The Unimaginable Feature — "The Safe Exit Bailout" (20 Seconds)
1. Point to the amber button: **"સાંસ્કૃતિક બહાનું (Safe Exit Bailout)"**.
2. Tell the judges:
   - *"Elders are terrified of hanging up on a 'Police Inspector' because the scammer threatens to break down their door. Watch what happens when an elder taps Safe Exit."*
3. Tap **"Safe Exit Bailout"**:
   - A loud, authentic Ding-Dong doorbell chime plays over the speaker.
   - A family voice calls out: *"દાદા, દરવાજો ખોલો! મહેમાન આવ્યા છે!"* (*"Dada, open the door! Guests are here!"*).
   - The screen shows the elder the exact line to say: *"મારા ઘરે મહેમાન આવ્યા છે, હું દરવાજો ખોલવા જાઉં છું. હું પોલીસ સ્ટેશને રૂબરૂ આવીશ."*
   - The call disconnects safely and non-confrontationally.

---

## Step 4: Summary & Helpline 1930 (10 Seconds)
1. Show the **Call Analysis Summary** screen:
   - Timeline of exact timestamps when each red flag occurred.
   - Direct button to dial **National Cyber Crime Helpline 1930** and open **cybercrime.gov.in**.

---

## Step 5: Offline Reliability (Replay Mode)
1. Show the **"Demo Mode (Offline)"** badge:
   - Works with **NO API key** and **NO internet connection**.
   - Judges can clone this repo anywhere and it will run out-of-the-box.
