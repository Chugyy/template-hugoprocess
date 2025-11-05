from .base import BaseTranscriber, validate_audio_format
from typing import Callable
import subprocess
import tempfile
import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


class LocalTranscriber(BaseTranscriber):
    """Whisper local transcriber with progress support."""

    def __init__(self, model_name: str = "base"):
        """
        Initialize local Whisper model.

        Args:
            model_name: Whisper model size (tiny, base, small, medium, large, turbo)
        """
        try:
            import whisper
        except ImportError:
            raise RuntimeError("openai-whisper package required. Install with: pip install openai-whisper")

        self.model = whisper.load_model(model_name)
        self.model_name = model_name

    def transcribe(self, file_path: str) -> str:
        """Transcribe audio file to text."""
        if not validate_audio_format(file_path):
            raise ValueError(f"Unsupported audio format: {Path(file_path).suffix}")

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        result = self.model.transcribe(
            file_path,
            language=None,
            temperature=0.0,
            no_speech_threshold=0.8,
            condition_on_previous_text=False
        )
        return result["text"].strip()

    def transcribe_with_progress(self, file_path: str, callback: Callable[[float], None]) -> str:
        """
        Transcribe with progress callback.
        Splits audio into segments and processes in parallel.

        Args:
            file_path: Path to audio file
            callback: Progress callback (0.0 to 1.0)
        """
        if not validate_audio_format(file_path):
            raise ValueError(f"Unsupported audio format: {Path(file_path).suffix}")

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        segments = self._get_segments(file_path, segment_duration=180)
        total_segments = len(segments)
        completed = 0

        with tempfile.TemporaryDirectory() as temp_dir:
            args = [
                (file_path, segment_info, i, temp_dir)
                for i, segment_info in enumerate(segments)
            ]

            results = []
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(self._transcribe_segment, arg): arg for arg in args}

                for future in as_completed(futures):
                    results.append(future.result())
                    completed += 1
                    callback(completed / total_segments)

        return " ".join(text for _, text in sorted(results) if text)

    def _get_segments(self, audio_path: str, segment_duration: int = 180) -> list:
        """Split audio into time segments."""
        cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', audio_path]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        duration = float(json.loads(result.stdout)['format']['duration'])

        return [
            (start, min(segment_duration, duration - start))
            for start in range(0, int(duration), segment_duration)
        ]

    def _transcribe_segment(self, args) -> tuple:
        """Transcribe single audio segment."""
        audio_path, (start_time, duration), segment_index, temp_dir = args

        if duration < 2:
            return segment_index, ""

        segment_path = os.path.join(temp_dir, f"segment_{segment_index}.wav")

        try:
            cmd = ['ffmpeg', '-i', audio_path, '-ss', str(start_time), '-t', str(duration),
                   '-ar', '16000', '-ac', '1', '-y', segment_path]
            subprocess.run(cmd, check=True, capture_output=True)

            if not os.path.exists(segment_path) or os.path.getsize(segment_path) < 5000:
                return segment_index, ""

            result = self.model.transcribe(
                segment_path,
                language=None,
                temperature=0.0,
                no_speech_threshold=0.8,
                condition_on_previous_text=False
            )

            return segment_index, result["text"].strip()

        except Exception:
            return segment_index, ""
        finally:
            if os.path.exists(segment_path):
                os.remove(segment_path)
