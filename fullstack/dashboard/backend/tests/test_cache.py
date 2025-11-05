"""Tests for SimpleCache"""
import pytest
import time
from datetime import datetime, timedelta
from app.core.cache import SimpleCache, CacheEntry


def test_cache_get_set():
    """FUNC-9: Test basic cache get/set functionality"""
    cache = SimpleCache(ttl=300)
    key = "test:123:key"
    value = {"data": [1, 2, 3], "count": 10}

    # Set and get immediately
    cache.set(key, value)
    result = cache.get(key)

    assert result == value
    assert result["data"] == [1, 2, 3]
    assert result["count"] == 10


def test_cache_ttl_expiration():
    """FUNC-10: Test cache TTL expiration"""
    cache = SimpleCache(ttl=1)  # 1 second TTL
    key = "test:expire:key"
    value = {"data": "test"}

    # Set value
    cache.set(key, value)

    # Should exist immediately
    assert cache.get(key) == value

    # Wait for expiration (2 seconds to be safe)
    time.sleep(2)

    # Should return None after expiration
    result = cache.get(key)
    assert result is None

    # Key should be removed from cache
    assert key not in cache._cache


def test_cache_invalidate_pattern():
    """FUNC-11: Test cache invalidation by pattern"""
    cache = SimpleCache(ttl=300)

    # Set multiple keys with different patterns
    cache.set("tasks:123:pending", {"data": [1]})
    cache.set("tasks:123:completed", {"data": [2]})
    cache.set("tasks:456:pending", {"data": [3]})
    cache.set("projects:123:active", {"data": [4]})

    # Verify all exist
    assert cache.get("tasks:123:pending") is not None
    assert cache.get("tasks:123:completed") is not None
    assert cache.get("tasks:456:pending") is not None
    assert cache.get("projects:123:active") is not None

    # Invalidate pattern "tasks:123"
    cache.invalidate("tasks:123")

    # Only tasks:123:* should be deleted
    assert cache.get("tasks:123:pending") is None
    assert cache.get("tasks:123:completed") is None
    assert cache.get("tasks:456:pending") is not None  # Different user
    assert cache.get("projects:123:active") is not None  # Different table


def test_cache_cleanup_expired():
    """Test internal cleanup of expired entries"""
    cache = SimpleCache(ttl=1)

    # Add entries
    cache.set("key1", "value1")
    cache.set("key2", "value2")

    # Wait for expiration
    time.sleep(2)

    # Cleanup
    cache._cleanup_expired()

    # All should be removed
    assert len(cache._cache) == 0
