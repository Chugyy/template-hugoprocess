"""Tests for API helpers"""
import pytest
from fastapi import HTTPException
from app.api.helpers import verify_ownership, paginated_response


def test_verify_ownership_match():
    """FUNC-4: Test verify_ownership with matching user"""
    entity = {"id": 1, "user_id": 123, "title": "Test"}
    user_id = 123

    # Should not raise exception
    verify_ownership(entity, user_id, "Task")


def test_verify_ownership_mismatch():
    """FUNC-5: Test verify_ownership with mismatched user"""
    entity = {"id": 1, "user_id": 456, "title": "Test"}
    user_id = 123

    # Should raise 401
    with pytest.raises(HTTPException) as exc_info:
        verify_ownership(entity, user_id, "Task")

    assert exc_info.value.status_code == 401
    assert "not found or unauthorized" in exc_info.value.detail


def test_paginated_response_format():
    """FUNC-6: Test paginated_response format"""
    data = [{"id": 1}, {"id": 2}]
    total = 50
    offset = 0
    limit = 20

    result = paginated_response(data, total, offset, limit)

    # Verify structure
    assert "data" in result
    assert "pagination" in result
    assert result["data"] == data

    # Verify pagination fields
    pagination = result["pagination"]
    assert "total" in pagination
    assert "offset" in pagination
    assert "limit" in pagination
    assert "has_more" in pagination

    assert pagination["total"] == 50
    assert pagination["offset"] == 0
    assert pagination["limit"] == 20


def test_paginated_response_has_more_true():
    """FUNC-7: Test has_more = true when more pages exist"""
    data = []
    total = 50
    offset = 0
    limit = 10

    result = paginated_response(data, total, offset, limit)

    # has_more should be true (0 + 10 < 50)
    assert result["pagination"]["has_more"] is True


def test_paginated_response_has_more_false():
    """FUNC-8: Test has_more = false on last page"""
    data = []
    total = 50
    offset = 40
    limit = 10

    result = paginated_response(data, total, offset, limit)

    # has_more should be false (40 + 10 >= 50)
    assert result["pagination"]["has_more"] is False
