---
name: greenfield-build
description: >
  Génère le code complet (backend + frontend) depuis l'architecture.
  Build par couches avec tests progressifs : services → CRUD → utils → jobs → routes → frontend.
  Chaque couche est testée avant de passer à la suivante.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Task
model: opus
user-invocable: true
disable-model-invocation: true
---

# De l'architecture au code — Build par couches

Chaque couche est codée, testée et validée avant de passer à la suivante. Si erreur majeure sur une entité → l'agent stoppe cette entité, log l'erreur, passe aux autres. On revient dessus après.

## Prérequis

→ Vérifier existence de :
- `docs/architecture/backend/schema.md`
- `docs/architecture/backend/api/` — Au moins 1 fichier `{entity}.md`
- `docs/architecture/backend/business-logic/` — Au moins 1 fichier `{entity}.md`
- `docs/architecture/frontend/frontend-architecture.md`

→ Lister les entités depuis `docs/architecture/backend/api/*.md`
→ Lister les services externes depuis `docs/to-resarch.md` (si existe)

---

## Phase 0 — Setup infrastructure

### 0.1 — Squelettes

**Script** : `.claude/resources/scripts/setup-infrastructure.py`

```bash
python .claude/resources/scripts/setup-infrastructure.py --app-name {app_name} --create-admin
```

**Si le script n'existe pas** : copier manuellement depuis les templates :
- `.claude/resources/templates/code/backend/` → `dev/backend/`
- `.claude/resources/templates/code/frontend/` → `dev/frontend/`

### 0.2 — Configuration .env complète

**OBLIGATOIRE** avant toute génération de code.

1. **Lire `.env` à la racine** (s'il existe) → clés API déjà fournies
2. **Lire `docs/to-research.md`** → services externes et variables
3. **Compléter `dev/backend/config/.env`** avec TOUTES les variables :
   - Application (APP_NAME, DEBUG, HOST, PORT, PRODUCTION)
   - Database (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
   - JWT (JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, JWT_REFRESH_EXPIRATION_DAYS)
   - SMTP (depuis `.env` racine si fourni)
   - Clés API de chaque service externe
   - Frontend URL pour CORS
4. **Compléter `dev/backend/config/.env.example`** — même structure, sans secrets
5. **Mettre à jour `dev/backend/config/config.py`** — `settings.{variable}` pour CHAQUE variable
6. **Compléter `dev/frontend/.env.local`** — `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
7. **Créer `docs/env-reference.md`** — référence de toutes les variables avec statut

**Règle critique** : `from config.config import settings` — JAMAIS `os.environ` directement.

---

## Phase 1 — Database (séquentiel, 1 agent)

**Agent** : `generate-database` (Sonnet)
**Input** :
- `docs/architecture/backend/schema.md`
- `.claude/resources/templates/code/backend/app/database/`
**Output** :
- `dev/backend/app/database/models.py` (SQLAlchemy, documentation)
- `dev/backend/app/database/migrations/001_initial_schema.sql`

```
Agent(generate-database, prompt="schema_path: docs/architecture/backend/schema.md, backend_path: dev/backend")
```

**Attendre la fin avant Phase 2.**

---

## Phase 2 — Services externes (PARALLÈLE, 1 agent Opus par service)

**Si `docs/to-resarch.md` n'existe pas ou aucun service externe** : SKIP → Phase 3.

**Agent** : `build-service` (Opus) × N services
**Input par agent** :
- `docs/to-resarch.md` (section du service)
- `docs/architecture/backend/business-logic/*.md` (contexte d'appel)
- `docs/architecture/backend/schema.md`
- Code backend existant
**Output par agent** :
- `dev/backend/app/core/services/{service_name}.py` — wrapper réel
- `dev/backend/tests/test_services/test_{service_name}.py` — tests
- `dev/backend/reports/service-{service_name}.md` — rapport

```
Pour chaque service externe :
  Agent(build-service, prompt="service_name: {service}, to-resarch_path: docs/to-resarch.md, architecture_path: docs/architecture/backend, backend_path: dev/backend. IMPORTANT: lire dev/backend/config/config.py EN PREMIER.")
```

### Post-services : installation + validation

```bash
cd dev/backend && pip install -r requirements.txt
cd dev/backend && python -m pytest tests/test_services/ -v 2>&1 | head -80
```

**Si tests échouent** : auto-fix (max 3 tentatives). Si échec persistant → noter et continuer.

**Mettre à jour `.env`** avec les variables découvertes pendant l'implémentation des services.

---

## Phase 3 — CRUD par entité (PARALLÈLE, N agents Sonnet)

**Agent** : `build-crud` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/business-logic/{entity}.md` (section CRUD)
- `docs/architecture/backend/schema.md` (section entité)
- `.claude/resources/templates/code/backend/`
**Output par agent** :
- `dev/backend/app/database/crud/{entity}.py`
- `dev/backend/tests/test_crud/test_{entity}.py`

```
Pour chaque entité :
  Agent(build-crud, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend. Lire config.py EN PREMIER.")
```

### Post-CRUD : validation

```bash
cd dev/backend && python -m pytest tests/test_crud/ -v 2>&1 | head -80
```

**Si erreur sur une entité** : noter l'entité en erreur, continuer avec les autres. Les entités en erreur seront exclues des phases suivantes jusqu'à fix.

---

## Phase 4 — Utils par entité (PARALLÈLE, N agents Sonnet)

**Agent** : `build-utils` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/business-logic/{entity}.md` (section Utils)
- Code CRUD existant (pour connaître les types)
**Output par agent** :
- `dev/backend/app/core/utils/{entity}.py`
- `dev/backend/tests/test_utils/test_{entity}.py`

```
Pour chaque entité (sauf celles en erreur) :
  Agent(build-utils, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend")
```

### Post-Utils : validation

```bash
cd dev/backend && python -m pytest tests/test_utils/ -v 2>&1 | head -80
```

**Si entité sans Utils** dans la business-logic → SKIP cette entité pour cette phase.

---

## Phase 5 — Jobs par entité (PARALLÈLE, N agents Sonnet)

**Agent** : `build-jobs` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/business-logic/{entity}.md` (section Jobs)
- Code existant : `crud/{entity}.py`, `services/*.py`, `utils/{entity}.py`
**Output par agent** :
- `dev/backend/app/core/jobs/{entity}.py`
- `dev/backend/tests/test_jobs/test_{entity}.py` — tests E2E (vrais services + CRUD + utils)

```
Pour chaque entité (sauf celles en erreur) :
  Agent(build-jobs, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend. Les jobs appellent les vrais CRUD, services et utils — PAS de mock. Lire le code existant dans crud/, services/, utils/ AVANT de coder.")
```

### Post-Jobs : validation E2E

```bash
cd dev/backend && python -m pytest tests/test_jobs/ -v 2>&1 | head -80
```

**Si entité sans Jobs** → SKIP.

---

## Phase 6 — Routes + Models Pydantic par entité (PARALLÈLE, N agents Sonnet)

**Agent** : `build-routes` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/api/{entity}.md`
- `docs/architecture/backend/business-logic/{entity}.md`
- Code existant : `jobs/{entity}.py`, `crud/{entity}.py`
**Output par agent** :
- `dev/backend/app/api/models/{entity}.py` (Pydantic)
- `dev/backend/app/api/routes/{entity}.py` (FastAPI)
- `dev/backend/tests/test_routes/test_{entity}.py`

```
Pour chaque entité ayant un fichier api/{entity}.md :
  Agent(build-routes, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend. Les routes appellent les jobs (si existent) ou CRUD directement. Lire le code existant AVANT de coder. Lire config.py EN PREMIER.")
```

### Post-Routes : validation

```bash
cd dev/backend && python -m pytest tests/test_routes/ -v 2>&1 | head -80
```

---

## Phase 7 — Réconciliation + Assemblage

### 7.1 Réconciliation services (si rapports existent)

**Si des fichiers `dev/backend/reports/service-*.md` existent :**

**Agent** : `reconcile-services` (Opus)
**Input** : Tous les rapports + code backend
**Output** :
- `dev/backend/app/database/migrations/002_services_integration.sql`
- Mises à jour models.py, routes, jobs, requirements.txt
- `dev/backend/reports/reconciliation-summary.md`

```
Agent(reconcile-services, prompt="backend_path: dev/backend, architecture_path: docs/architecture/backend")
```

### 7.2 Assemblage (action directe)

Générer les fichiers partagés :
- `dev/backend/app/api/routes/__init__.py` — importe tous les routers
- `dev/backend/app/main.py` — enregistre les routers FastAPI

### 7.3 Validation backend complète

```bash
cd dev/backend && pip install -r requirements.txt
cd dev/backend && python -m pytest -v 2>&1 | head -100
```

**Si erreurs** : auto-fix (max 3 tentatives par erreur).

---

## Phase 8 — Frontend par entité (PARALLÈLE, N agents Sonnet)

**Agent** : `build-entity-frontend` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/api/{entity}.md`
- `docs/architecture/frontend/frontend-architecture.md` (section entité)
- `.claude/resources/templates/code/frontend/`
- `docs/mockups/` (si existent — utiliser comme référence visuelle)
**Output par agent** :
- `dev/frontend/src/services/{entity}/api.ts`
- `dev/frontend/src/services/{entity}/types.ts`
- `dev/frontend/src/hooks/use-{entity}.ts`
- `dev/frontend/src/components/{entity}/*.tsx`

```
Pour chaque entité :
  Agent(build-entity-frontend, prompt="entity: {entity}, api_path: docs/architecture/backend/api/{entity}.md, frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend, mockups_path: docs/mockups")
```

---

## Phase 9 — Frontend global (séquentiel, 1 agent)

**Agent** : `build-frontend-shell` (Sonnet)
**Input** :
- `docs/architecture/frontend/frontend-architecture.md`
- `dev/frontend/src/services/` + `dev/frontend/src/components/`
- `.claude/resources/templates/code/frontend/`
- `docs/mockups/` (si existent)
**Output** :
- `dev/frontend/src/app/layout.tsx`
- `dev/frontend/src/app/page.tsx`
- Pages par entité
- Composants layout (sidebar, header, navigation)
- `dev/frontend/src/lib/providers.tsx`

```
Agent(build-frontend-shell, prompt="frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend, mockups_path: docs/mockups")
```

---

## Phase 10 — Validation globale

### 10.1 Backend

```bash
cd dev/backend && python -m pytest -v 2>&1 | head -100
```

### 10.2 Frontend

```bash
cd dev/frontend && npm install && npm run build 2>&1 | head -50
```

**Si erreurs** : auto-fix (max 3 tentatives par erreur). Si échec → noter dans le rapport.

### 10.3 Seed data

Seed TOUTES les entités avec des données réalistes (pas juste les users).

```bash
cd dev/backend && python seed.py
```

---

## 🛑 CHECKPOINT — C'est prêt

**Présenter à l'utilisateur** :

```
✅ Build terminé

Backend :
- Services : X testés ✅, Y stubs restants
- CRUD : X/Y entités ✅
- Utils : X/Y entités ✅
- Jobs : X/Y entités ✅ (tests E2E)
- Routes : X endpoints ✅
- Tests : X passed, Y failed

Frontend :
- Pages : X générées
- Composants : X par entité + Y partagés
- Build : ✅/❌

Entités en erreur (si any) :
- {entité} : {erreur résumée} — à fixer manuellement

L'application est prête. Lance le backend et le frontend pour tester.
```

---

## Règles transversales

- **Config** : TOUJOURS `from config.config import settings`, JAMAIS `os.environ`
- **Trailing slash** : `@router.post("")` JAMAIS `"/"` (redirect_slashes=False)
- **get_current_user** : retourne `SimpleNamespace` (accès par attribut)
- **Fichiers partagés** : aucun agent ne touche `models.py`, `main.py`, `__init__.py` sauf en phase 7
- **Erreur majeure** : l'agent stoppe l'entité, log l'erreur, passe aux autres
- **Tests** : chaque couche est testée avant de passer à la suivante
- **Services** : les agents build-jobs utilisent les VRAIS services (pas des mocks), sauf services BLOQUÉS
