from .base import BaseTranscriber, validate_audio_format, split_audio_file, cleanup_temp_files
from typing import Callable
import os


class APITranscriber(BaseTranscriber):
    """OpenAI Whisper API transcription service."""

    def __init__(self, api_key: str):
        try:
            import openai
        except ImportError:
            raise RuntimeError("openai package required. Install with: pip install openai")

        self.client = openai.OpenAI(api_key=api_key)

    def transcribe(self, file_path: str) -> str:
        """
        Transcribe audio file using OpenAI Whisper API.
        Automatically splits file if larger than 25MB.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        if not validate_audio_format(file_path):
            raise ValueError(f"Unsupported audio format: {file_path}")

        chunks = split_audio_file(file_path, max_size_mb=25)
        is_chunked = len(chunks) > 1

        try:
            transcriptions = []
            for chunk_path in chunks:
                with open(chunk_path, 'rb') as audio_file:
                    response = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                    transcriptions.append(response.text)

            return ' '.join(transcriptions)

        except Exception as e:
            raise RuntimeError(f"Transcription failed: {str(e)}")

        finally:
            if is_chunked:
                cleanup_temp_files(chunks)

    def transcribe_with_progress(self, file_path: str, callback: Callable[[float], None]) -> str:
        """
        Transcribe with progress updates (0.0 to 1.0).
        Progress is estimated based on chunk processing.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        if not validate_audio_format(file_path):
            raise ValueError(f"Unsupported audio format: {file_path}")

        chunks = split_audio_file(file_path, max_size_mb=25)
        is_chunked = len(chunks) > 1
        total_chunks = len(chunks)

        try:
            transcriptions = []
            for i, chunk_path in enumerate(chunks):
                with open(chunk_path, 'rb') as audio_file:
                    response = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                    transcriptions.append(response.text)

                callback((i + 1) / total_chunks)

            return ' '.join(transcriptions)

        except Exception as e:
            raise RuntimeError(f"Transcription failed: {str(e)}")

        finally:
            if is_chunked:
                cleanup_temp_files(chunks)
