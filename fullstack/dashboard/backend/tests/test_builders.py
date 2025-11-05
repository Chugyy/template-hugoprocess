"""Tests for database query builders"""
import pytest
from app.database.builders import build_paginated_query


def test_build_paginated_query_simple_filter():
    """FUNC-1: Test query builder with simple filter"""
    table = "tasks"
    user_id = 123
    filters = {"status": "pending"}
    offset = 0
    limit = 20

    select_query, count_query, params, returned_offset, returned_limit = build_paginated_query(
        table, user_id, filters, offset, limit
    )

    # Verify WHERE clauses
    assert "user_id = $1" in select_query
    assert "status = $2" in select_query
    assert "user_id = $1" in count_query
    assert "status = $2" in count_query

    # Verify parameters
    assert params == [123, "pending", 0, 20]
    assert returned_offset == 0
    assert returned_limit == 20


def test_build_paginated_query_multi_values():
    """FUNC-2: Test query builder with multi-value filter"""
    table = "tasks"
    user_id = 123
    filters = {"status": ["pending", "in_progress"]}
    offset = 0
    limit = 20

    select_query, count_query, params, returned_offset, returned_limit = build_paginated_query(
        table, user_id, filters, offset, limit
    )

    # Verify IN clause
    assert "status IN ($2, $3)" in select_query
    assert "status IN ($2, $3)" in count_query

    # Verify parameters
    assert params == [123, "pending", "in_progress", 0, 20]


def test_build_paginated_query_empty_filters():
    """FUNC-3: Test query builder ignores empty filters"""
    table = "tasks"
    user_id = 123
    filters = {"status": None, "priority": []}
    offset = 10
    limit = 5

    select_query, count_query, params, returned_offset, returned_limit = build_paginated_query(
        table, user_id, filters, offset, limit
    )

    # Only user_id filter should be applied
    assert "user_id = $1" in select_query
    assert "status" not in select_query
    assert "priority" not in select_query

    # Verify parameters (only user_id, offset, limit)
    assert params == [123, 10, 5]
    assert returned_offset == 10
    assert returned_limit == 5
