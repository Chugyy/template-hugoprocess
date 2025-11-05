import time
import threading


class AnthropicRateLimiter:
    def __init__(self):
        self.calls = []
        self.lock = threading.Lock()

    def wait(self):
        self._wait(self.calls, max_calls=50, period=60)

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


anthropic_limiter = AnthropicRateLimiter()
