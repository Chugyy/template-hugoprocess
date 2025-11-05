"""
Tests fonctionnels pour resources ownership
Projet : cache-pagination-filters-refactoring
Généré automatiquement par test-executor
"""

import pytest
from unittest.mock import Mock
from app.api.helpers import verify_ownership


def test_get_resource_ownership():
    """FUNC-2: Test verify_ownership signature correcte pour resources"""
    # Mock entity (resource liée à un contact)
    resource_entity = {
        "id": 1,
        "entity_type": "contact",
        "entity_id": 77,
        "user_id": 7,
        "title": "Test Resource"
    }

    # Test 1: Ownership valide
    try:
        verify_ownership(resource_entity, user_id=7, entity_type="contact")
        print("✓ verify_ownership accepts valid ownership")
    except Exception as e:
        pytest.fail(f"verify_ownership should not raise for valid ownership: {e}")

    # Test 2: Ownership invalide (mauvais user_id)
    with pytest.raises(Exception) as exc_info:
        verify_ownership(resource_entity, user_id=999, entity_type="contact")
    assert "401" in str(exc_info.value) or "Unauthorized" in str(exc_info.value), \
        "Should raise 401 for wrong user_id"
    print("✓ verify_ownership raises 401 for wrong user_id")

    # Test 3: Entity inexistante (None cause TypeError car entity["user_id"] fail)
    with pytest.raises(TypeError) as exc_info:
        verify_ownership(None, user_id=7, entity_type="contact")
    assert "NoneType" in str(exc_info.value), "Should raise TypeError for None entity"
    print("✓ verify_ownership raises TypeError for None entity (expected behavior)")
