---
name: greenfield-architecture
description: >
  Architecture complète (backend + frontend) depuis le PRD + jobs.
  Génération silencieuse. 1 seul checkpoint : Review Final avec vue jobs,
  branding, layout et mockups HTML optionnels.
allowed-tools: Read, Write, Agent, Task, Glob, Grep, Bash, WebFetch
model: opus
user-invocable: true
disable-model-invocation: true
---

# Du PRD à l'architecture complète

Génération 100% silencieuse. 1 seul checkpoint humain à la fin : le Review Final.
Les documents sont produits pour le LLM. L'humain voit une vue synthétique et peut aller checker les docs s'il veut.

## Prérequis

→ Lire `docs/prd.md` — Si absent, STOP → `/greenfield-prd`
→ Lire `docs/architecture/backend/entities.md` — Si absent, STOP → `/greenfield-jobs`
→ Lire `docs/architecture/backend/fr-mapping.md` — Si absent, STOP → `/greenfield-jobs`
→ Lire `docs/to-resarch.md` — Si absent, c'est OK (pas de services externes)
→ Extraire tous les Functional Requirements (FR1-FRN)
→ Si to-resarch.md existe : extraire les impacts architecture par service

---

## PHASE SILENCIEUSE 1 — Logique métier

### 1.1 Business Logic (parallèle, 1 agent par entité)

**Agent** : `detail-business-logic-entity` (×N entités)
**Input** : `docs/architecture/backend/fr-mapping.md` (section entité) + `docs/to-resarch.md` (si existe)
**Contexte agent** : `.claude/resources/rules/best-practises-business-logic/`
**Template** : `.claude/resources/templates/docs/architecture/backend/business-logic/business-logic-entity.md`
**Output** : `docs/architecture/backend/business-logic/{entity}.md`

```
Pour chaque entité dans entities.md :
  Agent(detail-business-logic-entity, prompt="Entité: {entity}, fr_mapping_path: docs/architecture/backend/fr-mapping.md")
```

### 1.2 Auto-vérification mapping ↔ business logic (action directe)

1. Pour chaque fonction dans fr-mapping.md → vérifier présence dans business-logic/{entity}.md
2. Auto-fix : typos, déplacements entre entités
3. Vérifier couverture FR : chaque FR doit avoir au moins une fonction
4. Si erreur bloquante → noter mais continuer (sera signalée au review final)

---

## PHASE SILENCIEUSE 2 — Architecture technique

### 2.1 Database Schema (1 agent)

**Agent** : `schema-architect`
**Input** : Tous les `docs/architecture/backend/business-logic/*.md` + `docs/to-resarch.md`
**Contexte** : `.claude/resources/rules/best-practises-build-databases/`
**Template** : `.claude/resources/templates/docs/architecture/backend/database/`
**Output** : `docs/architecture/backend/schema.md`

```
Agent(schema-architect, prompt="business_logic_path: docs/architecture/backend/business-logic/")
```

### 2.2 API Endpoints (parallèle, 1 agent par entité)

**Agent** : `api-architect` (×N entités)
**Input** : `docs/architecture/backend/business-logic/{entity}.md` + `docs/architecture/backend/schema.md`
**Contexte** : `.claude/resources/rules/best-practises-build-api/`
**Template** : `.claude/resources/templates/docs/architecture/backend/api/api-entity.md`
**Output** : `docs/architecture/backend/api/{entity}.md`

```
Pour chaque entité :
  Agent(api-architect, prompt="entity: {entity}, architecture_path: docs/architecture/backend")
```

---

## PHASE SILENCIEUSE 3 — Architecture frontend

### 3.1 Frontend Architecture (1 agent Opus)

**Agent** : `frontend-architect` (Opus)
**Input** :
- `docs/prd.md`
- `docs/architecture/backend/api/*.md`
**Contexte** :
- `.claude/resources/rules/best-practises-build-frontend/`
- `.claude/resources/templates/projects/INDEX.md` + code source des projets de référence
- `.claude/resources/templates/code/frontend/src/components/ui/`
**Output** : `docs/architecture/frontend/frontend-architecture.md`

Le doc DOIT contenir :
1. Layout Global — structure, navigation
2. Pages — structure pyramidale, classification composants
3. Projets de référence — mapping page → projet source
4. Composants partagés — EmptyState, ConfirmDialog, LoadingSkeleton, etc.
5. Data Flow & State — auth, cache, fetch patterns
6. Interaction Patterns — formulaires, toasts, loading
7. Récapitulatif Endpoints
8. Récapitulatif Composants

**Note** : le branding et le theming ne sont PAS dans cette phase. Ils seront définis au Review Final avec l'utilisateur.

```
Agent(frontend-architect, prompt="prd_path: docs/prd.md, api_path: docs/architecture/backend/api/, ui_components_path: .claude/resources/templates/code/frontend/src/components/ui/")
```

---

## 🛑 REVIEW FINAL — Le seul checkpoint humain

L'architecture est terminée. Présenter une vue complète à l'utilisateur.

### A. Backend — Vue centrée Jobs

Pour chaque entité, présenter les jobs avec leurs briques rattachées :

```
📦 {Entité}

  ▸ {Job: nom en français}
    Endpoints : POST /api/{entities}, PUT /api/{entities}/{id}/action
    Services  : {service1}, {service2}
    CRUD      : create_{entity}, update_{entity}_status
    Tables    : {table1} (colonnes clés), {table2}

  ▸ {Job: autre nom}
    ...
```

Puis un récapitulatif :
- X entités, Y jobs, Z endpoints, W tables
- Couverture FR : X/X FR couverts
- Erreurs détectées pendant la génération (si any)

**"Le détail est dans `docs/architecture/backend/`. Tu veux checker quelque chose de spécifique ?"**

### B. Branding (si frontend)

**Si pas de frontend** → SKIP B, C, D.

**Étape 1 — Extraction ou proposition**

Demander : "Tu as un site existant, un logo, ou des couleurs en tête ?"

- **Si oui (URL fournie)** → WebFetch sur le site, extraire :
  - Couleurs principales (hex)
  - Police d'écriture
  - Style général (sharp/arrondi, dense/aéré)
  - Proposer le mapping vers shadcn theme

- **Si non** → Proposer 2-3 palettes cohérentes avec le projet :
  - Palette 1 : {nom} — {description} — couleurs
  - Palette 2 : {nom} — {description} — couleurs
  - Palette 3 : {nom} — {description} — couleurs

**Étape 2 — Détails branding**

Poser les questions restantes :
1. **Style shadcn** : Vega (classic) / Nova (compact) / Maia (soft) / Lyra (boxy) / Mira (dense) — proposer celui qui match le mieux
2. **Base color** : neutral / stone / zinc / mauve / olive
3. **Font** : proposer selon le style (Inter pour clean, Figtree pour friendly, etc.)
4. **Border radius** : petit / moyen / grand
5. **Dark mode** : oui/non, lequel par défaut

### C. Layout

Proposer 2-3 options de layout en wireframe texte :

**Option 1 — Sidebar gauche (style SaaS/Dashboard)**
```
┌──────┬─────────────────────────────┐
│ Logo │  Header (search, profile)   │
├──────┤                             │
│ Nav  │                             │
│ item │     Contenu principal       │
│ item │                             │
│ item │                             │
│      │                             │
└──────┴─────────────────────────────┘
```

**Option 2 — Top navbar (style app simple)**
```
┌─────────────────────────────────────┐
│ Logo    Nav items    Search  Profile │
├─────────────────────────────────────┤
│                                     │
│         Contenu principal           │
│                                     │
└─────────────────────────────────────┘
```

**Option 3 — Sidebar collapsible (style app complexe)**
```
┌──┬──────────────────────────────────┐
│≡ │  Header                         │
├──┤                                 │
│📊│     Contenu principal           │
│📝│                                 │
│⚙️│                                 │
└──┴──────────────────────────────────┘
```

L'utilisateur choisit ou décrit autre chose.

### D. Mockups HTML (optionnel)

Demander : **"Je peux te générer des pages HTML de preview pour que tu visualises le résultat. C'est purement indicatif — ni optimisé, ni fonctionnel, juste un aperçu visuel pour mieux communiquer. Tu préfères ça, ou tu visualises déjà bien et on continue ?"**

**Si oui :**

Générer des fichiers HTML statiques dans `docs/mockups/` :
- Tailwind CDN (lien CDN inline)
- Couleurs et polices du branding validé
- Données fake mais réalistes
- 1 fichier par page clé (layout.html, dashboard.html, etc.)

**Agent** : `build-mockups`
**Input** : branding validé + frontend-architecture.md + layout choisi
**Output** : `docs/mockups/*.html`

```
Agent(build-mockups, prompt="frontend_arch_path: docs/architecture/frontend/frontend-architecture.md, mockups_path: docs/mockups, branding: {résumé branding validé}, layout: {layout choisi}")
```

L'utilisateur ouvre dans le navigateur → feedback vocal/texte → agent corrige → refresh.

**Boucle** jusqu'à ce que l'utilisateur dise "c'est bon".

**Si non** → passer directement à la finalisation.

### E. Finalisation

Mettre à jour `docs/architecture/frontend/frontend-architecture.md` avec :
- Section Branding & Theming (couleurs CSS variables, font, radius, dark mode)
- Layout validé

Résumer les décisions :

```
Architecture complète :
- Backend : X entités, Y jobs, Z endpoints, W tables
- Frontend : {layout}, {pages count} pages, branding {style}
- Services : {X réels, Y locaux}
- Docs dans docs/architecture/

Next step : /greenfield-build
```

**L'utilisateur** : "OK" ou feedbacks ciblés → appliquer et re-vérifier.

---

## Fin du workflow

```
Livrables :
- docs/architecture/backend/business-logic/*.md
- docs/architecture/backend/schema.md
- docs/architecture/backend/api/*.md
- docs/architecture/frontend/frontend-architecture.md
- docs/mockups/*.html (si demandé)

Next Step : /greenfield-build
  → Génère le code réel depuis l'architecture
```
