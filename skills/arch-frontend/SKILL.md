---
name: arch-frontend
description: >
  Architecture frontend complete depuis le PRD + API docs. Agent Opus.
  Inclut branding, layout, mockups optionnels. Checkpoint humain pour le visuel.
allowed-tools: Read, Write, Agent, Glob, Grep, Bash, WebFetch
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif.

# Architecture Frontend

Inclut un checkpoint humain pour le branding et le layout.

## Prerequis

1. Lire `docs/prd.md` — Si absent, STOP, lancer `/greenfield-prd`
2. Lire `docs/architecture/backend/api/*.md` — Si absent, STOP, lancer `/arch-api`
3. Verifier le scope dans `docs/brainstorming.md` — doit etre `full-stack` ou `frontend-only`

---

## Phase 1 — Frontend Architecture (1 agent Opus)

**Agent** : `frontend-architect` (Opus)
**Input** :
- `docs/prd.md`
- `docs/architecture/backend/api/*.md`
**Contexte** :
- `.claude/resources/rules/best-practises-build-frontend/`
- `.claude/resources/templates/projects/INDEX.md` + code source des projets de reference
- `.claude/resources/templates/code/frontend/src/components/ui/`
**Output** : `docs/architecture/frontend/frontend-architecture.md`

Pas de JSON config pour le frontend — trop de variations, gere par agents au build.

```
Agent(frontend-architect, prompt="prd_path: docs/prd.md, api_path: docs/architecture/backend/api/, ui_components_path: .claude/resources/templates/code/frontend/src/components/ui/")
```

---

## Phase 2 — Branding (checkpoint humain)

**Etape 1** — Demander : "Tu as un site existant, un logo, ou des couleurs en tete ?"
- Si oui (URL) : WebFetch, extraire couleurs/police/style
- Si non : Proposer 2-3 palettes coherentes

**Etape 2** — Details : style shadcn, base color, font, border radius, dark mode

---

## Phase 3 — Layout

Proposer 2-3 options de layout en wireframe texte. L'utilisateur choisit.

---

## Phase 4 — Mockups HTML (optionnel)

Demander si l'utilisateur veut des previews HTML. Si oui :
```
Agent(build-mockups, prompt="frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, mockups_path: docs/mockups, branding: {resume}, layout: {layout}")
```

---

## Phase 5 — Finalisation

Mettre a jour `docs/architecture/frontend/frontend-architecture.md` avec branding + layout.

---

## Output

```
Livrables :
- docs/architecture/frontend/frontend-architecture.md
- docs/mockups/*.html (si demande)

Next Step : /greenfield-build
```
