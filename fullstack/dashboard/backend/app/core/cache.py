from typing import Optional, Any, Dict
from datetime import datetime, timedelta
import hashlib
import json


class CacheEntry:
    def __init__(self, value: Any, expires_at: datetime):
        self.value = value
        self.expires_at = expires_at


class SimpleCache:
    """Cache in-memory simple avec TTL et invalidation par pattern."""

    def __init__(self, ttl: int = 300):
        self._cache: Dict[str, CacheEntry] = {}
        self._ttl = ttl

    def _generate_key(self, table: str, user_id: int, filters: Dict, offset: int, limit: int) -> str:
        """Génère clé unique pour combinaison table/user/filters/pagination."""
        filters_str = json.dumps(filters, sort_keys=True)
        filters_hash = hashlib.md5(filters_str.encode()).hexdigest()[:8]
        return f"{table}:{user_id}:{filters_hash}:{offset}:{limit}"

    def get(self, key: str) -> Optional[Any]:
        """Récupère valeur si non expirée."""
        entry = self._cache.get(key)
        if entry and entry.expires_at > datetime.now():
            return entry.value
        elif entry:
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        """Stocke valeur avec expiration."""
        expires_at = datetime.now() + timedelta(seconds=self._ttl)
        self._cache[key] = CacheEntry(value, expires_at)

    def invalidate(self, pattern: str) -> None:
        """Supprime toutes les clés commençant par pattern."""
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(pattern)]
        for k in keys_to_delete:
            del self._cache[k]

    def _cleanup_expired(self) -> None:
        """Supprime entrées expirées."""
        now = datetime.now()
        keys_to_delete = [k for k, v in self._cache.items() if v.expires_at <= now]
        for k in keys_to_delete:
            del self._cache[k]


# Singleton global
cache = SimpleCache(ttl=300)
