import io
import math
import wave
from pathlib import Path
from typing import Generator, Tuple


class AudioChunker:
    """
    Slices WAV audio files into fixed-duration PCM chunks with configurable overlap
    using Python's standard library `wave`.
    Yields (index, t_start, t_end, wav_bytes).
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
        overlap_sec: float = 0.5,
    ) -> Generator[Tuple[int, float, float, bytes], None, None]:
        """
        Yields (chunk_index, t_start, t_end, wav_bytes) with overlap.
        """
        with wave.open(str(file_path), "rb") as wf:
            nchannels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            total_frames = wf.getnframes()

            frames_per_chunk = int(chunk_duration_sec * framerate)
            overlap_frames = int(overlap_sec * framerate)
            step_frames = max(1, frames_per_chunk - overlap_frames)

            chunk_index = 0
            start_frame = 0

            while start_frame < total_frames:
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
                t_start = start_frame / float(framerate)
                t_end = min((start_frame + frames_to_read) / float(framerate), total_frames / float(framerate))

                yield (chunk_index, t_start, t_end, chunk_bytes)

                start_frame += step_frames
                chunk_index += 1

                # If this chunk reached the end of the file, break
                if start_frame + overlap_frames >= total_frames and frames_to_read < frames_per_chunk:
                    break

    @staticmethod
    def create_dummy_wav(duration_sec: float = 15.0, framerate: int = 16000) -> bytes:
        """Helper to create a valid silent/tone WAV in-memory for unit testing."""
        import struct

        nchannels = 1
        sampwidth = 2
        total_frames = int(duration_sec * framerate)

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(nchannels)
            wf.setsampwidth(sampwidth)
            wf.setframerate(framerate)
            raw_data = struct.pack(f"<{total_frames}h", *([0] * total_frames))
            wf.writeframes(raw_data)
        return buf.getvalue()
