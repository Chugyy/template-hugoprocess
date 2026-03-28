---
name: arch-schema
description: >
  Schema PostgreSQL depuis la business logic. 1 agent schema-architect.
  Produit schema.md + db.json + assembly.json + services.json.
allowed-tools: Read, Write, Agent, Glob, Grep, Bash
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif.

# Schema PostgreSQL

Generation silencieuse. Pas de checkpoint humain.

## Prerequis

1. Lire `docs/architecture/backend/business-logic/*.md` — Si absent, STOP, lancer `/arch-business-logic`
2. Lire `docs/research/index.md` — Si absent, c'est OK
3. Lire `docs/architecture/backend/entities.md` — Pour la liste des entites
4. `docs/architecture/configs/` doit exister

---

## Phase 1 — Database Schema (1 agent)

**Agent** : `schema-architect`
**Input** : Tous les `docs/architecture/backend/business-logic/*.md` + `docs/research/*.md`
**Contexte** : `.claude/resources/rules/best-practises-build-databases/`
**Output markdown** : `docs/architecture/backend/schema.md`
**Output JSON** : `docs/architecture/configs/db.json`

```
Agent(schema-architect, prompt="business_logic_path: docs/architecture/backend/business-logic/, configs_output_path: docs/architecture/configs/. EN PLUS du markdown schema, generer le JSON config DB dans configs/db.json. Format JSON: voir docstring de .claude/resources/scripts/generators/database.py.")
```

---

## Phase 2 — Generation assembly.json + services.json

Apres le schema, l'agent principal genere :

**`docs/architecture/configs/assembly.json`** :
```json
{
  "app_name": "{project_name}",
  "entities": ["{entity1}", "{entity2}"],
  "has_auth": true/false,
  "db_user": "hugohoarau",
  "db_password": "",
  "models_per_entity": {
    "{entity}": ["EntityCreate", "EntityUpdate", "EntityResponse", "EntitiesListResponse"]
  }
}
```

**`docs/architecture/configs/services.json`** (si services externes) :
```json
{
  "services": [
    {
      "name": "email_service",
      "description": "...",
      "config_vars": ["RESEND_API_KEY"],
      "methods": [...],
      "pip_packages": ["resend"]
    }
  ]
}
```

Les noms de models Pydantic se deduisent : `{Entity}Create`, `{Entity}Update`, `{Entity}Response`, `{Entities}ListResponse`.

---

## Output

```
Livrables :
- docs/architecture/backend/schema.md
- docs/architecture/configs/db.json
- docs/architecture/configs/assembly.json
- docs/architecture/configs/services.json (si services externes)

Next Step : /arch-api
```
