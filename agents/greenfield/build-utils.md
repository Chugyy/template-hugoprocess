---
name: build-utils
description: >
  Génère les fonctions utilitaires + tests pour UNE entité.
  Logique pure sans I/O : validation, calculs, formatage.
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Build Utils — Fonctions utilitaires pour une entité

## Objectif

Générer les fonctions utilitaires (logique pure, sans I/O) et leurs tests unitaires pour UNE entité.

## Arguments attendus

- `entity` : Nom de l'entité (ex: "property")
- `architecture_path` : Chemin vers architecture (ex: `docs/architecture/backend`)
- `backend_path` : Chemin vers le backend (ex: `dev/backend`)

## Process

### 1. Lire les specs

1. `{architecture_path}/business-logic/{entity}.md` — Section Utils (signatures, règles métier)
2. `{backend_path}/app/database/crud/{entity}.py` — Comprendre les types utilisés par le CRUD

### 2. Générer Utils (`core/utils/{entity}.py`)

Pour chaque fonction Utils dans business-logic :

```python
from typing import Optional, List, Dict, Any

def validate_{entity}_data(data: dict) -> None:
    """Valide les données avant création/modification."""
    if not data.get("name"):
        raise ValueError("name is required")
    if data.get("price") and data["price"] < 0:
        raise ValueError("price must be positive")

def format_{entity}_for_display(entity: dict) -> dict:
    """Formate une entité pour l'affichage."""
    return {
        "id": entity["id"],
        "display_name": entity["name"].title(),
        ...
    }

def calculate_{something}(params) -> result_type:
    """Calcul métier pur."""
    ...
```

**Caractéristiques** :
- Fonctions pures (pas d'I/O, pas d'async, pas d'accès DB)
- Validation par `raise ValueError` / `raise TypeError`
- Retours typés

### 3. Générer Tests (`tests/test_utils/test_{entity}.py`)

```python
import pytest
from app.core.utils.{entity} import *

def test_validate_{entity}_data_valid():
    validate_{entity}_data({"name": "Test", "price": 100})

def test_validate_{entity}_data_missing_name():
    with pytest.raises(ValueError, match="name is required"):
        validate_{entity}_data({"price": 100})

def test_validate_{entity}_data_negative_price():
    with pytest.raises(ValueError, match="price must be positive"):
        validate_{entity}_data({"name": "Test", "price": -1})

def test_format_{entity}_for_display():
    result = format_{entity}_for_display({"id": 1, "name": "test name"})
    assert result["display_name"] == "Test Name"

def test_calculate_{something}():
    result = calculate_{something}(params)
    assert result == expected
```

Tester tous les cas : valide, invalide, edge cases.

## Output

- `{backend_path}/app/core/utils/{entity}.py`
- `{backend_path}/tests/test_utils/test_{entity}.py`

## Règles strictes

- NE PAS modifier d'autres fichiers
- Fonctions PURES uniquement — pas d'I/O, pas d'async, pas de DB
- Suivre les signatures de business-logic
- Tester tous les cas de validation (valide + chaque cas d'erreur)
