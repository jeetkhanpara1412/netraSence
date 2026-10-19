import time
from collections import defaultdict


class RateLimiter:
    def __init__(self, limit_per_minute: int = 60):
        self.limit_per_minute = limit_per_minute
        self._buckets = defaultdict(list)

    def allow(self, key: str) -> bool:
        now = time.time()
        window_start = now - 60
        requests = self._buckets[key]
        requests[:] = [ts for ts in requests if ts > window_start]
        if len(requests) >= self.limit_per_minute:
            return False
        requests.append(now)
        return True


def get_client_key(request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
