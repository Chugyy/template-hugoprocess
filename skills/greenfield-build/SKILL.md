---
name: greenfield-build
description: >
  Génère le code complet (backend + frontend) depuis l'architecture.
  Backend : scripts de génération (DB, CRUD, routes, assembly) + agents (services, jobs, utils).
  Frontend : agents (composants par entité + shell).
  Chaque couche est testée avant de passer à la suivante.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Task
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif (ex: `./tests-note/docs/prd.md`). Le dossier projet est communiqué par l'utilisateur ou le workflow parent.

# De l'architecture au code — Build hybride (scripts + agents)

**Principe** : le backend formulaire (DB, CRUD, routes, assembly) est généré par des scripts Python depuis les JSON configs produits par les agents d'architecture. Les couches complexes (services, jobs, utils, frontend) restent agents.

## Prérequis

Vérifier existence de :
- `docs/architecture/configs/` — Doit contenir au minimum `db.json`, `assembly.json`, et au moins un `crud-*.json` + `routes-*.json`
- `docs/architecture/frontend/frontend-architecture.md`

Si les JSON configs sont absents → STOP → `/greenfield-architecture`

---

## Prérequis — Clés API

> **REGLE** : Avant de lancer le build, vérifier dans `docs/to-research.md` si des services externes nécessitent des clés API. Si des credentials sont EN ATTENTE, DEMANDER explicitement à l'utilisateur de les fournir : "Pour builder et tester les services, j'ai besoin de tes clés API : {liste}. Tu peux me les donner maintenant ?"
> Les clés seront écrites dans le `.env` du backend.

---

## Phase 0 — Setup infrastructure (script)

```bash
python .claude/resources/scripts/setup-infrastructure.py \
  --app-name {app_name} \
  --backend-path {project}/dev/backend \
  --frontend-path {project}/dev/frontend
```

---

## Phase 1 — Build backend complet (scripts, une commande)

```python
import sys
sys.path.insert(0, '.claude/resources/scripts')
from generators import build_backend_from_configs
from pathlib import Path

build_backend_from_configs(
    configs_path=Path('{project}/docs/architecture/configs'),
    backend_path=Path('{project}/dev/backend')
)
```

Cela exécute dans l'ordre :
1. `generate_config()` — `.env` + `config.py` depuis `assembly.json`
2. `generate_db()` — `models.py` + `001_initial_schema.sql` depuis `db.json`
3. `generate_crud()` — `crud/{entity}.py` + tests depuis chaque `crud-*.json`
4. `generate_routes()` — `models/{entity}.py` + `routes/{entity}.py` + tests depuis chaque `routes-*.json`
5. `generate_job_skeletons()` — `jobs/{entity}.py` squelettes depuis chaque `jobs-*.json`
6. `generate_service_skeletons()` — `services/{name}.py` squelettes depuis `services.json`
7. `generate_assembly()` — `main.py`, `models/__init__.py`, `conftest.py`, `pyproject.toml`

### Post-scripts : migration + validation

```bash
cd {project}/dev/backend
psql -U {db_user} -d {db_name} -f app/database/migrations/001_initial_schema.sql
source .venv/bin/activate && python -m pytest -v 2>&1 | head -100
```

**Si tests passent** → le backend formulaire est complet. Passer à la phase 2.
**Si erreurs** → auto-fix (max 3 tentatives).

---

## Phase 2 — Build backend logique (agents, seulement si nécessaire)

### Services (si squelettes existent)

```
Pour chaque service dans services/:
  Agent(build-service, prompt="service_name: {service}, backend_path: dev/backend, research_path: docs/research/{service}.md. Le squelette existe — remplir l'implémentation réelle. Lire config.py EN PREMIER.")
```

### Jobs (si squelettes existent)

```
Pour chaque entité ayant un jobs/{entity}.py:
  Agent(build-jobs, prompt="entity: {entity}, backend_path: dev/backend. Le squelette existe dans jobs/{entity}.py — remplir les fonctions. Les jobs appellent les vrais CRUD, services et utils — PAS de mock. Lire le code existant AVANT.")
```

### Utils (agent, si mentionnés dans business-logic)

```
Pour chaque entité ayant une section Utils:
  Agent(build-utils, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend")
```

### Post-agents : validation

```bash
cd dev/backend && source .venv/bin/activate && python -m pytest -v 2>&1 | head -100
```

---

## Phase 3 — Frontend par entité (agents)

**Agent** : `build-entity-frontend` (Sonnet) par entité

```
Pour chaque entité:
  Agent(build-entity-frontend, prompt="entity: {entity}, api_path: docs/architecture/backend/api/{entity}.md, frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend, mockups_path: docs/mockups")
```

---

## Phase 4 — Frontend global (agent)

**Agent** : `build-frontend-shell` (Sonnet)

```
Agent(build-frontend-shell, prompt="frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend, mockups_path: docs/mockups")
```

---

## Phase 5 — Validation globale

### Backend
```bash
cd dev/backend && source .venv/bin/activate && python -m pytest -v 2>&1 | head -100
```

### Frontend
```bash
cd dev/frontend && npm install && npm run build 2>&1 | head -50
```

**Si erreurs** : auto-fix (max 3 tentatives).

---

## CHECKPOINT — C'est prêt

```
Build terminé

Backend (scripts) :
- Config : .env + config.py
- DB : models.py + migration
- CRUD : X/Y entités + tests
- Routes : X endpoints + tests
- Assembly : main.py + __init__.py
- Tests : X passed, Y failed

Backend (agents) :
- Services : X implémentés
- Jobs : X implémentés
- Utils : X implémentés

Frontend (agents) :
- Composants : X par entité
- Shell : layout + pages
- Build : OK/KO

L'application est prête.
```

---

## Règles transversales

- **Config** : TOUJOURS `from config.config import settings`, JAMAIS `os.environ`
- **Trailing slash** : `@router.post("")` JAMAIS `"/"`
- **Scripts d'abord** : utiliser `build_backend_from_configs()` pour tout le formulaire
- **JSON configs** : stockés dans `docs/architecture/configs/`
- **Tests** : chaque phase est testée avant de passer à la suivante
- **Services** : les agents build-jobs utilisent les VRAIS services (pas des mocks)
