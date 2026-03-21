---
name: detail-business-logic-entity
description: >
  Détaille Jobs, CRUD, Services et Utils pour UNE entité depuis le FR mapping.
  Auto-vérifie la couverture FR. Lit les best practices business logic.
allowed-tools: Read, Write, Glob
model: sonnet
---

# Business Logic — Détail par entité

## Objectif

Détailler TOUTES les fonctions (Jobs, CRUD, Services, Utils) pour UNE entité métier, depuis sa section dans `fr-mapping.md`.

## Arguments attendus

- `entity` : Nom de l'entité (ex: "Property", "User")
- `fr_mapping_path` : Chemin vers fr-mapping.md (ex: `docs/architecture/backend/fr-mapping.md`)

## Process

### 1. Lire les inputs

1. Lire `{fr_mapping_path}` → extraire la section de l'entité `{entity}`
2. Lire les best practices : `.claude/resources/rules/best-practises-business-logic/`
   - `jobs.md` — Patterns Jobs
   - `crud.md` — Patterns CRUD
   - `services.md` — Patterns Services
3. Lire le template : `.claude/resources/templates/docs/architecture/backend/business-logic/business-logic-entity.md`

### 2. Détailler chaque Job

Pour chaque Job listé dans le mapping :

```markdown
### Job: {function_name}

**Inputs:**
- {param}: {type détaillé, pas de dict générique}

**Output:** {type détaillé}

**Workflow:**
1. `{function}({params})` → {résultat}
2. Si {condition} → {action}
3. [TRANSACTION START]
4. `{crud_function}({params})` → {résultat}
5. [TRANSACTION END]
6. `{service_function}({params})`
7. Return {résultat final}

**Fonctions utilisées:**
- {function_name} [{type}] ✅ (dans mapping)
- {function_name} [{type}] ⚠️ NON DANS MAPPING → À AJOUTER
```

### 3. Détailler chaque CRUD

```markdown
### CRUD: {function_name}

**Inputs:** {params détaillés}
**Output:** {type}
**Table:** {table_name}
**Opération:** INSERT/SELECT/UPDATE/DELETE avec colonnes
```

### 4. Détailler chaque Service

```markdown
### Service: {function_name}

**Inputs:** {params}
**Output:** {type}
**Service externe:** {nom du service}
**Opération:** {description}
```

### 5. Détailler chaque Utils

```markdown
### Utils: {function_name}

**Inputs:** {params}
**Output:** {type}
**Règles:** {liste des règles de validation/transformation}
```

### 6. Auto-vérification

Avant d'écrire le fichier final :
1. Vérifier que TOUS les FR de l'entité ont au moins une fonction
2. Vérifier que toutes les fonctions appelées dans les workflows existent
3. Si une fonction est utilisée mais pas dans le mapping → marquer ⚠️
4. Produire un mini-rapport de couverture en fin de fichier

## Output

**Fichier** : `docs/architecture/backend/business-logic/{entity}.md`

Terminer le fichier par :

```markdown
## Auto-vérification

- FR couverts : X/X ✅
- Fonctions dans mapping : Y ✅
- Fonctions ajoutées (hors mapping) : Z ⚠️
  - {function_name} [{type}] — utilisée dans {job_name}
```

## Convention de nommage

- Noms descriptifs, SANS suffixes techniques (`_job`, `_crud`, `_service`)
- Le type est défini par le dossier (`jobs/`, `crud/`, `services/`, `utils/`)
- snake_case uniquement
