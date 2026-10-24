import io
import math
import wave
from pathlib import Path
from typing import Generator, Tuple


class AudioChunker:
    """
    Slices WAV audio files into fixed-duration chunks using Python's standard library `wave`.
    Outputs properly formatted WAV bytes with valid headers for each chunk.
    """

    @staticmethod
    def get_wav_info(file_path: str | Path) -> dict:
        with wave.open(str(file_path), "rb") as wf:
            params = wf.getparams()
            frames = wf.getnframes()
            rate = wf.getframerate()
            duration = frames / float(rate)
            return {
                "nchannels": params.nchannels,
                "sampwidth": params.sampwidth,
                "framerate": rate,
                "nframes": frames,
                "duration_sec": duration,
            }

    @staticmethod
    def slice_wav_file(
        file_path: str | Path,
        chunk_duration_sec: float = 5.0,
    ) -> Generator[Tuple[int, float, bytes], None, None]:
        """
        Yields (chunk_index, start_time_sec, wav_bytes) for each slice.
        """
        with wave.open(str(file_path), "rb") as wf:
            nchannels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            total_frames = wf.getnframes()

            frames_per_chunk = int(chunk_duration_sec * framerate)
            if frames_per_chunk <= 0:
                frames_per_chunk = framerate * 5

            total_chunks = math.ceil(total_frames / frames_per_chunk)
            chunk_index = 0

            while chunk_index < total_chunks:
                start_frame = chunk_index * frames_per_chunk
                wf.setpos(start_frame)
                frames_to_read = min(frames_per_chunk, total_frames - start_frame)
                raw_frames = wf.readframes(frames_to_read)

                # Construct new WAV in-memory
                out_buffer = io.BytesIO()
                with wave.open(out_buffer, "wb") as out_wf:
                    out_wf.setnchannels(nchannels)
                    out_wf.setsampwidth(sampwidth)
                    out_wf.setframerate(framerate)
                    out_wf.writeframes(raw_frames)

                chunk_bytes = out_buffer.getvalue()
                start_time_sec = start_frame / float(framerate)

                yield (chunk_index, start_time_sec, chunk_bytes)
                chunk_index += 1

    @staticmethod
    def create_dummy_wav(duration_sec: float = 15.0, framerate: int = 16000) -> bytes:
        """Helper to create a valid silent/tone WAV in-memory for testing."""
        import struct

        nchannels = 1
        sampwidth = 2
        total_frames = int(duration_sec * framerate)

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(nchannels)
            wf.setsampwidth(sampwidth)
            wf.setframerate(framerate)
            # 440 Hz low amplitude sine tone or silence
            raw_data = struct.pack(f"<{total_frames}h", *([0] * total_frames))
            wf.writeframes(raw_data)
        return buf.getvalue()
