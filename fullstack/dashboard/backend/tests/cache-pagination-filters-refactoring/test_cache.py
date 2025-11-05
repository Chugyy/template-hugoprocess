"""
Tests fonctionnels pour cache
Projet : cache-pagination-filters-refactoring
Généré automatiquement par test-executor
"""

import pytest
from app.core.cache import cache


def test_generate_key_pattern():
    """FUNC-1: Test que _generate_key retourne clés pattern-based"""
    # Test simple
    key = cache._generate_key('tasks', 1, {'status': 'pending'}, 0, 20)

    # Vérifier format pattern-based
    assert key.startswith('tasks:1:'), f"Expected pattern-based key, got {key}"

    # Vérifier structure complète
    parts = key.split(':')
    assert len(parts) == 5, f"Expected format table:user:hash:offset:limit, got {len(parts)} parts"

    # Vérifier composants
    assert parts[0] == 'tasks', "First part should be table name"
    assert parts[1] == '1', "Second part should be user_id"
    assert len(parts[2]) == 8, "Third part should be 8-char hash"
    assert parts[3] == '0', "Fourth part should be offset"
    assert parts[4] == '20', "Fifth part should be limit"

    print(f"✓ Generated key: {key}")


def test_cache_invalidate_pattern_wildcard():
    """API-10: Test que invalidation pattern wildcard fonctionne"""
    # Simuler clés multiples (utiliser set() au lieu d'accès direct)
    cache.set('resources:1:abc12345:0:20', ['item1'])
    cache.set('resources:1:def67890:10:20', ['item2'])
    cache.set('notes:1:xyz11111:0:20', ['note1'])

    # Invalider toutes resources user 1
    cache.invalidate('resources:1')

    # Vérifier (utiliser get() au lieu d'accès direct au dict)
    assert cache.get('resources:1:abc12345:0:20') is None, "Should invalidate resources:1:abc12345:0:20"
    assert cache.get('resources:1:def67890:10:20') is None, "Should invalidate resources:1:def67890:10:20"
    assert cache.get('notes:1:xyz11111:0:20') is not None, "Should NOT invalidate notes:1:xyz11111:0:20"

    print("✓ Pattern wildcard invalidation works correctly")


def test_cache_coherence_multiple_ops():
    """FUNC-4: Test cohérence cache après opérations multiples"""
    # NOTE: Ce test sera complété avec des vraies opérations API
    # Pour l'instant, on teste juste le mécanisme de base

    # Simuler séquence: set → invalidate → set
    cache.set('test:1:hash1:0:20', ['data1', 'data2'])
    assert cache.get('test:1:hash1:0:20') == ['data1', 'data2'], "Should get cached data"

    cache.invalidate('test:1')
    assert cache.get('test:1:hash1:0:20') is None, "Should be None after invalidation"

    cache.set('test:1:hash1:0:20', ['data3'])
    assert cache.get('test:1:hash1:0:20') == ['data3'], "Should get new cached data"

    print("✓ Cache coherence maintained across multiple operations")
