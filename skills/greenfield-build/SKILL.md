---
name: greenfield-build
description: >
  Genere le code complet (backend + frontend) depuis l'architecture.
  Backend : scripts de generation (DB, CRUD, routes, assembly) + agents (services, jobs, utils).
  Frontend : agents (composants par entite + shell).
  Tests cibles par phase, seed data adaptatif, tests finaux E2E avec Playwright.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Task
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif (ex: `./tests-note/docs/prd.md`). Le dossier projet est communique par l'utilisateur ou le workflow parent.

# De l'architecture au code — Build hybride (scripts + agents)

**Principe** : le backend formulaire (DB, CRUD, routes, assembly) est genere par des scripts Python depuis les JSON configs. Les couches complexes (services, jobs, utils, frontend) restent agents.

## Prerequis

Verifier existence de :
- `docs/architecture/configs/` — Doit contenir au minimum `db.json`, `assembly.json`, et au moins un `crud-*.json` + `routes-*.json`
- `docs/architecture/frontend/frontend-architecture.md`

Si les JSON configs sont absents → STOP → `/greenfield-architecture`

---

## Prerequis — Credentials

> Les credentials sont deja dans `docs/.env` (genere par `/greenfield-research`).
> Le setup (Phase 0) copie ce fichier dans `dev/backend/.env`.
> Si `docs/.env` est absent ou incomplet, demander a l'utilisateur de lancer `/greenfield-research` d'abord.

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

Cela execute dans l'ordre :
1. `generate_config()` — `.env` + `config.py` depuis `assembly.json`
2. `generate_db()` — `models.py` + `001_initial_schema.sql` depuis `db.json`
3. `generate_crud()` — `crud/{entity}.py` + tests depuis chaque `crud-*.json`
4. `generate_routes()` — `models/{entity}.py` + `routes/{entity}.py` + tests depuis chaque `routes-*.json`
5. `generate_job_skeletons()` — `jobs/{entity}.py` squelettes depuis chaque `jobs-*.json`
6. `generate_service_skeletons()` — `services/{name}.py` squelettes depuis `services.json`
7. `generate_assembly()` — `main.py`, `models/__init__.py`, `conftest.py`, `pyproject.toml`

### Post-scripts : migration + tests cibles

```bash
cd {project}/dev/backend
psql -U {db_user} -d {db_name} -f app/database/migrations/001_initial_schema.sql
source .venv/bin/activate && python -m pytest tests/test_crud/ tests/test_routes/ -v 2>&1 | head -100
```

**Si tests passent** → passer a la phase 2.
**Si erreurs** → auto-fix (max 3 tentatives).

---

## Phase 2 — Build backend logique (agents, seulement si necessaire)

### Services (si squelettes existent)

```
Pour chaque service dans services/:
  Agent(build-service, prompt="service_name: {service}, backend_path: dev/backend, research_path: ../lib/researches/{service}.md. Le squelette existe — remplir l'implementation reelle. Lire config.py EN PREMIER.")
```

Apres chaque agent service, tester uniquement ce service :
```bash
python -m pytest tests/test_services/test_{service}.py -v
```

### Utils (agent, si mentionnes dans business-logic)

```
Pour chaque entite ayant une section Utils:
  Agent(build-utils, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend")
```

Apres chaque agent utils, tester uniquement cette entite :
```bash
python -m pytest tests/test_utils/test_{entity}.py -v
```

### Jobs (si squelettes existent)

```
Pour chaque entite ayant un jobs/{entity}.py:
  Agent(build-jobs, prompt="entity: {entity}, backend_path: dev/backend. Le squelette existe dans jobs/{entity}.py — remplir les fonctions. Les jobs appellent les vrais CRUD, services et utils — PAS de mock. Lire le code existant AVANT.")
```

Apres chaque agent jobs, tester uniquement cette entite :
```bash
python -m pytest tests/test_jobs/test_{entity}.py -v
```

---

## Phase 2.5 — Review backend logic (agent + corrections)

### Etape 1 : Audit (read-only)

**Agent** : `review-backend-logic` (Sonnet)

```
Agent(review-backend-logic, prompt="backend_path: dev/backend, architecture_path: docs/architecture/backend")
```

L'agent scanne `core/` (jobs, utils, services) et produit un rapport avec :
- **Critiques** (V1-V3, V6, V9) : SQL dans jobs, logique pure dans jobs, jobs trop larges, entites a combiner, code duplique a extraire en job primaire
- **Warnings** (V4-V5, V7-V8) : wrappers inutiles, redondances, suffixes de couche, fichiers plats prefixes

### Etape 2 : Corrections (agent principal)

L'agent principal lit le rapport et agit selon le volume :

**Peu de corrections (< 5 fixes)** → l'agent principal corrige directement.

**Beaucoup de corrections (5+ fixes)** → deleguer a un agent Sonnet dedie :
```
Agent(sonnet, prompt="Appliquer les corrections suivantes au backend.
Rapport de review : {rapport}
Backend path : dev/backend
Regles : .claude/resources/rules/backend-architecture-context.md
IMPORTANT : ne corriger QUE ce qui est dans le rapport, ne pas toucher au reste.")
```

**Ambiguite architecturale** (ex: V9 extraction job primaire, V3 split de job) → proposer a l'utilisateur, attendre validation.

### Etape 3 : Re-validation ciblee

Apres corrections, tester uniquement les fichiers modifies :
```bash
# Identifier les fichiers modifies et lancer leurs tests
python -m pytest tests/test_jobs/ tests/test_utils/ -v  # ou les dossiers specifiques touches
```

**Si tests cassent** → auto-fix (max 3 tentatives).
**Si OK** → passer au frontend.

---

## Phase 3 — Frontend par entite (agents)

**Agent** : `build-entity-frontend` (Sonnet) par entite

```
Pour chaque entite:
  Agent(build-entity-frontend, prompt="entity: {entity}, api_path: docs/architecture/backend/api/{entity}.md, frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend, mockups_path: docs/mockups")
```

---

## Phase 4 — Frontend global (agent)

**Agent** : `build-frontend-shell` (Sonnet)

```
Agent(build-frontend-shell, prompt="frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend, mockups_path: docs/mockups")
```

---

## Phase 5 — Tests finaux

### 5.1 Backend — Tests complets

Lancer TOUS les tests backend une seule fois (c'est le seul passage global) :

```bash
cd dev/backend && source .venv/bin/activate && python -m pytest -v 2>&1 | head -150
```

**Si erreurs** → auto-fix (max 3 tentatives).

### 5.2 Frontend — Build

```bash
cd dev/frontend && npm install && npm run build 2>&1 | head -50
```

**Si erreurs** → auto-fix (max 3 tentatives).

### 5.3 Seed data

Generer un script `dev/backend/seed.py` adaptatif selon le projet :

1. **Lire le PRD** → identifier les roles (admin, user, owner, etc.) ou l'absence de roles
2. **Lire le schema** → identifier les tables, contraintes, FK obligatoires
3. **Generer le script** qui cree le strict minimum pour que l'app soit utilisable

**Cas possibles (detectes depuis PRD + schema) :**

| Cas | Seed |
|-----|------|
| Pas d'auth, juste un mot de passe admin | 1 entry config/settings avec mot de passe hashe |
| Auth simple sans roles | 1 user de test |
| Auth avec roles | 1 user par role defini dans le PRD |
| Entites avec FK obligatoires | Donnees minimales pour satisfaire les FK |

```python
# Exemple de seed.py genere
"""Seed data — donnees initiales pour {project}."""
import asyncio
import asyncpg
from config.config import settings

async def seed():
    pool = await asyncpg.create_pool(settings.database_url)

    # Users (1 par role)
    admin = await create_user(pool, email="admin@test.com", password="admin123", role="admin")
    user = await create_user(pool, email="user@test.com", password="user123", role="user")

    # Donnees de base (FK satisfaites)
    # ... adapte au schema du projet

    await pool.close()
    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed())
```

Executer le seed :
```bash
cd dev/backend && source .venv/bin/activate && python seed.py
```

### 5.4 Backend — Tests d'integration

Verifier que l'app fonctionne reellement :

```bash
# Lancer le backend
cd dev/backend && source .venv/bin/activate && uvicorn app.main:app --port 8000 &
sleep 3

# Verifier que l'app repond
curl -s http://localhost:8000/health

# Tester la connexion (si auth)
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Tester 2-3 endpoints principaux avec le token obtenu
curl -s http://localhost:8000/api/{entity} -H "Authorization: Bearer {token}"

# Arreter le backend
kill %1
```

### 5.5 Frontend — Tests E2E (Playwright MCP)

Lancer le backend + frontend, puis tester avec Playwright :

```bash
# Lancer backend + frontend
cd dev/backend && source .venv/bin/activate && uvicorn app.main:app --port 8000 &
cd dev/frontend && npm run dev &
sleep 5
```

Tests Playwright MCP :
1. **Ouvrir l'app** → verifier que la page charge (pas de page blanche)
2. **Login** (si auth) → se connecter avec admin@test.com / admin123
3. **Redirection** → verifier qu'on arrive sur la bonne page apres login
4. **Pages principales** → naviguer sur 2-3 pages, verifier qu'elles affichent du contenu
5. **Console** → verifier qu'il n'y a pas d'erreurs JS critiques

```bash
# Arreter backend + frontend
kill %1 %2
```

**Si des erreurs sont detectees** → auto-fix (max 3 tentatives).

---

## CHECKPOINT — C'est pret

```
Build termine

Backend (scripts) :
- Config : .env + config.py
- DB : models.py + migration
- CRUD : X/Y entites + tests
- Routes : X endpoints + tests
- Assembly : main.py + __init__.py

Backend (agents) :
- Services : X implementes + testes
- Jobs : X implementes + testes
- Utils : X implementes + testes
- Review : X violations corrigees

Tests finaux :
- pytest global : X passed, Y failed
- Frontend build : OK/KO
- Seed data : X users, Y entites creees
- Integration : endpoints principaux OK/KO
- Playwright E2E : pages principales OK/KO

L'application est prete.
```

---

## Regles transversales

- **Config** : TOUJOURS `from config.config import settings`, JAMAIS `os.environ`
- **Trailing slash** : `@router.post("")` JAMAIS `"/"`
- **Scripts d'abord** : utiliser `build_backend_from_configs()` pour tout le formulaire
- **JSON configs** : stockes dans `docs/architecture/configs/`
- **Tests cibles** : chaque phase teste uniquement ce qui vient d'etre ajoute
- **Test global** : une seule fois, en Phase 5.1
- **Services** : les agents build-jobs utilisent les VRAIS services (pas des mocks)
- **Seed** : adaptatif, base sur le PRD et le schema (pas de donnees generiques)
