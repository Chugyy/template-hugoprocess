---
name: greenfield-architecture
description: >
  Architecture complète (backend + frontend) depuis le PRD.
  Approche Jobs-First. 4 agents autonomes auto-validants.
  2 checkpoints humains uniquement.
allowed-tools: Read, Write, Agent, Task, Glob
model: opus
user-invocable: true
disable-model-invocation: true
---

# Du PRD à l'architecture complète

2 phases autonomes backend, 1 phase interactive frontend, 3 checkpoints humains. Les agents lisent les best practices AVANT de générer et s'auto-vérifient.

## Prérequis

→ Lire `docs/prd.md` — Si absent, STOP et recommander `/greenfield-prd`
→ Lire `docs/to-resarch.md` — Si absent, RECOMMANDER `/greenfield-research` (optionnel mais fortement conseillé)
→ Extraire tous les Functional Requirements (FR1-FRN)
→ Si to-resarch.md existe : extraire les impacts architecture par service (tables DB, formats I/O, config)

---

## PHASE AUTONOME 1 — Logique métier

### 1.1 Entités + FR Mapping (action directe, pas d'agent)

**Input** : `docs/prd.md`
**Template entités** : `.claude/resources/templates/docs/architecture/backend/entities/entities.md`
**Template mapping** : `.claude/resources/templates/docs/architecture/backend/entities/fr-mapping.md`

**Process** :
1. Analyser tous les FR → identifier les entités métier (User, Property, Booking...)
2. Regrouper FR par entité
3. Pour chaque FR, déterminer : Type (Job/CRUD/Utils/Service), fonction principale, dépendances
4. Vérifier couverture : 100% des FR doivent être mappés

**Output** :
- `docs/architecture/backend/entities.md`
- `docs/architecture/backend/fr-mapping.md`

### 1.2 Business Logic (parallèle, 1 agent par entité)

**Agent** : `detail-business-logic-entity` (×N entités)
**Input** : `docs/architecture/backend/fr-mapping.md` (section de l'entité) + `docs/to-resarch.md` (si existe — pour les vrais formats I/O des services externes)
**Contexte agent** : `.claude/resources/rules/best-practises-business-logic/`
**Template** : `.claude/resources/templates/docs/architecture/backend/business-logic/business-logic-entity.md`
**Output** : `docs/architecture/backend/business-logic/{entity}.md`

Lancer N agents en parallèle via Task tool :
```
Pour chaque entité dans entities.md :
  Agent(detail-business-logic-entity, prompt="Entité: {entity}, fr_mapping_path: docs/architecture/backend/fr-mapping.md")
```

### 1.3 Auto-vérification mapping ↔ business logic (action directe)

**Process** :
1. Pour chaque fonction dans fr-mapping.md → vérifier présence dans business-logic/{entity}.md
2. Auto-fix : typos, déplacements entre entités, noms légèrement différents
3. Si fonction complètement absente → noter dans le rapport
4. Vérifier couverture FR : chaque FR doit avoir au moins une fonction

---

## 🛑 CHECKPOINT #1 — Validation logique métier

**Présenter à l'utilisateur** :
- Résumé : X entités, Y fonctions (Z Jobs, W CRUD, V Services, U Utils)
- Couverture FR : X/X FR couverts
- Auto-corrections appliquées (si any)
- Erreurs bloquantes (si any)

**Si 0 erreur bloquante et 100% FR couverts** → proposer de continuer en autonome
**Utilisateur** : "OK" ou feedbacks ciblés → appliquer et re-vérifier

---

## PHASE AUTONOME 2 — Architecture technique

### 2.1 Database Schema (1 agent)

**Agent** : `schema-architect`
**Input** : Tous les fichiers `docs/architecture/backend/business-logic/*.md` + `docs/to-resarch.md` (sections "Impact architecture" par service — tables/colonnes requises par les services externes)
**Contexte agent** : `.claude/resources/rules/best-practises-build-databases/` (TOUS les fichiers)
**Template** : `.claude/resources/templates/docs/architecture/backend/database/`
**Output** : `docs/architecture/backend/schema.md`

L'agent lit TOUTES les best practices DB AVANT de générer. Il produit directement un schema conforme (pas de cycle draft → validation → finalisation). Il s'auto-vérifie : cohérence CRUD ↔ tables, types, FK, indexes.

```
Agent(schema-architect, prompt="business_logic_path: docs/architecture/backend/business-logic/")
```

### 2.2 API Endpoints (parallèle, 1 agent par entité)

**Agent** : `api-architect` (×N entités)
**Input** : `docs/architecture/backend/business-logic/{entity}.md` + `docs/architecture/backend/schema.md`
**Contexte agent** : `.claude/resources/rules/best-practises-build-api/` (TOUS les fichiers)
**Template** : `.claude/resources/templates/docs/architecture/backend/api/api-entity.md`
**Output** : `docs/architecture/backend/api/{entity}.md`

L'agent lit TOUTES les best practices API AVANT de générer. Il produit directement des endpoints conformes. Il s'auto-vérifie : cohérence API ↔ DB ↔ business logic.

```
Pour chaque entité :
  Agent(api-architect, prompt="entity: {entity}, architecture_path: docs/architecture/backend")
```

---

## 🛑 CHECKPOINT #2 — Validation backend + Discussion frontend

### 2a. Présentation backend

**Présenter à l'utilisateur** :
- **Schema** : X tables, Y relations, Z indexes
- **API** : X endpoints par entité (tableau récapitulatif)
- **Rapport auto-vérification** : conformité best practices, cohérence cross-documents

**Utilisateur** : "OK" sur le backend ou feedbacks ciblés → appliquer et re-vérifier

### 2b. Discussion frontend (INTERACTIF)

**Objectif** : Co-construire la vision frontend avec l'utilisateur AVANT de générer le doc.

**L'orchestrateur (Opus) mène la discussion directement** — pas de délégation à un sous-agent pour cette phase interactive.

**Étape 1 — Proposition initiale**

Depuis le PRD + les endpoints API générés, proposer :
1. **Pages identifiées** : liste des pages avec route et description 1 ligne
2. **Pattern suggéré par page** : en consultant `.claude/resources/templates/projects/INDEX.md`, proposer quel projet de référence utiliser pour chaque page (ex: "Dashboard → inspiré de `dashboard-crm`", "Onboarding → inspiré de `form-onboarding`")
3. **Layout global** : structure (sidebar ? tabs ? split ?) avec justification

Demander à l'utilisateur : **"Voici ce que je vois. Comment tu imagines le frontend ? Qu'est-ce que tu changerais ?"**

**Étape 2 — Branding & Theming**

Poser les questions de branding :
1. **Style shadcn** : Vega (classic) / Nova (compact) / Maia (soft, arrondi) / Lyra (boxy, sharp) / Mira (dense, data-heavy) — proposer celui qui correspond le mieux au projet
2. **Couleur principale** : proposer basé sur le contexte du projet ou demander
3. **Base color** : neutral / stone / zinc / mauve / olive
4. **Font** : proposer basé sur le style (ex: Inter pour clean, Figtree pour friendly)
5. **Border radius** : petit (sharp) / moyen / grand (arrondi)
6. **Dark mode** : oui/non, lequel par défaut

Si l'utilisateur a un site/branding existant → proposer d'extraire les couleurs.

**Étape 3 — Itération**

L'utilisateur décrit sa vision, corrige, ajoute. L'orchestrateur :
- Challenge les choix si incohérents (ex: "tu veux un kanban mais tu n'as qu'un seul statut")
- Propose des alternatives basées sur les projets de référence
- Affine page par page si l'utilisateur le souhaite

**Étape 4 — Validation du brief frontend**

Quand l'utilisateur dit "OK" ou "go", résumer les décisions :

```markdown
Brief frontend validé :
- Layout : {type}
- Pages : {liste avec pattern de référence}
- Branding : {style, couleurs, font, radius}
- Patterns clés : {données, interactions, composants partagés}
- Projets de référence : {liste avec chemins}
```

**L'utilisateur confirme → passer à la Phase 3.**

---

## PHASE AUTONOME 3 — Architecture frontend

### 3.1 Frontend Architecture (1 agent Opus)

**Agent** : `frontend-architect` (Opus)
**Input** :
- `docs/prd.md`
- `docs/architecture/backend/api/*.md`
- Brief frontend validé (checkpoint 2b ci-dessus)
**Contexte agent** :
- `.claude/resources/rules/best-practises-build-frontend/` (TOUS les fichiers)
- `.claude/resources/templates/projects/INDEX.md` + code source des projets de référence identifiés
- `.claude/resources/templates/code/frontend/src/components/ui/`
**Output** : `docs/architecture/frontend/frontend-architecture.md`

Le doc produit DOIT contenir les sections suivantes :

1. **Branding & Theming** — Style shadcn, couleurs (CSS variables), font, radius, dark mode
2. **Layout Global** — Structure, navigation, responsive
3. **Pages** — Structure pyramidale par page avec classification composants (existant/composé/référence/nouveau)
4. **Projets de référence** — Tableau mapping page → projet source → composants à consulter
5. **Composants partagés** — EmptyState, ConfirmDialog, LoadingSkeleton, etc. avec props définies
6. **Data Flow & State** — Auth, cache strategy (staleTime, invalidation), pattern fetch
7. **Interaction Patterns** — Formulaires, confirmations, toasts, loading states
8. **Récapitulatif Endpoints** — Tableau complet
9. **Récapitulatif Composants** — Par type (existant, composé, référence, nouveau)

```
Agent(frontend-architect, prompt="prd_path: docs/prd.md, api_path: docs/architecture/backend/api/, ui_components_path: .claude/resources/templates/code/frontend/src/components/ui/, frontend_brief: {résumé des décisions du checkpoint 2b}")
```

---

## 🛑 CHECKPOINT #3 — Validation architecture complète

**Présenter à l'utilisateur** :

### Frontend
- **Branding** : style + couleurs + font
- **Pages** : X pages identifiées (avec patterns de référence)
- **Composants** : Y existants, Z composés, W référence, V nouveaux
- **Composants partagés** : X définis
- **Endpoints utilisés** : X endpoints API

**Utilisateur** : "OK" ou feedbacks ciblés → appliquer et re-vérifier

---

## Fin du workflow

```
Livrables :
- docs/architecture/backend/entities.md
- docs/architecture/backend/fr-mapping.md
- docs/architecture/backend/business-logic/*.md
- docs/architecture/backend/schema.md
- docs/architecture/backend/api/*.md
- docs/architecture/frontend/frontend-architecture.md

Next Step : /greenfield-build
  → Génère le code réel depuis l'architecture (incluant services réels via agents Opus)
```
