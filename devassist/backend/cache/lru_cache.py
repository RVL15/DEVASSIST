import hashlib
import time
from collections import OrderedDict
from typing import Optional
from core.config import settings


class LRUCache:
    def __init__(self, max_size: int = settings.CACHE_MAX_SIZE, ttl: int = settings.CACHE_TTL):
        self._cache: OrderedDict = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl

    def _key(self, *args) -> str:
        raw = "|".join(str(a) for a in args)
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, *args) -> Optional[str]:
        k = self._key(*args)
        if k in self._cache:
            value, ts = self._cache[k]
            if time.time() - ts < self._ttl:
                self._cache.move_to_end(k)
                return value
            del self._cache[k]
        return None

    def set(self, *args, value: str):
        k = self._key(*args[:-1]) if args else ""
        # last arg is value key separator — use all args as key, value kwarg as val
        k = self._key(*args)
        self._cache[k] = (value, time.time())
        self._cache.move_to_end(k)
        if len(self._cache) > self._max_size:
            self._cache.popitem(last=False)

    def stats(self) -> dict:
        return {"size": len(self._cache), "max_size": self._max_size, "ttl": self._ttl}


cache = LRUCache()
