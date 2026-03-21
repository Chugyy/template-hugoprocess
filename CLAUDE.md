# Greenfield Development Framework

## Architecture Overview

Ce projet utilise un framework structuré pour le développement greenfield.
L'approche est **Jobs-First** : PRD → Research → Entités → Jobs & Fonctions → Database → API → Services réels → Frontend.

## Stack Technique

- **Backend** : FastAPI + PostgreSQL (asyncpg) + Pydantic v2
- **Frontend** : Next.js + shadcn/ui + Tailwind + React Hook Form + Zod
- **Database** : PostgreSQL, asyncpg pool (pas d'ORM pour les requêtes)

## Skills Disponibles

### Workflow Greenfield (séquentiel)

| Skill | Description | Input | Output |
|-------|-------------|-------|--------|
| `/greenfield-prd` | De l'idée au PRD (brainstorming → brief → user stories → UI tree → PRD → for-later) | Rien | `docs/prd.md` + `docs/for-later.md` |
| `/greenfield-research` | Recherche et validation des dépendances externes (boucle itérative) | `docs/prd.md` | `docs/to-resarch.md` |
| `/greenfield-architecture` | Du PRD + research à l'architecture complète | `docs/prd.md` + `docs/to-resarch.md` | `docs/architecture/` |
| `/greenfield-build` | De l'architecture au code fonctionnel (incluant services réels Opus) | `docs/architecture/` + `docs/to-resarch.md` | `dev/backend/` + `dev/frontend/` |

### Outils

| Skill | Description |
|-------|-------------|
| `/tools-clarify` | Analyse une demande, identifie les zones de flou |
| `/tools-validate` | Valide un markdown de clarification |
| `/tools-frontend-debugger` | Debug itératif frontend |

### Référence (auto-activé)

Le skill `reference` est chargé automatiquement par Claude quand un agent a besoin de consulter les best practices ou templates.

## Routing Rules

- Demande de brainstorming / idée / nouveau projet → `/greenfield-prd`
- Demande de recherche / documentation services / clés API / dépendances → `/greenfield-research`
- Demande d'architecture / schema / API / entités → `/greenfield-architecture`
- Demande de coder / implémenter / build → `/greenfield-build`
- Demande de clarification / zones de flou → `/tools-clarify`
- Demande de validation → `/tools-validate`
- Bug frontend / debug UI → `/tools-frontend-debugger`

## Convention de Nommage

- Noms de fonctions descriptifs, SANS suffixes techniques (`_job`, `_crud`, `_service`)
- Le type est défini par l'emplacement du fichier (`jobs/`, `crud/`, `services/`, `utils/`)
- snake_case en Python, camelCase en JSON (conversion auto via Pydantic BaseSchema)

## Resources

Les best practices et templates sont dans `.claude/resources/` :

- `rules/best-practises-build-api/` — Conventions REST, Pydantic, pagination, sécurité
- `rules/best-practises-build-databases/` — Schema, normalisation, indexation
- `rules/best-practises-build-frontend/` — Design system, Tailwind, composants
- `rules/best-practises-business-logic/` — Jobs, CRUD, Services patterns
- `templates/code/` — Squelettes backend (FastAPI) et frontend (Next.js + shadcn)
- `templates/docs/` — Templates de documents architecture
- `templates/docs/for-later.md` — Template for-later (post-MVP items)
- `templates/projects/` — 5 projets de reference complets (backend + frontend) pour patterns reutilisables
- `templates/projects/INDEX.md` — Catalogue : quel composant dans quel projet, mapping type de page → projet

## Agents

### Agents architecture (Sonnet sauf mention)

| Agent | Rôle | Modèle |
|-------|------|--------|
| `detail-business-logic-entity` | Business logic par entité | Sonnet |
| `schema-architect` | Schema PostgreSQL | Sonnet |
| `api-architect` | API REST par entité | Sonnet |
| `frontend-architect` | Architecture frontend | **Opus** |

### Agents build

| Agent | Rôle | Modèle |
|-------|------|--------|
| `generate-database` | models.py + migration SQL | Sonnet |
| `build-entity-backend` | CRUD, Jobs, Routes, Models, Tests par entité | Sonnet |
| `build-entity-frontend` | Services TS, hooks, composants par entité | Sonnet |
| `build-frontend-shell` | Layout, pages, navigation, routing | Sonnet |
| `build-service` | Wrapper réel d'un service externe + tests | **Opus** |
| `reconcile-services` | Consolidation post-services (migration, mises à jour) | **Opus** |

## Documents Produits (chaîne de contexte)

Chaque étape produit des documents qui deviennent l'input de l'étape suivante :

```
docs/brainstorming.md → docs/brief.md → user stories → UI tree → docs/prd.md + docs/for-later.md
                                            ↓
                         docs/to-resarch.md (research itérative)
                                            ↓
                         docs/architecture/backend/entities.md
                         docs/architecture/backend/fr-mapping.md
                         docs/architecture/backend/business-logic/*.md
                         docs/architecture/backend/schema.md
                         docs/architecture/backend/api/*.md
                         docs/architecture/frontend/frontend-architecture.md
                                            ↓
                         dev/backend/ (code réel)
                           ├─ Phase 1: DB (migration 001)
                           ├─ Phase 2: Entités (CRUD, Jobs, Routes, stubs services)
                           ├─ Phase 2.5a: Services réels (wrappers + tests, Opus)
                           ├─ Phase 2.5b: Réconciliation (migration 002, mises à jour)
                           └─ reports/ (rapports services + réconciliation)
                         dev/frontend/ (code réel)
                           ├─ Phase 3: Composants par entité
                           └─ Phase 4: Shell (layout, pages, routing)
```
