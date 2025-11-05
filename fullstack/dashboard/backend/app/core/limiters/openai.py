import time
import threading


class OpenAIRateLimiter:
    def __init__(self):
        self.gpt_calls = []
        self.whisper_calls = []
        self.lock = threading.Lock()

    def wait_for_gpt(self):
        self._wait(self.gpt_calls, max_calls=60, period=60)

    def wait_for_whisper(self):
        self._wait(self.whisper_calls, max_calls=50, period=60)

    def _wait(self, call_list, max_calls, period):
        with self.lock:
            now = time.time()
            call_list[:] = [t for t in call_list if now - t < period]

            if len(call_list) >= max_calls:
                sleep_time = period - (now - call_list[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)
                call_list.clear()

            call_list.append(now)


openai_limiter = OpenAIRateLimiter()
