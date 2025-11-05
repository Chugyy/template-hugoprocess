from .api import APITranscriber
from .local import LocalTranscriber
from typing import Dict
import threading
import asyncio
from datetime import datetime, timedelta
from app.database.crud import update_exchange
from app.database.db import get_async_db_connection
from config.config import settings


class TaskState:
    """Encapsulates transcription task state."""

    def __init__(self):
        self.status = 'pending'
        self.progress = 0.0
        self.cancel_event = threading.Event()
        self.error = None
        self.created_at = datetime.now()
        self.result = None


class TranscriptionManager:
    """Singleton orchestrator for audio transcription with thread-safe state management."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.tasks = {}
            cls._instance.lock = threading.Lock()
        return cls._instance

    def start_transcription(self, exchange_id: int, file_path: str, mode: str = None, db_session=None) -> str:
        """
        Launch async transcription task in background thread.

        Args:
            exchange_id: CommunicationHistory ID
            file_path: Audio file path
            mode: 'api' or 'local' (defaults to config)
            db_session: not used (kept for backward compat)

        Returns:
            task_id (str(exchange_id))
        """
        with self.lock:
            if exchange_id in self.tasks:
                raise RuntimeError(f"Task {exchange_id} already running")

            self.tasks[exchange_id] = TaskState()

        mode = mode or settings.transcription_mode_default

        thread = threading.Thread(
            target=self._worker,
            args=(exchange_id, file_path, mode),
            daemon=True
        )
        thread.start()

        return str(exchange_id)

    def cancel_transcription(self, exchange_id: int) -> bool:
        """Signal cancellation for running task."""
        with self.lock:
            if exchange_id not in self.tasks:
                return False
            task = self.tasks[exchange_id]
            if task.status not in ('pending', 'processing'):
                return False
            task.cancel_event.set()
            task.status = 'cancelled'
        return True

    def get_status(self, exchange_id: int) -> dict:
        """Return current task state snapshot."""
        with self.lock:
            if exchange_id not in self.tasks:
                return {"status": "not_found"}
            task = self.tasks[exchange_id]
            return {
                "status": task.status,
                "progress": task.progress,
                "text": task.result,
                "error": task.error
            }

    def _worker(self, exchange_id: int, file_path: str, mode: str):
        """Background worker that executes transcription."""
        try:
            with self.lock:
                self.tasks[exchange_id].status = 'processing'

            transcriber = self._get_transcriber(mode)

            def progress_callback(progress: float):
                with self.lock:
                    if self.tasks[exchange_id].cancel_event.is_set():
                        raise InterruptedError("Transcription cancelled")
                    self.tasks[exchange_id].progress = progress

            text = transcriber.transcribe_with_progress(file_path, progress_callback)

            with self.lock:
                if self.tasks[exchange_id].cancel_event.is_set():
                    return

            # Create dedicated connection for DB update in background thread
            async def save_transcription():
                conn = await get_async_db_connection()
                try:
                    await update_exchange(conn, exchange_id, transcription=text)
                finally:
                    await conn.close()

            asyncio.run(save_transcription())

            with self.lock:
                self.tasks[exchange_id].status = 'completed'
                self.tasks[exchange_id].result = text
                self.tasks[exchange_id].progress = 1.0

        except InterruptedError:
            with self.lock:
                self.tasks[exchange_id].status = 'cancelled'

        except Exception as e:
            with self.lock:
                self.tasks[exchange_id].status = 'failed'
                self.tasks[exchange_id].error = str(e)

        finally:
            threading.Timer(3600, lambda: self._cleanup_task(exchange_id)).start()

    def _get_transcriber(self, mode: str):
        """Factory for transcriber instances."""
        if mode == 'api':
            api_key = settings.openai_api_key
            if not api_key:
                raise ValueError("OPENAI_API_KEY not configured")
            return APITranscriber(api_key)
        elif mode == 'local':
            return LocalTranscriber(model_name='tiny')
        else:
            raise ValueError(f"Invalid mode: {mode}")

    def _cleanup_task(self, exchange_id: int):
        """Remove task from memory after retention period."""
        with self.lock:
            if exchange_id in self.tasks:
                del self.tasks[exchange_id]
