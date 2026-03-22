---
name: build-jobs
description: >
  Génère les jobs (orchestration métier) + tests E2E pour UNE entité.
  Les jobs appellent les vrais CRUD, services et utils — pas de mock.
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Build Jobs — Orchestration métier pour une entité

## Objectif

Générer les jobs (fonctions d'orchestration) et leurs tests end-to-end pour UNE entité. Les jobs assemblent CRUD + services + utils pour réaliser une action métier complète.

## Arguments attendus

- `entity` : Nom de l'entité (ex: "booking")
- `architecture_path` : Chemin vers architecture (ex: `docs/architecture/backend`)
- `backend_path` : Chemin vers le backend (ex: `dev/backend`)

## Process

### 1. Lire les specs ET le code existant

1. `{architecture_path}/business-logic/{entity}.md` — Section Jobs (workflows complets, étape par étape)
2. `{backend_path}/app/database/crud/{entity}.py` — Fonctions CRUD disponibles (signatures réelles)
3. `{backend_path}/app/core/services/*.py` — Services disponibles (signatures réelles)
4. `{backend_path}/app/core/utils/{entity}.py` — Utils disponibles (signatures réelles)

**CRITIQUE** : lire le code existant pour connaître les vraies signatures. Ne pas deviner.

### 2. Générer Jobs (`core/jobs/{entity}.py`)

Pour chaque Job dans business-logic, suivre le workflow EXACTEMENT :

```python
from app.database.crud.{entity} import *
from app.core.services.{service} import *
from app.core.utils.{entity} import *

async def create_{entity}(pool, **params):
    # 1. Validation (utils)
    validate_{entity}_data(params)

    # 2. Transaction DB (CRUD)
    async with pool.acquire() as conn:
        async with conn.transaction():
            result = await create_{entity}_db(pool, **params)

    # 3. Side effects hors transaction (services)
    await send_notification(...)

    return result
```

**Règles des Jobs** :
- Les Jobs n'accèdent JAMAIS à la DB directement — toujours via CRUD
- Les side effects (email, notifications) sont HORS transaction
- L'ordre des étapes suit EXACTEMENT le workflow de la business-logic
- Les imports pointent vers les vrais fichiers existants

### 3. Générer Tests E2E (`tests/test_jobs/test_{entity}.py`)

Les tests appellent les vrais jobs avec vrais CRUD + services + utils :

```python
import pytest
from app.core.jobs.{entity} import *

@pytest.mark.asyncio
async def test_create_{entity}_full_workflow(pool):
    """Test E2E : validation → DB → side effects."""
    result = await create_{entity}(pool, name="Test", ...)
    assert result["id"] is not None
    assert result["name"] == "Test"

    # Vérifier que l'entité est bien en DB
    from app.database.crud.{entity} import get_{entity}_by_id
    fetched = await get_{entity}_by_id(pool, result["id"])
    assert fetched is not None

@pytest.mark.asyncio
async def test_create_{entity}_validation_error(pool):
    """Test : la validation bloque avant la DB."""
    with pytest.raises(ValueError):
        await create_{entity}(pool, name="", ...)

@pytest.mark.asyncio
async def test_{complex_job}_workflow(pool):
    """Test E2E du workflow complet."""
    # Setup
    entity = await create_{entity}(pool, ...)
    # Action
    result = await {complex_action}(pool, entity["id"], ...)
    # Assertions
    assert result["status"] == "completed"
```

**Tests E2E** : pas de mock. Si un service externe est BLOQUÉ (pas de clé API), marquer le test `@pytest.mark.skipif`.

### 4. Gestion des services bloqués

Si un service est en stub (`pass` + TODO) :
- Le job l'appelle quand même (le stub ne fait rien)
- Le test vérifie le workflow SANS l'effet du service
- Ajouter un commentaire : `# TODO: vérifier {effect} quand {service} sera implémenté`

## Output

- `{backend_path}/app/core/jobs/{entity}.py`
- `{backend_path}/tests/test_jobs/test_{entity}.py`

## Règles strictes

- NE PAS modifier d'autres fichiers
- Lire les VRAIS fichiers existants pour les imports (pas deviner les signatures)
- Jobs = orchestration UNIQUEMENT — pas de SQL, pas de logique de validation directe
- Suivre le workflow de business-logic étape par étape
- Tests E2E sans mock (sauf services bloqués → skip)
- Configuration : `from config.config import settings`, JAMAIS `os.environ`
