"""Tests for parsers"""
import pytest
from app.core.utils.parsers import parse_multi_value_filter


def test_parse_multi_value_filter_parsing():
    """FUNC-12: Test multi-value filter parsing"""
    # Basic parsing
    result = parse_multi_value_filter("pending,completed")
    assert result == ["pending", "completed"]

    # With spaces
    result = parse_multi_value_filter("pending, completed, in_progress")
    assert result == ["pending", "completed", "in_progress"]

    # Single value
    result = parse_multi_value_filter("pending")
    assert result == ["pending"]

    # Already a list
    result = parse_multi_value_filter(["pending", "completed"])
    assert result == ["pending", "completed"]

    # Empty string
    result = parse_multi_value_filter("")
    assert result == []

    # Whitespace only
    result = parse_multi_value_filter("   ")
    assert result == []


def test_parse_multi_value_filter_security():
    """FUNC-13: Test SQL injection protection"""
    # Semicolon
    with pytest.raises(ValueError, match="Invalid characters"):
        parse_multi_value_filter("pending; DROP TABLE tasks")

    # SQL comment --
    with pytest.raises(ValueError, match="Invalid characters"):
        parse_multi_value_filter("pending--")

    # SQL comment /* */
    with pytest.raises(ValueError, match="Invalid characters"):
        parse_multi_value_filter("pending/* comment */")

    # Multiple suspicious chars
    with pytest.raises(ValueError, match="Invalid characters"):
        parse_multi_value_filter("pending; DELETE FROM tasks--")
