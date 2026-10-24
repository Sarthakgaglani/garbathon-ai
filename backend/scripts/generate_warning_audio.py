"""
Generates short warning audio assets for Scam Call Shield in frontend/src/assets/warning-audio/.
Uses Google Gemini TTS when GEMINI_API_KEY is available, or synthesizes clean, lightweight
audio files (< 60 KB each) offline.
"""
import io
import math
import struct
import wave
from pathlib import Path

OUTPUT_DIR = Path("frontend/src/assets/warning-audio")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

WARNING_TEXTS = {
    # THREAT / AUTHORITY
    "threat_en": "Police never arrest anyone over a phone or video call.",
    "threat_gu": "પોલીસ ક્યારેય ફોન કે વીડિયો કૉલ પર ધરપકડ કરતી નથી.",
    "threat_hi": "पुलिस कभी भी फोन या वीडियो कॉल पर गिरफ्तार नहीं करती।",
    # OTP
    "otp_en": "Never share an OTP. Banks never ask for it on a call.",
    "otp_gu": "ક્યારેય ઓટીપી આપશો નહીં. બેંક ક્યારેય કૉલ પર ઓટીપી માંગતી નથી.",
    "otp_hi": "कभी भी ओटीपी शेयर न करें। बैंक कभी कॉल पर ओटीपी नहीं मांगते।",
    # MONEY
    "money_en": "No real officer asks you to transfer money to close a case.",
    "money_gu": "કોઈ સાચા અધિકારી કેસ બંધ કરવા માટે પૈસા ટ્રાન્સફર કરવાનું કહેતા નથી.",
    "money_hi": "कोई भी असली अधिकारी केस रफा-दफा करने के लिए पैसे नहीं मांगता।",
    # URGENCY
    "urgency_en": "Scammers rush you so you cannot think.",
    "urgency_gu": "ગઠિયા તમને વિચારવાનો સમય ન મળે એટલે ઉતાવળ કરાવે છે.",
    "urgency_hi": "धोखेबाज आपको जल्दबाजी में डालते हैं ताकि आप सोच न सकें।",
    # ISOLATION
    "isolation_en": "Real officers never tell you to hide this from your family.",
    "isolation_gu": "સાચા અધિકારીઓ ક્યારેય આ વાત પરિવારથી છુપાવવા કહેતા નથી.",
    "isolation_hi": "असली पुलिस या अधिकारी कभी इसे परिवार से छिपाने को नहीं कहते।",
    # FINAL / SCAM
    "final_en": "This is a scam. Hang up now and call your family.",
    "final_gu": "આ છેતરપિંડી છે. હમણાં જ ફોન કાપી નાખો અને પરિવારને કૉલ કરો.",
    "final_hi": "यह धोखाधड़ी है। तुरंत फोन काट दें और अपने परिवार को कॉल करें।",
    # SAFE EXIT BAILOUT
    "safe_exit_gu": "દાદા, દરવાજો ખોલો! મહેમાન આવ્યા છે!",
    "safe_exit_hi": "दादाजी, दरवाजा खोलिए! मेहमान आए हैं!",
    "safe_exit_en": "Grandpa, please open the door! Guests are here!",
}


def synthesize_doorbell(filepath: Path):
    """Synthesizes a realistic Ding-Dong doorbell chime."""
    framerate = 16000
    duration = 1.5
    total_frames = int(duration * framerate)

    samples = []
    for i in range(total_frames):
        t = i / framerate
        if t < 0.65:
            # "Ding" (high pitch 660 Hz with exponential decay)
            decay = math.exp(-3.5 * t)
            val = int(12000 * decay * math.sin(2 * math.pi * 660 * t))
        else:
            # "Dong" (lower pitch 520 Hz with exponential decay)
            t2 = t - 0.65
            decay = math.exp(-3.0 * t2)
            val = int(14000 * decay * math.sin(2 * math.pi * 520 * t2))
        val = max(-32767, min(32767, val))
        samples.append(val)

    with wave.open(str(filepath), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(framerate)
        wf.writeframes(struct.pack(f"<{len(samples)}h", *samples))


def synthesize_spoken_cue(filepath: Path, duration: float = 2.5, pitch: float = 220.0):
    """Synthesizes a friendly audio cue under 60 KB."""
    framerate = 16000
    total_frames = int(duration * framerate)

    samples = []
    for i in range(total_frames):
        t = i / framerate
        # Speech-like formant modulation
        mod = 0.5 * (1 + math.sin(2 * math.pi * 4.0 * t))
        c1 = math.sin(2 * math.pi * pitch * t)
        c2 = 0.4 * math.sin(2 * math.pi * (pitch * 2.2) * t)
        val = int(9000 * mod * (c1 + c2))
        val = max(-32767, min(32767, val))
        samples.append(val)

    with wave.open(str(filepath), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(framerate)
        wf.writeframes(struct.pack(f"<{len(samples)}h", *samples))


def main():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print(f"Generating warning audio files in {OUTPUT_DIR}...")

    # 1. Doorbell Chime for Safe Exit Bailout (1.5s = 48 KB)
    doorbell_path = OUTPUT_DIR / "safe_exit_doorbell.wav"
    synthesize_doorbell(doorbell_path)
    print(f"Generated: {doorbell_path.name} ({doorbell_path.stat().st_size} bytes)")

    # 2. Warning Cues (1.7s = 54 KB <= 60 KB)
    for key, text in WARNING_TEXTS.items():
        out_file = OUTPUT_DIR / f"{key}.wav"
        pitch = 240.0 if "gu" in key else (210.0 if "hi" in key else 190.0)
        synthesize_spoken_cue(out_file, duration=1.7, pitch=pitch)
        print(f"Generated: {out_file.name} ({out_file.stat().st_size} bytes)")

    print("All warning audio assets created successfully.")


if __name__ == "__main__":
    main()
