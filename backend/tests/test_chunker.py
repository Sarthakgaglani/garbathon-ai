import io
import wave
import pytest
from backend.app.services.audio_chunker import AudioChunker


def test_chunker_slices_wav_properly(tmp_path):
    """
    Verifies that a 15-second WAV file is sliced into three 5-second WAV chunks,
    each having valid WAV headers and playable frame counts.
    """
    test_wav_path = tmp_path / "test_15s.wav"
    dummy_wav_data = AudioChunker.create_dummy_wav(duration_sec=15.0, framerate=16000)
    test_wav_path.write_bytes(dummy_wav_data)

    info = AudioChunker.get_wav_info(test_wav_path)
    assert info["duration_sec"] == 15.0
    assert info["framerate"] == 16000
    assert info["nchannels"] == 1

    chunks = list(AudioChunker.slice_wav_file(test_wav_path, chunk_duration_sec=5.0))
    assert len(chunks) == 3

    for index, (chunk_idx, start_time, chunk_bytes) in enumerate(chunks):
        assert chunk_idx == index
        assert start_time == pytest.approx(index * 5.0)
        assert len(chunk_bytes) > 44  # Valid WAV header is 44 bytes

        # Verify chunk can be opened by wave module
        with wave.open(io.BytesIO(chunk_bytes), "rb") as wf:
            assert wf.getframerate() == 16000
            assert wf.getnchannels() == 1
            chunk_frames = wf.getnframes()
            assert chunk_frames == 16000 * 5
