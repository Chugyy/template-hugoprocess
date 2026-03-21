---
name: build-entity-backend
description: >
  Génère TOUT le code backend pour UNE entité : CRUD, Jobs, Services, Utils,
  Models Pydantic, Routes FastAPI, Tests. Agent exécutant — suit les specs.
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Build Entity Backend

## Objectif

Générer TOUS les fichiers backend pour UNE entité. L'agent lit les specs (business-logic + API + schema) et code. Aucune décision d'architecture — tout est dans les documents.

## Arguments attendus

- `entity` : Nom de l'entité (ex: "property")
- `architecture_path` : Chemin vers architecture (ex: `docs/architecture/backend`)
- `backend_path` : Chemin vers le backend (ex: `dev/backend`)

## Process

### 1. Lire les specs

1. `{backend_path}/../config/config.py` — **OBLIGATOIRE EN PREMIER** — pattern Settings, variables d'env disponibles. Toute config se lit via `from config.config import settings`.
2. `{architecture_path}/business-logic/{entity}.md` — Jobs, CRUD, Services, Utils (signatures, workflows, types)
3. `{architecture_path}/api/{entity}.md` — Endpoints REST (routes, params, responses)
4. `{architecture_path}/schema.md` — Tables et colonnes (section entité)
5. Templates code : `.claude/resources/templates/code/backend/`

### 2. Générer CRUD (`crud/{entity}.py`)

Pour chaque fonction CRUD dans business-logic :

```python
import asyncpg
from typing import Optional, List

async def create_{entity}(pool: asyncpg.Pool, **params) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO {table} ({cols}) VALUES ({placeholders}) RETURNING *",
            *values
        )
        return dict(row)

async def get_{entity}_by_id(pool: asyncpg.Pool, id: int) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM {table} WHERE id = $1", id)
        return dict(row) if row else None

async def list_{entities}(pool: asyncpg.Pool, page: int = 1, limit: int = 20, **filters) -> List[dict]:
    async with pool.acquire() as conn:
        offset = (page - 1) * limit
        rows = await conn.fetch(
            "SELECT * FROM {table} WHERE ... ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit, offset
        )
        return [dict(row) for row in rows]
```

**Patterns** : asyncpg pool, parameterized queries ($1, $2), dict(row) returns.

### 3. Générer Jobs (`core/jobs/{entity}.py`)

Pour chaque Job dans business-logic, suivre le workflow EXACTEMENT :

```python
from app.database.crud.{entity} import *
from app.core.services.{entity} import *
from app.core.utils.{entity} import *

async def create_{entity}(pool, **params):
    # 1. Validation
    validate_{entity}_data(params)
    # 2. Transaction
    async with pool.acquire() as conn:
        async with conn.transaction():
            result = await create_{entity}_db(conn, **params)
    # 3. Side effects (hors transaction)
    await send_notification(...)
    return result
```

**Règle** : les Jobs n'accèdent JAMAIS à la DB directement — toujours via CRUD functions.

### 4. Générer Services (`core/services/{entity}.py`)

```python
async def send_{entity}_notification(email: str, data: dict):
    # TODO: Implémenter avec credentials réels
    # Service externe: {service_name}
    pass
```

**Services mockés** avec `pass` et commentaire TODO.

### 5. Générer Utils (`core/utils/{entity}.py`)

```python
def validate_{entity}_data(data: dict) -> None:
    # Règles depuis business-logic
    if not data.get("name"):
        raise ValueError("name is required")
    ...
```

### 6. Générer Models Pydantic (`api/models/{entity}.py`)

Depuis `api/{entity}.md` → Input/Output de chaque endpoint :

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class {Entity}Create(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    ...

class {Entity}Response(BaseModel):
    id: int
    name: str
    created_at: datetime
    ...

    class Config:
        from_attributes = True
```

### 7. Générer Routes FastAPI (`api/routes/{entity}.py`)

Depuis `api/{entity}.md` → chaque endpoint :

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.models.{entity} import *
from app.core.jobs.{entity} import *
from app.database.crud.{entity} import *

router = APIRouter(prefix="/api/{entities}", tags=["{entities}"])

@router.post("", response_model={Entity}Response, status_code=201)
async def create_{entity}_endpoint(data: {Entity}Create, pool = Depends(get_pool)):
    result = await create_{entity}(pool, **data.model_dump())
    return result

@router.get("", response_model=List[{Entity}Response])
async def list_{entities}_endpoint(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    pool = Depends(get_pool)
):
    return await list_{entities}(pool, page=page, limit=limit)
```

### 8. Générer Tests (`tests/test_crud/test_{entity}.py`)

```python
import pytest

@pytest.mark.asyncio
async def test_create_{entity}(pool):
    result = await create_{entity}(pool, name="Test", ...)
    assert result["name"] == "Test"
    assert result["id"] is not None

@pytest.mark.asyncio
async def test_get_{entity}_by_id(pool):
    created = await create_{entity}(pool, ...)
    fetched = await get_{entity}_by_id(pool, created["id"])
    assert fetched is not None
    assert fetched["id"] == created["id"]
```

## Output

Fichiers créés (UNIQUEMENT nommés par entité — aucun fichier partagé) :
- `{backend_path}/app/database/crud/{entity}.py`
- `{backend_path}/app/core/jobs/{entity}.py` (si Jobs définis)
- `{backend_path}/app/core/services/{entity}.py` (si Services définis)
- `{backend_path}/app/core/utils/{entity}.py` (si Utils définis)
- `{backend_path}/app/api/models/{entity}.py`
- `{backend_path}/app/api/routes/{entity}.py`
- `{backend_path}/tests/test_crud/test_{entity}.py`

## Règles strictes

- NE PAS modifier `models.py`, `main.py`, `__init__.py` ou tout fichier partagé
- NE PAS modifier les fichiers d'une autre entité
- Suivre les signatures EXACTEMENT comme dans business-logic
- Suivre les endpoints EXACTEMENT comme dans api/{entity}.md
- snake_case pour tout le code Python
- Services externes = mock avec TODO
- Configuration : TOUJOURS `from config.config import settings`, JAMAIS `os.environ` directement
- Le `.env` est dans `{backend_path}/../config/.env` — ne pas en créer d'autre
- **Trailing slash** : Toutes les routes décorées `@router.post("")`, `@router.get("")` — JAMAIS `"/"`. Le template FastAPI utilise `redirect_slashes=False`, donc `"/"` causerait un 307 redirect qui perd le header Authorization.
- **get_current_user** retourne un `SimpleNamespace` (accès par attribut : `current_user.id`). Ne pas utiliser `current_user["id"]`.
