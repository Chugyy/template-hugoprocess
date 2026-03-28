---
name: arch-api
description: >
  API REST par entite depuis business-logic + schema. 1 agent par entite en parallele.
  Produit markdown api + JSON configs routes.
allowed-tools: Read, Write, Agent, Glob, Grep, Bash
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif.

# API Endpoints par entite

Generation silencieuse. Pas de checkpoint humain.

## Prerequis

1. Lire `docs/architecture/backend/business-logic/*.md` — Si absent, STOP, lancer `/arch-business-logic`
2. Lire `docs/architecture/backend/schema.md` — Si absent, STOP, lancer `/arch-schema`
3. `docs/architecture/configs/` doit exister

---

## Phase 1 — API Endpoints (parallele, 1 agent par entite)

**Agent** : `api-architect` (xN entites)
**Input** : `docs/architecture/backend/business-logic/{entity}.md` + `docs/architecture/backend/schema.md`
**Contexte** : `.claude/resources/rules/best-practises-build-api/`
**Output markdown** : `docs/architecture/backend/api/{entity}.md`
**Output JSON** : `docs/architecture/configs/routes-{entity}.json`

```
Pour chaque entite :
  Agent(api-architect, prompt="entity: {entity}, architecture_path: docs/architecture/backend, configs_output_path: docs/architecture/configs/. EN PLUS du markdown API, generer le JSON config routes dans configs/routes-{entity}.json. Format JSON: voir docstring de .claude/resources/scripts/generators/routes.py.")
```

---

## Output

```
Livrables :
- docs/architecture/backend/api/*.md (1 par entite)
- docs/architecture/configs/routes-*.json (1 par entite)

Next Step : /arch-frontend (si frontend) ou /greenfield-build (si backend-only)
```
