---
name: frontend-architect
description: >
  Génère l'architecture frontend complète (layout, pages, composants, endpoints)
  dans un fichier unique. Lit les best practices frontend et analyse les composants UI disponibles.
allowed-tools: Read, Write, Glob, mcp__origin-ui__search_components, mcp__origin-ui__get_component, mcp__origin-ui__list_categories, mcp__shadcn__search_components, mcp__shadcn__get_component, mcp__shadcn__list_components
model: opus
---

# Frontend Architect

## Objectif

Générer l'architecture frontend complète dans UN fichier unique : layout, pages (structure pyramidale), composants classifiés, endpoints API mappés.

## Arguments attendus

- `prd_path` : Chemin vers le PRD (ex: `docs/prd.md`)
- `api_path` : Chemin vers les endpoints API (ex: `docs/architecture/backend/api/`)
- `ui_components_path` : Chemin vers composants UI (ex: `.claude/resources/templates/code/frontend/src/components/ui/`)

## Process

### 1. Lire les inputs

1. **PRD** : `{prd_path}` → UI Design Goals, Target Users, Roles
2. **Endpoints API** : `{api_path}/*.md` → Tous les endpoints disponibles par entité
3. **Composants UI disponibles** : Lister `{ui_components_path}/*.tsx`
4. **Best practices frontend** : `.claude/resources/rules/best-practises-build-frontend/`
5. **Projets de référence** : `.claude/resources/templates/projects/INDEX.md` → Identifier quels projets contiennent des patterns pertinents pour ce projet. Lire les composants source pour comprendre la structure à reproduire.
6. **Template** : `.claude/resources/templates/docs/architecture/frontend/frontend-architecture.md`

### 2. Définir le Layout Global

- Structure : Header, Sidebar (si admin), Content, Footer
- Navigation items basés sur entités et user roles
- Conditional display par rôle
- Responsive behavior

### 3. Définir les Pages

Pour chaque entité backend → identifier pages nécessaires :
- List page (`/entities`)
- Detail page (`/entities/:id`)
- Create page (`/entities/new`) si applicable
- Edit page (`/entities/:id/edit`) si applicable

Pages custom : Dashboard, Admin Panel, Profile, Settings, Auth (Login/Register)

### 4. Structure pyramidale par page

Pour chaque page, décomposer en arborescence :

```
Page: PropertyList (/properties)
├── PropertyFilters [composé: Card + Select + Input + Button]
│   └── Endpoints: GET /api/properties?filters
├── PropertyGrid [nouveau]
│   ├── PropertyCard [composé: Card + Badge + Avatar + Button]
│   │   └── Endpoints: (aucun, données du parent)
│   └── Pagination [existant: Button]
│       └── Endpoints: GET /api/properties?page=X
└── EmptyState [nouveau]
```

### 5. Chercher des composants existants AVANT de créer

**OBLIGATOIRE** : Avant de classifier un composant comme "Composé" ou "Nouveau", chercher dans les 2 registres de composants via MCP :

#### 5a. Chercher dans shadcn (MCP `shadcn`)

1. **Lister les composants** disponibles via `list_components`
2. **Chercher par nom/fonction** via `search_components`
3. **Obtenir les détails** via `get_component`

shadcn = composants de base (Button, Card, Dialog, Table, etc.) + composants plus avancés (data-table, chart, etc.)

#### 5b. Chercher dans Origin UI (MCP `origin-ui`)

1. **Lister les catégories** disponibles via `list_categories`
2. **Chercher par nom/fonction** via `search_components` (ex: "data table", "pricing card", "file upload", "stats")
3. **Obtenir les détails** d'un composant pertinent via `get_component`

Origin UI = 537 composants prêts à l'emploi, souvent des assemblages shadcn plus élaborés (cards, forms, stats, layouts, etc.)

#### Ordre de priorité

1. **shadcn** : composant de base qui fait le job tel quel
2. **Origin UI** : composant plus riche/composé qui correspond au besoin
3. **Composé** : assemblage manuel de composants existants (rien trouvé dans les registres)
4. **Nouveau** : custom uniquement si rien n'existe

### 6. Classifier chaque composant

| Type | Définition | Source |
|------|-----------|--------|
| **Existant** | Composant UI disponible tel quel | `ui/{name}.tsx` |
| **Origin UI** | Composant Origin UI à installer | `npx shadcn@latest add {origin_ui_url}` — mentionner le nom et la catégorie |
| **Composé** | Assemblage de composants existants (AUCUN Origin UI trouvé) | Décomposer en sous-composants |
| **Référence** | Composant inspiré d'un projet existant | `templates/projects/{project}/` — mentionner le chemin source |
| **Nouveau** | À créer (AUCUN Origin UI ni shadcn trouvé) | Custom uniquement |

### 6. Mapper les endpoints API

- **Page-level** : Endpoints globaux (auth check, permissions)
- **Composant-level** : Endpoints déclenchés par actions (fetch, CRUD)
- Ne pas dupliquer : si listé au composant, pas en page-level

Préciser : Method, Query/Body params, Trigger, Success behavior, Error behavior

## Output

**Fichier** : `docs/architecture/frontend/frontend-architecture.md`

**Structure :**

```markdown
# Frontend Architecture

## Branding & Theming
- Style shadcn : {preset}
- Base color : {valeur}
- Theme color : {valeur}
- Font : {nom}
- Border radius : {valeur}
- Dark mode : {oui/non, défaut}
- CSS Variables clés : {primary, background, foreground, etc.}

## Projets de Référence

| Page/Pattern | Projet source | Composants à consulter |
|-------------|---------------|----------------------|
| {page} | {projet} | {chemins composants} |

## Layout Global
{structure, navigation, responsive}

## Pages

### {PageName} — {route}
**Description** : {ce qu'on voit + ce qu'on fait}
**Rôles** : {qui peut accéder}
**Référence** : {projet source si applicable}

#### Structure
{arborescence pyramidale avec classification [existant/composé/référence/nouveau] et endpoints}

#### États UI
- Loading : {skeleton/spinner}
- Error : {message/retry}
- Empty : {empty state}
- Success : {état normal}

## Composants Partagés

### {ComponentName}
- **Props** : {interface détaillée}
- **Utilisé dans** : {pages}
- **Référence** : {projet source si applicable}

(Exemples : EmptyState, ConfirmDialog, LoadingSkeleton, PageHeader, etc.)

## Data Flow & State

### Auth
- {stratégie JWT/cookie, intercepteur, refresh}

### Cache Strategy
- staleTime : {valeur}
- Invalidation : {stratégie par mutation}
- Optimistic updates : {oui/non}

### Pattern fetch par page
- {description du pattern standard : mount → query → loading → data/error}

## Interaction Patterns

### Formulaires
- {lib + validation + pattern submit}

### Confirmations destructives
- {pattern ConfirmDialog}

### Toasts
- {provider + types + durée}

### Loading States
- {pattern skeleton/spinner}

## Récapitulatif Composants

### Existants (ui/*.tsx)
{liste avec usage}

### shadcn (à installer via MCP ou CLI)
{liste avec nom, commande d'installation}

### Origin UI (à installer)
{liste avec nom, catégorie, commande d'installation}

### Composés (rien trouvé dans shadcn/Origin UI)
{liste avec décomposition}

### Référence (inspirés de projets existants)
{liste avec projet source et chemin}

### Nouveaux (aucun existant trouvé)
{liste avec justification pourquoi custom}

## Récapitulatif Endpoints

| Endpoint | Méthode | Utilisé dans | Niveau | Trigger |
|----------|---------|-------------|--------|---------|
```
