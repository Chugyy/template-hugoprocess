---
name: greenfield-build
description: >
  Génère le code complet (backend + frontend) depuis l'architecture.
  Agents exécutants parallélisés par entité. 1 checkpoint final.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Task
model: opus
user-invocable: true
disable-model-invocation: true
---

# De l'architecture au code

Agents exécutants Sonnet, parallélisés par entité. Aucune décision d'architecture — tout est dans les documents produits par `/greenfield-architecture`.

## Prérequis

→ Vérifier existence de :
- `docs/architecture/backend/schema.md` — Si absent, STOP → `/greenfield-architecture`
- `docs/architecture/backend/api/` — Au moins 1 fichier `{entity}.md`
- `docs/architecture/frontend/frontend-architecture.md`

→ Lister les entités depuis `docs/architecture/backend/api/*.md` (1 fichier = 1 entité)

---

## Phase 0 — Setup infrastructure

### 0.1 — Squelettes

**Action** : Script Python
**Script** : `.claude/resources/scripts/setup-infrastructure.py`

```bash
python .claude/resources/scripts/setup-infrastructure.py --app-name {app_name} --create-admin
```

**Produit** : `dev/backend/` + `dev/frontend/` (squelettes, configs, dépendances)

**Si le script n'existe pas** : créer manuellement les dossiers depuis les templates :
- `.claude/resources/templates/code/backend/` → `dev/backend/`
- `.claude/resources/templates/code/frontend/` → `dev/frontend/`

### 0.2 — Configuration .env complète

**OBLIGATOIRE** — Configurer les variables d'environnement AVANT toute génération de code.

1. **Lire `.env` à la racine du projet** (s'il existe) → récupérer les clés API déjà fournies par le client
2. **Lire `docs/to-research.md`** → identifier tous les services externes et leurs variables
3. **Compléter `dev/backend/config/.env`** avec TOUTES les variables :
   - Application (APP_NAME, DEBUG, HOST, PORT, PRODUCTION)
   - Database (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) — utiliser les mêmes valeurs que le setup script
   - JWT (JWT_SECRET_KEY avec une valeur dev, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, JWT_REFRESH_EXPIRATION_DAYS)
   - SMTP (depuis `.env` racine si fourni)
   - Clés API de chaque service externe (depuis `.env` racine si fournies, sinon vides)
   - Frontend URL pour CORS
4. **Compléter `dev/backend/config/.env.example`** — même structure, sans les secrets
5. **Mettre à jour `dev/backend/config/config.py`** — ajouter un champ `settings.{variable}` pour CHAQUE variable du `.env`
6. **Compléter `dev/frontend/.env.local`** — `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
7. **Créer `docs/env-reference.md`** — référence unique de toutes les variables avec statut (fourni/en attente)

**Règle critique** : Tout le code backend accède aux variables via `from config.config import settings` puis `settings.{variable}`. JAMAIS `os.environ` directement. Cette règle est transmise à TOUS les agents via leurs instructions.

---

## Phase 1 — Database (séquentiel, 1 agent)

**Agent** : `generate-database` (Sonnet)
**Input** :
- `docs/architecture/backend/schema.md`
- `.claude/resources/templates/code/backend/app/database/`
**Output** :
- `dev/backend/app/database/models.py` (SQLAlchemy, documentation)
- `dev/backend/app/database/migrations/001_initial_schema.sql` (CREATE TABLE réel)

```
Agent(generate-database, prompt="schema_path: docs/architecture/backend/schema.md, backend_path: dev/backend")
```

**Attendre la fin avant Phase 2** — models.py est lu par les agents suivants.

---

## Phase 2 — Backend par entité (PARALLÈLE, N agents)

**Agent** : `build-entity-backend` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/business-logic/{entity}.md`
- `docs/architecture/backend/api/{entity}.md`
- `docs/architecture/backend/schema.md` (lecture seule, section entité)
- `.claude/resources/templates/code/backend/`
**Output par agent** :
- `dev/backend/app/database/crud/{entity}.py`
- `dev/backend/app/core/jobs/{entity}.py` (si Jobs définis)
- `dev/backend/app/core/services/{entity}.py` (si Services définis)
- `dev/backend/app/core/utils/{entity}.py` (si Utils définis)
- `dev/backend/app/api/models/{entity}.py` (Pydantic)
- `dev/backend/app/api/routes/{entity}.py` (FastAPI)
- `dev/backend/tests/test_crud/test_{entity}.py`

```
Pour chaque entité :
  Agent(build-entity-backend, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend. IMPORTANT: lire dev/backend/config/config.py EN PREMIER pour comprendre le pattern settings. Toute config via 'from config.config import settings', JAMAIS os.environ.")
```

**Règle** : chaque agent écrit UNIQUEMENT ses fichiers nommés par entité. Aucun agent ne touche aux fichiers partagés (models.py, main.py, __init__.py).

### 2.1 — Entités business-only (sans API)

Après Phase 2, vérifier les entités référencées dans `business-logic/*.md` mais absentes de `api/*.md`. Ces entités n'ont pas de routes mais sont importées par d'autres Jobs/Services → **générer leurs CRUDs** :

```
Pour chaque entité dans business-logic/*.md SANS fichier api/{entity}.md correspondant :
  Agent(build-entity-backend, prompt="entity: {entity}, architecture_path: docs/architecture/backend, backend_path: dev/backend. ENTITÉ BUSINESS-ONLY : générer UNIQUEMENT crud/{entity}.py (pas de routes, pas de models Pydantic). Lire config.py EN PREMIER.")
```

---

## Phase 2.5a — Services réels (PARALLÈLE, 1 agent Opus par service)

**Agent** : `build-service` (Opus) × N services externes
**Input par agent** :
- `docs/to-resarch.md` (section du service)
- `docs/architecture/backend/business-logic/*.md` (contexte d'appel)
- `docs/architecture/backend/schema.md`
- Code backend existant (`dev/backend/`)
**Output par agent** :
- `dev/backend/app/core/services/{service_name}.py` — wrapper réel (remplace le stub)
- `dev/backend/tests/test_services/test_{service_name}.py` — tests unitaires + intégration
- `dev/backend/reports/service-{service_name}.md` — rapport de réconciliation

```
Pour chaque service externe identifié dans to-resarch.md :
  Agent(build-service, prompt="service_name: {service}, to-resarch_path: docs/to-resarch.md, architecture_path: docs/architecture/backend, backend_path: dev/backend. IMPORTANT: lire dev/backend/config/config.py EN PREMIER. Toute config via 'from config.config import settings' (ex: settings.stripe_secret_key, settings.apify_api_token, etc.), JAMAIS os.environ.")
```

**Règle** : chaque agent écrit UNIQUEMENT ses fichiers de service + tests + rapport. Aucune modification de fichiers partagés (models.py, migrations, routes, jobs).

**Si `docs/to-resarch.md` n'existe pas** : SKIP cette phase — les services restent en stub (comportement original).

---

## Phase 2.5b — Réconciliation services (SÉQUENTIEL, 1 agent Opus)

**Agent** : `reconcile-services` (Opus)
**Input** :
- Tous les rapports `dev/backend/reports/service-*.md`
- Code backend existant (`dev/backend/`)
**Output** :
- `dev/backend/app/database/migrations/002_services_integration.sql` — migration SQL consolidée
- Mises à jour de `models.py`, routes, jobs, models Pydantic
- `dev/backend/reports/reconciliation-summary.md` — rapport final

```
Agent(reconcile-services, prompt="backend_path: dev/backend, architecture_path: docs/architecture/backend")
```

**Attendre la fin avant Phase 3** — les modifications impactent le code backend que le frontend consomme.

### Post-réconciliation : installer les dépendances

```bash
cd dev/backend && pip install -r requirements.txt
```

**Si aucun rapport dans `dev/backend/reports/`** : SKIP cette phase.

---

## Phase 3 — Frontend par entité (PARALLÈLE, N agents)

**Agent** : `build-entity-frontend` (Sonnet) × N entités
**Input par agent** :
- `docs/architecture/backend/api/{entity}.md`
- `docs/architecture/frontend/frontend-architecture.md` (section entité)
- `.claude/resources/templates/code/frontend/`
**Output par agent** :
- `dev/frontend/src/services/{entity}/api.ts`
- `dev/frontend/src/services/{entity}/types.ts`
- `dev/frontend/src/hooks/use-{entity}.ts`
- `dev/frontend/src/components/{entity}/*.tsx` (composants spécifiques)

```
Pour chaque entité :
  Agent(build-entity-frontend, prompt="entity: {entity}, api_path: docs/architecture/backend/api/{entity}.md, frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend")
```

---

## Phase 4 — Frontend global (séquentiel, 1 agent)

**Agent** : `build-frontend-shell` (Sonnet)
**Input** :
- `docs/architecture/frontend/frontend-architecture.md`
- `dev/frontend/src/services/` (produits phase 3)
- `dev/frontend/src/components/` (produits phase 3)
- `.claude/resources/templates/code/frontend/`
**Output** :
- `dev/frontend/src/app/layout.tsx`
- `dev/frontend/src/app/page.tsx`
- `dev/frontend/src/app/{entity}/page.tsx` (pages par entité)
- `dev/frontend/src/components/layout/` (sidebar, header, navigation)
- `dev/frontend/src/lib/providers.tsx`

```
Agent(build-frontend-shell, prompt="frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, frontend_path: dev/frontend")
```

---

## Phase 5 — Assemblage + Validation

### 5.1 Assemblage (action directe ou script)

Générer les fichiers partagés qui importent tout :
- `dev/backend/app/api/routes/__init__.py` — importe tous les routers
- `dev/backend/app/main.py` — enregistre les routers FastAPI
- `dev/frontend/src/app/` — routing Next.js (si pas déjà fait)

### 5.2 Validation automatique

```bash
cd dev/backend && python -m pytest 2>&1 | head -50
cd dev/frontend && npm run build 2>&1 | head -50
```

**Si erreurs** : auto-fix (max 3 tentatives par erreur). Si échec après 3 tentatives, noter dans le rapport.

---

## 🛑 CHECKPOINT unique — Ça tourne

**Présenter à l'utilisateur** :
- Entités codées : X (liste)
- Fichiers générés : arborescence complète
- Tests backend : Y passed, Z failed
- Build frontend : OK / KO (avec erreurs si KO)
- Services intégrés : X réels / Y stubs restants
- Réconciliation : migration 002 appliquée, X tables/colonnes ajoutées

**Utilisateur** : "OK" ou feedbacks ciblés

---

## Fin du workflow

```
Livrables :
- dev/backend/ (FastAPI complet, ~85% fonctionnel)
  - CRUD + Jobs + Services + Utils + Routes + Models + Tests
- dev/frontend/ (Next.js complet)
  - Layout + Pages + Composants + Services + Hooks + Types

Services :
- Intégrés (wrappers réels + tests) : {liste}
- Stubs restants (credentials manquants) : {liste}
- Migration 002 (services) : appliquée
- Variables d'environnement : voir .env.example

L'application est prête pour le développement itératif.
```
