---
name: greenfield-prd
description: >
  Workflow complet de définition projet : brainstorming structuré → project brief → user stories
  → UI tree → PRD avec requirements testables (FR/NFR). 5 phases interactives séquentielles.
allowed-tools: Read, Write
model: opus
user-invocable: true
disable-model-invocation: false
---

# De l'idée au PRD

Workflow interactif en 5 phases. Chaque phase produit un document qui nourrit la suivante.
L'utilisateur valide chaque phase avant de passer à la suivante.

---

## Phase 1 — Brainstorming

**Objectif** : Générer les insights nécessaires au projet via une session structurée.
**Output** : `docs/brainstorming.md`
**Template** : `.claude/resources/templates/docs/bmad/brainstorming-output-tmpl.yaml`

### Étapes

1. **Contexte Produit** — Poser 5 questions clés :
   - Quel problème à résoudre ?
   - Pour qui ? (utilisateurs cibles, personas)
   - Quelles contraintes ? (temps, budget, technique)
   - Quel MVP idéal ? (must-have vs nice-to-have)
   - Type d'exploration ? (large vs focalisé)

2. **Génération d'Idées** — Appliquer 2-3 techniques au choix :
   - **SCAMPER** : Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
   - **5 Whys** : Creuser la root cause
   - **Mind Mapping** : Connexions et structure
   - **What If** : Scénarios exploratoires
   - **First Principles** : Déconstruction et reconstruction

3. **Convergence** — Organiser en 4 catégories :
   - Immediate Opportunities (MVP)
   - Future Innovations (Post-MVP)
   - Moonshots (Vision long terme)
   - Insights & Learnings

4. **Priorisation** — Top 3 priorities avec rationale, next steps, resources, timeline

**Principes** : Facilitateur (pas générateur), divergence puis convergence, pas de jugement pendant la génération.

**Validation** : Présenter le brainstorming → Utilisateur dit "OK" ou ajuste → Écrire `docs/brainstorming.md`

---

## Phase 2 — Project Brief

**Objectif** : Créer un brief structuré depuis le brainstorming.
**Input** : `docs/brainstorming.md` (optionnel, utiliser si disponible)
**Output** : `docs/brief.md`
**Template** : `.claude/resources/templates/docs/bmad/project-brief-tmpl.yaml`

### Sections à compléter (interactif)

Pour chaque section, poser des questions ciblées, proposer un draft, valider avec l'utilisateur.

1. **Executive Summary** — 2-3 phrases résumant le projet
2. **Problem Statement** — Problème, impact, solution actuelle
3. **Proposed Solution** — Description de la solution
4. **Target Users** — Personas, rôles, besoins
5. **Goals & Metrics** — Objectifs mesurables, KPIs
6. **MVP Scope** — Core features (must-have) vs nice-to-have
7. **Post-MVP Vision** — Phase 2-3, moonshots
8. **Technical Considerations** — Stack, contraintes techniques
9. **Constraints & Assumptions** — Budget, temps, hypothèses
10. **Risks & Open Questions** — Risques identifiés, questions ouvertes

### Mapping depuis brainstorming

| Brainstorming Section | Brief Section |
|----------------------|---------------|
| Top 3 Priorities | MVP Scope |
| Immediate Opportunities | MVP Scope (Must-have) |
| Future Innovations + Moonshots | Post-MVP Vision |
| Insights & Learnings | Problem Statement |
| Contexte (utilisateurs) | Target Users |
| Contexte (contraintes) | Constraints & Assumptions |

**Validation** : Présenter le brief complet → Utilisateur dit "OK" ou ajuste → Écrire `docs/brief.md`

---

## Phase 3 — User Stories

**Objectif** : Décrire les parcours complets de chaque rôle, étape par étape, pour couvrir 100% des interactions de l'interface.
**Input** : `docs/brief.md` (obligatoire — si absent, STOP et recommander Phase 2)
**Output** : Intégré dans `docs/prd.md` (section "User Stories")

### Structure

Organiser les stories par **parcours utilisateur complet** (pas par feature isolée). Chaque rôle a son bloc :

1. **Parcours Admin** — Setup initial, onboarding d'un client, suivi quotidien, gestion contenu
2. **Parcours Coach** — Première connexion, prise en charge client, accompagnement quotidien, reprise d'un client réassigné
3. **Parcours Client** — Onboarding, utilisation quotidienne, avancement dans le parcours

### Règles de rédaction

- Chaque story est numérotée séquentiellement (1, 2, 3...) au sein de son parcours
- Formuler en action concrète : "{Rôle} fait {action} → {résultat visible}"
- Suivre l'ordre chronologique réel (ce que l'utilisateur fait en premier, puis en deuxième, etc.)
- Couvrir les cas nominaux ET les cas de transition (ex: réassignation de coach, désactivation)
- Chaque story doit impliquer un élément d'interface identifiable (page, bouton, modale, vue)

**Validation** : Présenter les stories → Utilisateur valide la couverture → Conserver pour intégration dans le PRD

---

## Phase 4 — UI Tree (Arborescence Interface)

**Objectif** : Cartographier l'intégralité de l'interface sous forme d'arborescence hiérarchique : pages → sections → vues → boutons → modales → contenu.
**Input** : User Stories (Phase 3) + `docs/brief.md`
**Output** : Intégré dans `docs/prd.md` (section "UI Tree")

### Structure

```
App
├── /route
│   ├── Section
│   │   ├── Élément (description du contenu)
│   │   └── Action → Modale/Navigation
│   │       ├── Contenu de la modale (champs, boutons)
│   │       └── Résultat de l'action
```

### Règles

- **Une entrée par page/route** avec toutes ses sections imbriquées
- Chaque élément interactif (bouton, lien, filtre) doit indiquer **ce qu'il déclenche** (modale, navigation, action)
- Chaque modale doit lister ses **champs, boutons et comportements**
- Chaque tableau/liste doit lister ses **colonnes/champs visibles et actions par ligne**
- Organiser par espace utilisateur (layout global → espace client → espace coach → espace admin)
- Préciser les éléments **hors scope POC** directement dans l'arbre (ex: "placeholder, non fonctionnel")
- L'arbre doit être suffisamment détaillé pour qu'un développeur frontend puisse construire chaque page sans ambiguïté

**Validation** : Présenter l'arbre → Utilisateur valide la couverture → Conserver pour intégration dans le PRD

---

## Phase 5 — PRD (Product Requirements Document)

**Objectif** : Transformer le brief, les user stories et l'UI tree en PRD complet avec requirements numérotés et testables.
**Input** : `docs/brief.md` + User Stories (Phase 3) + UI Tree (Phase 4)
**Output** : `docs/prd.md`
**Template** : `.claude/resources/templates/docs/bmad/prd-tmpl.yaml`

### Sections

1. **Goals & Background** — Contexte et objectifs (depuis brief)

2. **User Stories** — Parcours complets par rôle (depuis Phase 3)

3. **UI Tree** — Arborescence complète de l'interface (depuis Phase 4)

4. **Functional Requirements (FR1-FRN)** — Chaque FR doit être :
   - Numéroté (FR1, FR2, ...)
   - Testable (critère de validation clair)
   - Assigné à une entité métier (User, Property, Booking...)
   - Priorisé (Must-have / Should-have / Nice-to-have)
   - Traçable vers une ou plusieurs user stories

5. **Non-Functional Requirements (NFR1-NFRN)** — Performance, sécurité, scalabilité

6. **User Interface Design Goals** — Principes UI/UX, responsive, accessibilité

### Règles de rédaction FR

- Un FR = une action utilisateur (ex: "L'utilisateur peut créer une propriété")
- Pas de termes vagues ("rapidement", "facilement")
- Inclure le rôle (User, Admin, Guest)
- Inclure les critères de validation
- Référencer les user stories couvertes (ex: "Stories 18-21")

**Validation** : Présenter le PRD → Utilisateur valide les FR/NFR → Écrire `docs/prd.md`

---

## Phase 6 — For Later (automatique)

**Objectif** : Déverser les éléments post-MVP identifiés pendant les phases 1-5 dans `docs/for-later.md`.
**Template** : `.claude/resources/templates/docs/for-later.md`
**Output** : `docs/for-later.md`

### Sources automatiques

| Source | Éléments à extraire |
|--------|-------------------|
| Phase 1 (Brainstorming) | Future Innovations + Moonshots |
| Phase 2 (Brief) | Post-MVP Vision + Nice-to-have |
| Phase 3 (User Stories) | Stories identifiées comme hors scope POC |
| Phase 4 (UI Tree) | Éléments marqués "placeholder" ou "non fonctionnel dans le POC" |
| Phase 5 (PRD) | FR marqués Should-have / Nice-to-have (hors MVP) |

### Process

1. Collecter tous les éléments identifiés comme post-MVP pendant les 5 phases
2. Pour chaque élément, rédiger selon le template : nom, description, pourquoi reporté, dépendances, priorité
3. Si `docs/for-later.md` existe déjà → ajouter les nouveaux éléments sans supprimer les existants
4. Si n'existe pas → créer depuis le template

**Pas de validation nécessaire** — cette phase est automatique après validation du PRD.

---

## Fin du workflow

```
Livrables :
- docs/prd.md (inclut User Stories + UI Tree + FR/NFR)
- docs/for-later.md (post-MVP, peuplé automatiquement)

Next Step : /greenfield-research
  → Identifie et documente toutes les dépendances externes avant l'architecture
```
