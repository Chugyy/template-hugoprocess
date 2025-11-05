# TEST PLAN : cache-pagination-filters-refactoring

## 🎨 UI Tests (5)

### UI-1 : Cache invalidation visible après création resource [CRITICAL]

**Feature** : Après création d'une resource (URL ou file), la liste doit se rafraîchir immédiatement sans cache obsolète

**Steps** :
1. Se connecter à l'application
2. Ouvrir un contact/project/task avec DetailSidebar
3. Cliquer sur "Add Resource" dans la section Resources
4. Créer une resource URL (titre + URL)
5. Observer la liste des resources dans la sidebar

**Expected** : La nouvelle resource apparaît immédiatement dans la liste sans délai (cache invalidé correctement côté backend)

**Priority** : CRITICAL

---

### UI-2 : Cache invalidation visible après création note [CRITICAL]

**Feature** : Après création d'une note, la liste doit se rafraîchir immédiatement sans cache obsolète

**Steps** :
1. Se connecter à l'application
2. Ouvrir un contact/project/task avec DetailSidebar
3. Cliquer sur "Add Note" dans la section Notes
4. Créer une note (contenu markdown)
5. Observer la liste des notes dans la sidebar

**Expected** : La nouvelle note apparaît immédiatement dans la liste sans délai (cache invalidé correctement côté backend)

**Priority** : CRITICAL

---

### UI-3 : Update resource ne retourne pas données obsolètes [HIGH]

**Feature** : Modification d'une resource doit invalider le cache et retourner données à jour

**Steps** :
1. Se connecter à l'application
2. Ouvrir un contact/project/task ayant des resources
3. Cliquer sur "Edit" d'une resource existante
4. Modifier le titre de la resource
5. Sauvegarder
6. Observer la liste des resources

**Expected** : Le titre modifié apparaît immédiatement (cache invalidé via `cache.invalidate(f"resources:{user_id}")`)

**Priority** : HIGH

---

### UI-4 : Delete resource ne retourne pas données obsolètes [HIGH]

**Feature** : Suppression d'une resource doit invalider le cache et retirer immédiatement l'item

**Steps** :
1. Se connecter à l'application
2. Ouvrir un contact/project/task ayant des resources
3. Cliquer sur "Delete" (trash icon) d'une resource
4. Confirmer la suppression dans la modal
5. Observer la liste des resources

**Expected** : La resource disparaît immédiatement de la liste (cache invalidé)

**Priority** : HIGH

---

### UI-5 : Operations CRUD multiples maintiennent cohérence cache [MEDIUM]

**Feature** : Séquence rapide de create/update/delete doit maintenir cohérence du cache

**Steps** :
1. Se connecter à l'application
2. Ouvrir un contact/project/task
3. Créer 2 resources rapidement (URL)
4. Éditer la première resource
5. Supprimer la deuxième resource
6. Rafraîchir la page complètement (F5)
7. Observer la liste des resources

**Expected** : La liste affiche exactement 1 resource (la première modifiée), état cohérent avec DB

**Priority** : MEDIUM

---

## 🔧 Backend Tests (14)

### API-1 : POST /api/resources (URL) invalide cache [CRITICAL]

**Endpoint** : `POST /api/resources/url`

**Command** :
```bash
curl -X POST http://localhost:8001/api/resources/url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "contact",
    "entity_id": 1,
    "resource_type": "url",
    "title": "Documentation",
    "url": "https://example.com/docs"
  }'
```

**Expected status** : 201

**Expected response** :
```json
{
  "id": 1,
  "entity_type": "contact",
  "entity_id": 1,
  "resource_type": "url",
  "title": "Documentation",
  "url": "https://example.com/docs",
  "user_id": 1,
  "created_at": "2025-10-22T10:00:00Z"
}
```

**Expected behavior** : Logs backend affichent `cache.invalidate(f"resources:{user_id}")` appelé à la ligne 45 de resources.py

**Priority** : CRITICAL

---

### API-2 : POST /api/resources (file) invalide cache [CRITICAL]

**Endpoint** : `POST /api/resources/file`

**Command** :
```bash
curl -X POST http://localhost:8001/api/resources/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "entity_type=task" \
  -F "entity_id=5" \
  -F "resource_type=file" \
  -F "title=Contract PDF" \
  -F "file=@/path/to/contract.pdf"
```

**Expected status** : 201

**Expected response** :
```json
{
  "id": 2,
  "entity_type": "task",
  "entity_id": 5,
  "resource_type": "file",
  "title": "Contract PDF",
  "file_path": "/uploads/...",
  "file_size": 102400,
  "mime_type": "application/pdf",
  "user_id": 1,
  "created_at": "2025-10-22T10:05:00Z"
}
```

**Expected behavior** : Logs backend affichent `cache.invalidate(f"resources:{user_id}")` appelé à la ligne 86 de resources.py

**Priority** : CRITICAL

---

### API-3 : POST /api/notes invalide cache [CRITICAL]

**Endpoint** : `POST /api/notes`

**Command** :
```bash
curl -X POST http://localhost:8001/api/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "project",
    "entity_id": 3,
    "content": "# Meeting Notes\nDiscussed project timeline"
  }'
```

**Expected status** : 201

**Expected response** :
```json
{
  "id": 1,
  "entity_type": "project",
  "entity_id": 3,
  "content": "# Meeting Notes\nDiscussed project timeline",
  "user_id": 1,
  "created_at": "2025-10-22T10:10:00Z"
}
```

**Expected behavior** : Logs backend affichent `cache.invalidate(f"notes:{user_id}")` appelé à la ligne 32 de notes.py

**Priority** : CRITICAL

---

### API-4 : PUT /api/resources/{id} invalide cache [HIGH]

**Endpoint** : `PUT /api/resources/{id}`

**Command** :
```bash
curl -X PUT http://localhost:8001/api/resources/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Documentation",
    "url": "https://example.com/new-docs"
  }'
```

**Expected status** : 200

**Expected response** :
```json
{
  "id": 1,
  "title": "Updated Documentation",
  "url": "https://example.com/new-docs",
  "updated_at": "2025-10-22T10:15:00Z"
}
```

**Expected behavior** : Cache invalidé (ligne 159 de resources.py, déjà existant avant migration)

**Priority** : HIGH

---

### API-5 : PUT /api/notes/{id} invalide cache [HIGH]

**Endpoint** : `PUT /api/notes/{id}`

**Command** :
```bash
curl -X PUT http://localhost:8001/api/notes/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Updated Meeting Notes\nRevised timeline"
  }'
```

**Expected status** : 200

**Expected response** :
```json
{
  "id": 1,
  "content": "# Updated Meeting Notes\nRevised timeline",
  "updated_at": "2025-10-22T10:20:00Z"
}
```

**Expected behavior** : Cache invalidé (ligne 103 de notes.py, déjà existant avant migration)

**Priority** : HIGH

---

### API-6 : DELETE /api/resources/{id} invalide cache [HIGH]

**Endpoint** : `DELETE /api/resources/{id}`

**Command** :
```bash
curl -X DELETE http://localhost:8001/api/resources/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected status** : 204

**Expected response** : (empty body)

**Expected behavior** : Cache invalidé (ligne 205 de resources.py, déjà existant avant migration)

**Priority** : HIGH

---

### API-7 : DELETE /api/notes/{id} invalide cache [HIGH]

**Endpoint** : `DELETE /api/notes/{id}`

**Command** :
```bash
curl -X DELETE http://localhost:8001/api/notes/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected status** : 204

**Expected response** : (empty body)

**Expected behavior** : Cache invalidé (ligne 118 de notes.py, déjà existant avant migration)

**Priority** : HIGH

---

### API-8 : GET /api/resources vérifie cache key pattern [CRITICAL]

**Endpoint** : `GET /api/resources?entity_type=contact&entity_id=1`

**Command** :
```bash
curl -X GET "http://localhost:8001/api/resources?entity_type=contact&entity_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected status** : 200

**Expected response** :
```json
[
  {
    "id": 1,
    "entity_type": "contact",
    "entity_id": 1,
    "title": "Documentation",
    "url": "https://example.com/docs",
    "created_at": "2025-10-22T10:00:00Z"
  }
]
```

**Expected behavior** : Logs backend affichent cache key format `resources:{user_id}:...` (pattern-based, non MD5 pur)

**Priority** : CRITICAL

---

### API-9 : GET /api/notes vérifie cache key pattern [CRITICAL]

**Endpoint** : `GET /api/notes?entity_type=project&entity_id=3`

**Command** :
```bash
curl -X GET "http://localhost:8001/api/notes?entity_type=project&entity_id=3" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected status** : 200

**Expected response** :
```json
[
  {
    "id": 1,
    "entity_type": "project",
    "entity_id": 3,
    "content": "# Meeting Notes\nDiscussed project timeline",
    "created_at": "2025-10-22T10:10:00Z"
  }
]
```

**Expected behavior** : Logs backend affichent cache key format `notes:{user_id}:...` (pattern-based, non MD5 pur)

**Priority** : CRITICAL

---

### API-10 : Invalidation pattern wildcard fonctionne [CRITICAL]

**Endpoint** : N/A (test interne cache)

**Command** :
```bash
# Test via Python shell backend
cd dev/backend
source .venv/bin/activate
python -c "
from app.core.cache import cache
# Simuler clés multiples
cache.cache['resources:1:abc12345:0:20'] = ['item1']
cache.cache['resources:1:def67890:10:20'] = ['item2']
cache.cache['notes:1:xyz11111:0:20'] = ['note1']
# Invalider toutes resources user 1
cache.invalidate('resources:1')
# Vérifier
assert 'resources:1:abc12345:0:20' not in cache.cache
assert 'resources:1:def67890:10:20' not in cache.cache
assert 'notes:1:xyz11111:0:20' in cache.cache  # Non affecté
print('OK')
"
```

**Expected output** : `OK`

**Expected behavior** : `cache.invalidate(f"resources:{user_id}")` supprime TOUTES clés commençant par `resources:{user_id}` (pattern matching)

**Priority** : CRITICAL

---

### FUNC-1 : _generate_key retourne clés pattern-based [CRITICAL]

**Function** : `_generate_key`

**File** : `/Users/hugohoarau/Desktop/CODE/PERSO/personal-dashboard/dev/backend/app/core/cache.py`

**Command** :
```bash
cd dev/backend
source .venv/bin/activate
pytest tests/test_cache.py::test_generate_key_pattern -v
```

**Expected** : Test vérifie que clé retournée commence par `{table}:{user_id}:` au lieu de MD5 hash pur

**Example assertion** :
```python
key = cache._generate_key('tasks', 1, {'status': 'pending'}, 0, 20)
assert key.startswith('tasks:1:'), f"Expected pattern-based key, got {key}"
assert len(key.split(':')) == 5, "Expected format table:user:hash:offset:limit"
```

**Priority** : CRITICAL

---

### FUNC-2 : verify_ownership signature correcte (resources) [HIGH]

**Function** : `verify_ownership` (usage dans resources.py)

**File** : `/Users/hugohoarau/Desktop/CODE/PERSO/personal-dashboard/dev/backend/app/api/routes/resources.py`

**Command** :
```bash
cd dev/backend
source .venv/bin/activate
pytest tests/test_resources.py::test_get_resource_ownership -v
```

**Expected** :
- Test vérifie que `verify_ownership` est appelé avec signature `(entity: Dict, user_id: int, entity_type: str)`
- Test vérifie que 401 est retourné si `entity["user_id"] != current_user.id`
- Test vérifie que 404 est retourné si resource inexistante

**Priority** : HIGH

---

### FUNC-3 : verify_ownership signature correcte (notes) [HIGH]

**Function** : `verify_ownership` (usage dans notes.py)

**File** : `/Users/hugohoarau/Desktop/CODE/PERSO/personal-dashboard/dev/backend/app/api/routes/notes.py`

**Command** :
```bash
cd dev/backend
source .venv/bin/activate
pytest tests/test_notes.py::test_get_note_ownership -v
```

**Expected** :
- Test vérifie que `verify_ownership` est appelé avec signature `(entity: Dict, user_id: int, entity_type: str)`
- Test vérifie que 401 est retourné si `entity["user_id"] != current_user.id`
- Test vérifie que 404 est retourné si note inexistante

**Priority** : HIGH

---

### FUNC-4 : Cache coherence après opérations multiples [MEDIUM]

**Function** : Cache complet (integration test)

**File** : `/Users/hugohoarau/Desktop/CODE/PERSO/personal-dashboard/dev/backend/app/core/cache.py`

**Command** :
```bash
cd dev/backend
source .venv/bin/activate
pytest tests/test_cache.py::test_cache_coherence_multiple_ops -v
```

**Expected** :
1. Créer 3 resources via POST (cache invalidé 3×)
2. GET /api/resources (cache miss → DB query → cache set)
3. Update resource 2 (cache invalidé)
4. GET /api/resources (cache miss → DB query → cache set)
5. Delete resource 3 (cache invalidé)
6. GET /api/resources (cache miss → DB query)
7. Vérifier réponse finale contient exactement 2 resources (1 et 2, avec 2 modifiée)

**Priority** : MEDIUM

---

## 📊 Résumé

- **UI tests** : 5
- **API tests** : 10
- **Function tests** : 4
- **Total** : 19 tests

**Breakdown by priority** :
- CRITICAL : 10
- HIGH : 7
- MEDIUM : 2
- LOW : 0

---

## 📝 Notes d'exécution

### Prérequis
- Backend lancé : `cd dev/backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8001`
- Token valide : `export TOKEN=$(curl -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123"}' | jq -r .access_token)`
- Base de données initialisée avec données test

### Ordre d'exécution recommandé
1. **Tests FUNC** : Vérifier fonctions unitaires (cache._generate_key, verify_ownership)
2. **Tests API POST** : Vérifier invalidation cache après create
3. **Tests API GET** : Vérifier cache key pattern correct
4. **Tests API PUT/DELETE** : Vérifier invalidation après update/delete
5. **Tests UI** : Validation manuelle end-to-end

### Logs à surveiller
- Backend logs doit afficher :
  - `cache invalidated: resources:{user_id}` après POST/PUT/DELETE resource
  - `cache invalidated: notes:{user_id}` après POST/PUT/DELETE note
  - Cache keys format `{table}:{user_id}:{hash[:8]}:{offset}:{limit}`

### Erreurs connues avant migration
- ❌ POST /api/resources/url + POST /api/resources/file ne invalidaient PAS le cache (lignes manquantes)
- ❌ POST /api/notes ne invalidait PAS le cache (ligne manquante)
- ❌ Cache keys MD5 pur empêchaient pattern matching (`cache.invalidate(f"resources:{user_id}")` ne fonctionnait pas)
- ❌ verify_ownership dans resources.py/notes.py avait signature incorrecte (appelé comme async function au lieu de Dict)

### Validation migration MIGRATION_RESULT.md
- ✅ Ligne 45 resources.py : `cache.invalidate(f"resources:{current_user.id}")` ajouté après POST URL
- ✅ Ligne 86 resources.py : `cache.invalidate(f"resources:{current_user.id}")` ajouté après POST file
- ✅ Ligne 32 notes.py : `cache.invalidate(f"notes:{current_user.id}")` ajouté après POST note
- ✅ Cohérence CRUD : Les 3 opérations (CREATE, UPDATE, DELETE) invalident maintenant le cache correctement
- ⚠️ Reste à implémenter (Phases 1-4 VALIDATED_FINAL_VALUE.md) :
  - Task 1.1 : Modifier `_generate_key()` pour clés pattern-based (BLOQUANT)
  - Task 2.1 : Créer `get_resources_paginated()` et `get_notes_paginated()` (CRUD pagination)
  - Task 3.1/3.2 : Modifier routes GET /api/resources et /api/notes pour pagination
  - Task 4.1/4.2 : Corriger `verify_ownership()` signature (resources + notes)
  - Task 5.1 : Adapter tests backend pour nouvelles signatures

### Migration actuelle (complétée)
**Status** : ✅ Migration partielle complétée (3/3 modifications)
- POST /api/resources/url → Cache invalidation ajoutée
- POST /api/resources/file → Cache invalidation ajoutée
- POST /api/notes → Cache invalidation ajoutée

**Impact** :
- Résout partiellement bug cache obsolète après CREATE
- UPDATE et DELETE déjà fonctionnels (existants avant migration)
- Pattern matching cache keys reste à implémenter (Task 1.1)

### Tests manuels post-migration recommandés
1. **Resources** :
   - Créer une resource URL → Vérifier liste rafraîchie (devtools réseau)
   - Créer une resource file → Vérifier liste rafraîchie
   - Vérifier logs backend affichent `cache invalidated: resources:{user_id}`

2. **Notes** :
   - Créer une note → Vérifier liste rafraîchie (devtools réseau)
   - Vérifier logs backend affichent `cache invalidated: notes:{user_id}`

3. **Cohérence cache** :
   - Séquence CREATE → UPDATE → DELETE → Vérifier état final cohérent

---

## 🎯 Prochaines étapes

### Phase 1 : Implémenter Task 1.1 (BLOQUANT)
Modifier `cache._generate_key()` pour clés pattern-based permettant pattern matching correct.

### Phase 2-4 : Implémenter pagination et corrections
- Task 2.1 : CRUD paginated functions
- Task 3.1-3.2 : Routes pagination
- Task 4.1-4.2 : Corriger verify_ownership

### Phase 5 : Adapter tests backend
Vérifier que tous les tests passent avec nouvelles signatures.

### Phase 6 : Validation end-to-end
Exécuter ce TEST_PLAN complet pour valider l'implémentation finale.

---

**Date de génération** : 2025-10-22
**Agent** : test-generator
**Projet** : cache-pagination-filters-refactoring
**Basé sur** : VALIDATED_FINAL_VALUE.md + MIGRATION_RESULT.md + DELEGATION.md
**Status** : ✅ Prêt pour exécution (tests migration partielle + tests complets futurs)
