import io
import wave
import pytest
from backend.app.services.audio_chunker import AudioChunker


def test_chunker_slices_wav_with_overlap(tmp_path):
    """
    Verifies that a 15-second 16kHz mono WAV file is sliced into 5-second chunks
    with 0.5s overlap, producing valid headers and accurate (t_start, t_end) timestamps.
    """
    test_wav_path = tmp_path / "test_15s.wav"
    dummy_wav_data = AudioChunker.create_dummy_wav(duration_sec=15.0, framerate=16000)
    test_wav_path.write_bytes(dummy_wav_data)

    info = AudioChunker.get_wav_info(test_wav_path)
    assert info["duration_sec"] == 15.0
    assert info["framerate"] == 16000
    assert info["nchannels"] == 1

    chunks = list(AudioChunker.slice_wav_file(test_wav_path, chunk_duration_sec=5.0, overlap_sec=0.5))
    # Step = 4.5s:
    # Chunk 0: 0.0 - 5.0
    # Chunk 1: 4.5 - 9.5
    # Chunk 2: 9.0 - 14.0
    # Chunk 3: 13.5 - 15.0
    assert len(chunks) == 4

    # Check Chunk 0
    c0_idx, c0_start, c0_end, c0_bytes = chunks[0]
    assert c0_idx == 0
    assert c0_start == pytest.approx(0.0)
    assert c0_end == pytest.approx(5.0)

    # Check Chunk 1
    c1_idx, c1_start, c1_end, c1_bytes = chunks[1]
    assert c1_idx == 1
    assert c1_start == pytest.approx(4.5)
    assert c1_end == pytest.approx(9.5)

    # Verify each chunk has valid WAV structure
    for idx, start, end, chunk_bytes in chunks:
        assert len(chunk_bytes) > 44  # Valid WAV header
        with wave.open(io.BytesIO(chunk_bytes), "rb") as wf:
            assert wf.getframerate() == 16000
            assert wf.getnchannels() == 1
