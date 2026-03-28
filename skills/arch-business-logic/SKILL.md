---
name: arch-business-logic
description: >
  Business logic par entite depuis le fr-mapping. 1 agent par entite en parallele.
  Produit markdown + JSON configs (crud, jobs). Auto-verifie la couverture FR.
allowed-tools: Read, Write, Agent, Glob, Grep, Bash
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif.

# Business Logic par entite

Generation silencieuse. Pas de checkpoint humain — la validation se fait au review final (apres tous les skills d'architecture).

## Prerequis

1. Lire `docs/prd.md` — Si absent, STOP, lancer `/greenfield-prd`
2. Lire `docs/architecture/backend/entities.md` — Si absent, STOP, lancer `/greenfield-jobs`
3. Lire `docs/architecture/backend/fr-mapping.md` — Si absent, STOP, lancer `/greenfield-jobs`
4. Lire `docs/research/index.md` — Si absent, c'est OK (pas de services externes)
5. Creer `docs/architecture/configs/` si absent

---

## Phase 1 — Generation (parallele, 1 agent par entite)

**Agent** : `detail-business-logic-entity` (xN entites)
**Input** : `docs/architecture/backend/fr-mapping.md` (section entite) + `docs/research/*.md` (si services externes)
**Contexte agent** : `.claude/resources/rules/best-practises-business-logic/`
**Output markdown** : `docs/architecture/backend/business-logic/{entity}.md`
**Output JSON** : `docs/architecture/configs/crud-{entity}.json` + `docs/architecture/configs/jobs-{entity}.json` (si jobs)

```
Pour chaque entite dans entities.md :
  Agent(detail-business-logic-entity, prompt="Entite: {entity}, fr_mapping_path: docs/architecture/backend/fr-mapping.md, configs_output_path: docs/architecture/configs/. EN PLUS du markdown business-logic, generer le JSON config CRUD dans configs/crud-{entity}.json. Format JSON: voir docstring de .claude/resources/scripts/generators/crud.py. Si l'entite a des jobs, generer aussi configs/jobs-{entity}.json (format: voir docstring de .claude/resources/scripts/generators/jobs.py).")
```

---

## Phase 2 — Auto-verification mapping <> business logic

1. Pour chaque fonction dans fr-mapping.md, verifier presence dans business-logic/{entity}.md
2. Auto-fix : typos, deplacements entre entites
3. Verifier couverture FR : chaque FR doit avoir au moins une fonction
4. Si erreur bloquante, noter mais continuer

---

## Output

```
Livrables :
- docs/architecture/backend/business-logic/*.md (1 par entite)
- docs/architecture/configs/crud-*.json (1 par entite)
- docs/architecture/configs/jobs-*.json (si jobs, 1 par entite)

Next Step : /arch-schema
```
