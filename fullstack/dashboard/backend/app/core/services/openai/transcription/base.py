from abc import ABC, abstractmethod
from typing import Callable, List
from pathlib import Path
import os
import subprocess
import json


class BaseTranscriber(ABC):
    """Abstract base class for audio transcription services."""

    @abstractmethod
    def transcribe(self, file_path: str) -> str:
        """Transcribe audio file to text."""
        pass

    @abstractmethod
    def transcribe_with_progress(self, file_path: str, callback: Callable[[float], None]) -> str:
        """Transcribe audio with progress callback (0.0 to 1.0)."""
        pass


def validate_audio_format(file_path: str) -> bool:
    """Check if file format is supported for transcription (audio and video)."""
    supported_formats = {
        # Audio formats
        '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm',
        # Video formats (audio will be extracted via ffmpeg)
        '.mp4', '.mov', '.avi', '.mkv', '.m4v', '.quicktime'
    }
    return Path(file_path).suffix.lower() in supported_formats


def split_audio_file(file_path: str, max_size_mb: int = 25) -> List[str]:
    """
    Split audio file into chunks if larger than max_size_mb.
    Returns list of file paths (original if under limit, chunks otherwise).
    """
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)

    if file_size_mb <= max_size_mb:
        return [file_path]

    try:
        from pydub import AudioSegment
    except ImportError:
        raise RuntimeError("pydub required for splitting large files. Install with: pip install pydub")

    audio = AudioSegment.from_file(file_path)
    chunk_duration_ms = int((max_size_mb / file_size_mb) * len(audio) * 0.9)

    chunks = []
    base_path = Path(file_path)

    for i, start in enumerate(range(0, len(audio), chunk_duration_ms)):
        chunk = audio[start:start + chunk_duration_ms]
        chunk_path = base_path.parent / f"{base_path.stem}_chunk_{i}{base_path.suffix}"
        chunk.export(str(chunk_path), format=base_path.suffix[1:])
        chunks.append(str(chunk_path))

    return chunks


def cleanup_temp_files(file_paths: List[str]) -> None:
    """Remove temporary files safely."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            pass


def get_media_duration(file_path: str) -> float:
    """
    Extract duration from audio/video file using ffprobe.

    Args:
        file_path: Path to media file

    Returns:
        Duration in seconds

    Raises:
        FileNotFoundError: If file doesn't exist
        RuntimeError: If ffprobe fails or is not installed
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Media file not found: {file_path}")

    try:
        cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        duration = float(json.loads(result.stdout)['format']['duration'])
        return duration
    except (subprocess.CalledProcessError, KeyError, ValueError) as e:
        raise RuntimeError(f"Failed to extract duration from media file: {e}")
    except FileNotFoundError:
        raise RuntimeError("ffprobe not found. Install ffmpeg with: brew install ffmpeg")
