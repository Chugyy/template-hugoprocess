---
name: build-service
description: >
  Construit le wrapper réel pour UN service externe : fetch doc, implémente,
  teste indépendamment, produit un rapport de réconciliation.
  Agent Opus — intégration complexe, pas de la simple génération.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
model: opus
---

# Build Service — Wrapper réel pour un service externe

## Objectif

Créer un wrapper fonctionnel et testé pour UN service externe. Lire la documentation technique, implémenter l'intégration, tester chaque méthode indépendamment, et produire un rapport de ce qui doit changer ailleurs dans le code.

## Arguments attendus

- `service_name` : Nom du service (ex: "stripe", "apify", "whisper", "anthropic")
- `to-resarch_path` : Chemin vers to-resarch.md (ex: `docs/to-resarch.md`)
- `architecture_path` : Chemin vers architecture (ex: `docs/architecture/backend`)
- `backend_path` : Chemin vers le backend (ex: `dev/backend`)

## Process

### 1. Lire les inputs

1. `{backend_path}/../config/config.py` → **OBLIGATOIRE EN PREMIER** — comprendre le pattern Settings et les variables disponibles (`settings.{service}_api_key`, etc.)
2. `{to-resarch_path}` → section du service `{service_name}` (doc résumée, format I/O, limites, patterns)
3. `{architecture_path}/business-logic/*.md` → identifier OÙ ce service est appelé (quels Jobs, quelles fonctions)
4. `{architecture_path}/schema.md` → schema DB actuel
5. `{backend_path}/app/core/services/` → fichier service existant (stub à remplacer)
6. `{backend_path}/app/core/jobs/` → Jobs qui appellent ce service (pour comprendre le contexte d'appel)

### 2. Compléter la documentation si nécessaire

Si la section dans to-resarch.md manque de détails techniques pour implémenter :
1. WebSearch pour `{service_name} python sdk {specific_topic}`
2. WebFetch sur la doc officielle (API reference, exemples)
3. Extraire les signatures exactes, types de retour, codes d'erreur

### 3. Implémenter le wrapper

**Fichier** : `{backend_path}/app/core/services/{service_name}.py`

Principes :
- **Client centralisé** — Une instance/config partagée, pas de recréation à chaque appel
- **Méthodes async** — Toutes les méthodes sont `async def`
- **Types explicites** — Pydantic models pour les inputs/outputs du service (pas de `dict` bruts)
- **Error handling robuste** — Exceptions custom, retry policy si pertinent, logging
- **Idempotence** — Si le service le supporte (ex: Stripe idempotency keys)
- **Configuration via settings** — Toutes les clés/secrets via `from config.config import settings` (JAMAIS `os.environ` directement)

Structure type :

```python
"""
{Service Name} integration.
Doc: {url_doc_officielle}
"""

from typing import Optional
from pydantic import BaseModel
from config.config import settings

# === Types ===

class {Service}Request(BaseModel):
    """Input pour {operation}."""
    ...

class {Service}Response(BaseModel):
    """Output de {operation}."""
    ...

# === Exceptions ===

class {Service}Error(Exception):
    """Erreur {service_name}."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.status_code = status_code
        super().__init__(message)

# === Client ===

# Accès aux clés TOUJOURS via settings, JAMAIS via os.environ
# Ex: settings.stripe_secret_key, settings.apify_api_token, etc.
{client_init_code}

# === Functions ===

async def {operation}({params}) -> {ReturnType}:
    """
    {Description de l'opération}.
    Appelé par : {job/route qui l'appelle}
    """
    {implementation}
```

### 4. Tester indépendamment

**Fichier** : `{backend_path}/tests/test_services/test_{service_name}.py`

2 types de tests :

#### Tests unitaires (sans clé API)
- Valider la construction des requêtes
- Valider le parsing des réponses (depuis des fixtures JSON)
- Valider le error handling (réponses d'erreur simulées)
- Valider les types Pydantic

```python
import pytest
from app.core.services.{service_name} import *

# Fixtures : réponses réelles copiées depuis la doc
SAMPLE_RESPONSE = {json_from_doc}
ERROR_RESPONSE = {error_json_from_doc}

def test_parse_{operation}_response():
    result = {Service}Response(**SAMPLE_RESPONSE)
    assert result.{field} == {expected}

def test_{operation}_error_handling():
    with pytest.raises({Service}Error):
        ...
```

#### Tests d'intégration (avec clé API, optionnels)
- Marqués `@pytest.mark.integration`
- Skip auto si la clé API n'est pas dans settings
- Appels réels au service en mode test/sandbox

```python
from config.config import settings

@pytest.mark.integration
@pytest.mark.skipif(not settings.{service}_api_key, reason="No API key")
async def test_{operation}_real():
    result = await {operation}({test_params})
    assert result is not None
```

### 5. Vérifier la connexion avec le code existant

Lire les Jobs et Routes qui appellent ce service :
- Vérifier que les signatures matchent (params et return types)
- Si le stub avait une signature différente de l'implémentation réelle → noter dans le rapport

### 6. Produire le rapport de réconciliation

**Fichier** : `{backend_path}/reports/service-{service_name}.md`

```markdown
# Service Report: {service_name}

## Wrapper
- `{backend_path}/app/core/services/{service_name}.py` ✅ créé
- `{backend_path}/tests/test_services/test_{service_name}.py` ✅ {X}/{Y} tests pass

## Méthodes implémentées

| Méthode | Appelée par | Testée | Status |
|---------|-------------|--------|--------|
| {method} | {job/route} | ✅/❌ | OK/SIGNATURE CHANGÉE |

## Changements requis ailleurs

### Database
- {Table/colonne à ajouter, avec type et justification}
- {Ou "Aucun changement DB nécessaire"}

### Models Pydantic
- {Champs à ajouter/modifier dans les models API}

### Routes
- {Nouvelles routes nécessaires (ex: webhook endpoint)}
- {Routes existantes à modifier}

### Jobs
- {Jobs dont la signature d'appel au service a changé}
- {Imports à mettre à jour}

### Dependencies
- {packages à ajouter dans requirements.txt avec version}

### Configuration
- {Variables d'environnement ajoutées/modifiées}
```

## Output

Fichiers créés :
- `{backend_path}/app/core/services/{service_name}.py` — Wrapper réel
- `{backend_path}/tests/test_services/test_{service_name}.py` — Tests
- `{backend_path}/reports/service-{service_name}.md` — Rapport de réconciliation

## Règles strictes

- NE PAS modifier les fichiers d'autres services
- NE PAS modifier models.py, migrations, routes ou jobs directement
- TOUT changement nécessaire ailleurs va dans le RAPPORT uniquement
- Utiliser les VRAIS formats I/O de la documentation (pas d'invention)
- Les tests unitaires doivent passer SANS clé API
- Les fixtures de test doivent venir de la documentation officielle
