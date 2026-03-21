---
name: greenfield-reference
description: >
  Index des best practices, conventions, templates et règles du projet.
  Consulter quand un agent a besoin de règles métier, techniques ou de templates.
user-invocable: false
disable-model-invocation: false
---

# Référence — Index des ressources

Ce skill est un annuaire. Il ne contient aucune connaissance directe, uniquement des pointeurs vers les fichiers de référence. Charge ce skill pour savoir OÙ trouver l'information, puis lis le fichier spécifique dont tu as besoin.

---

## Best Practices

### API REST (FastAPI + Pydantic)
→ `.claude/resources/rules/best-practises-build-api/`
- `index.md` — Vue d'ensemble
- `00-checklist-api.md` — Checklist de validation complète (6 catégories)
- `checklist-de-validation.md` — Checklist détaillée
- `principes-fondamentaux-rest.md` — Principes REST
- `conception-des-urls-et-endpoints.md` — Nommage URLs, hiérarchie
- `methodes-http-et-codes-de-statut.md` — GET/POST/PUT/DELETE, codes
- `gestion-des-donnees.md` — Pagination, filtres, tri
- `gestion-des-erreurs.md` — Error handling patterns
- `pydantic-models-and-naming-conventions.md` — BaseAPIModel, naming
- `securite.md` — Auth, CORS, rate limiting
- `performance-et-optimisation.md` — Cache, lazy loading
- `versioning.md` — API versioning
- `documentation.md` — OpenAPI, Swagger
- `erreurs-courantes-a-eviter.md` — 15 anti-patterns

### Database (PostgreSQL)
→ `.claude/resources/rules/best-practises-build-databases/`
- `index.md` — Vue d'ensemble
- `phase-de-planification.md` — Planification schema
- `conception-du-schema.md` — Design patterns
- `normalisation-des-donnees.md` — 1NF → 3NF
- `indexation.md` — Stratégie d'indexation
- `operations-crud.md` — Patterns CRUD asyncpg
- `securite.md` — Sécurité DB
- `performance-et-optimisation.md` — Query optimization
- `maintenance-et-documentation.md` — Documentation schema
- `erreurs-courantes-a-eviter.md` — Anti-patterns DB

### Frontend (Next.js + shadcn + Tailwind)
→ `.claude/resources/rules/best-practises-build-frontend/`
- `index.md` — Vue d'ensemble
- `checklist-validation.md` — Checklist frontend
- `design-system-tailwind.md` — Design system
- `colors-and-theming.md` — Couleurs, thème
- `typography-fonts.md` — Typographie
- `drag-and-drop.md` — Patterns drag-and-drop
- `erreurs-courantes.md` — Anti-patterns frontend

### Business Logic (Jobs-First)
→ `.claude/resources/rules/best-practises-business-logic/`
- `index.md` — Vue d'ensemble
- `jobs.md` — Patterns Jobs (orchestration)
- `crud.md` — Patterns CRUD (asyncpg)
- `services.md` — Patterns Services (externes)

### Streaming & Realtime
→ `.claude/resources/rules/best-practises-streaming-realtime/`
- `index.md` — Vue d'ensemble
- `choix-protocole.md` — SSE vs WebSocket vs HTTP/2
- `architecture-sse.md` — Architecture SSE
- `patterns-implementation.md` — Patterns d'implémentation
- `gestion-erreurs.md` — Error handling streaming
- `timeouts-heartbeats.md` — Timeouts, heartbeats
- `http2-scalabilite.md` — HTTP/2 scalabilité
- `tool-calling-patterns.md` — Tool calling patterns

### Architecture Context
→ `.claude/resources/rules/backend-architecture-context.md`
- Couches : API → Jobs → CRUD/Services/Utils → Database
- Approche Jobs-First

---

## Templates

### Documents architecture
→ `.claude/resources/templates/docs/architecture/`
- `backend/entities/` — entities.md, fr-mapping.md
- `backend/business-logic/` — business-logic-entity.md
- `backend/database/` — schema-draft.md, schema.md, schema-validation-report.md
- `backend/api/` — api-draft.md, api-entity.md, api-validation-report.md
- `backend/coherence-reports/` — mapping-business, crud-schema, api-db
- `frontend/` — frontend-architecture.md

### Documents projet
→ `.claude/resources/templates/docs/`
- `bmad/` — brainstorming-output-tmpl.yaml, project-brief-tmpl.yaml, prd-tmpl.yaml
- `guidelines/` — progress.md, changelog-backend.md, changelog-frontend.md

### Code backend (FastAPI)
→ `.claude/resources/templates/code/backend/`
- `app/api/routes/` — Route templates
- `app/api/models/` — Pydantic model templates
- `app/database/crud/` — CRUD asyncpg templates
- `app/database/migrations/` — SQL migration templates
- `app/core/jobs/` — Job templates
- `app/core/services/` — Service templates
- `app/core/utils/` — Utils templates
- `config/` — Configuration templates
- `tests/` — Test templates

### Code frontend (Next.js + shadcn)
→ `.claude/resources/templates/code/frontend/`
- `src/app/` — Pages, layout
- `src/components/ui/` — 22 composants shadcn pré-installés :
  avatar, badge, button, calendar, card, dialog, dropdown-menu,
  form, input, label, scroll-area, select, separator, sheet,
  sidebar, skeleton, sonner, table, tabs, textarea, tooltip
- `src/hooks/` — Hook templates
- `src/lib/` — Utility functions

### Scripts
→ `.claude/resources/scripts/`
- `setup-infrastructure.py` — Bootstrap backend + frontend
