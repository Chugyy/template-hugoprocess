---
name: greenfield-prd
description: >
  Brainstorming conversationnel + PRD complet. 2 checkpoints humains :
  brainstorming (crescendo de questions) et PRD (overview non-technique).
  Stories, UI tree et brief produits silencieusement.
allowed-tools: Read, Write
model: opus
user-invocable: true
disable-model-invocation: false
---

# De l'idée au PRD

2 checkpoints humains. Le reste est silencieux — les documents sont produits pour le LLM, l'humain interagit via des overviews non-techniques.

---

## CHECKPOINT 1 — Brainstorming conversationnel

**Objectif** : Comprendre l'intention de l'utilisateur en profondeur via une conversation crescendo.
**Output** : `docs/brainstorming.md`
**Template** : `.claude/resources/templates/docs/bmad/brainstorming-output-tmpl.yaml`

### Approche

Conversation naturelle, pas un formulaire. Monter crescendo :

**Niveau 1 — Vision** (questions ouvertes)
- "C'est quoi le projet en une phrase ?"
- "C'est pour qui ?"
- "Quel problème ça résout ?"

**Niveau 2 — Cadrage** (questions de plus en plus précises)
- "Qu'est-ce qui existe déjà comme solution ?"
- "C'est quoi le truc que ton app fait que personne d'autre fait ?"
- "Si tu devais montrer UNE seule fonctionnalité à quelqu'un, ce serait laquelle ?"

**Niveau 3 — Limites** (challenge)
- "Qu'est-ce qui est absolument PAS dans le MVP ?"
- "Quelles contraintes techniques ? (budget, temps, stack imposée)"
- "Il y a des utilisateurs avec des rôles différents ?"

**Niveau 4 — Détails critiques** (précision)
- Questions spécifiques au domaine détecté
- Challenge les incohérences ("tu dis X mais ça implique Y, tu confirmes ?")
- Approfondir les features mentionnées en passant

### Techniques appliquées silencieusement

Le LLM utilise SCAMPER, 5 Whys, First Principles en interne pour structurer sa compréhension. Il ne les mentionne PAS à l'utilisateur.

### Validation

Quand le LLM estime avoir assez de matière :
- Présenter un **résumé structuré** en langage humain :
  - "Ton app c'est {résumé}. Elle permet à {users} de {action principale}."
  - "Le MVP inclut : {liste courte}"
  - "Ce qu'on garde pour plus tard : {liste courte}"
- L'utilisateur valide ou ajuste
- Écrire `docs/brainstorming.md`

---

## Phase silencieuse — Brief + Stories + UI Tree

**Objectif** : Produire les documents intermédiaires sans validation individuelle.

Le LLM enchaîne ces 3 phases automatiquement après validation du brainstorming.

### Brief (`docs/brief.md`)

**Template** : `.claude/resources/templates/docs/bmad/project-brief-tmpl.yaml`

Remplir les 10 sections depuis le brainstorming :
1. Executive Summary
2. Problem Statement
3. Proposed Solution
4. Target Users
5. Goals & Metrics
6. MVP Scope
7. Post-MVP Vision
8. Technical Considerations
9. Constraints & Assumptions
10. Risks & Open Questions

### User Stories (intégrées dans le PRD)

Organiser par **parcours utilisateur complet** (pas par feature) :
- Chaque rôle a son bloc
- Numérotation séquentielle au sein de chaque parcours
- Format : "{Rôle} fait {action} → {résultat visible}"
- Ordre chronologique réel
- Couvrir cas nominaux + transitions

### UI Tree (intégré dans le PRD)

Arborescence complète de l'interface :
```
App
├── /route
│   ├── Section
│   │   ├── Élément (description du contenu)
│   │   └── Action → Modale/Navigation
│   │       ├── Contenu de la modale (champs, boutons)
│   │       └── Résultat de l'action
```

Chaque élément interactif indique ce qu'il déclenche. Chaque modale liste ses champs et boutons. Assez détaillé pour qu'un développeur construise chaque page.

---

## CHECKPOINT 2 — PRD overview

**Objectif** : Présenter le PRD de manière non-technique pour validation finale.
**Output** : `docs/prd.md`, `docs/for-later.md`
**Template PRD** : `.claude/resources/templates/docs/bmad/prd-tmpl.yaml`
**Template for-later** : `.claude/resources/templates/docs/for-later.md`

### Le document PRD (complet, technique)

Contient toutes les sections habituelles :
1. Goals & Background
2. User Stories (depuis phase silencieuse)
3. UI Tree (depuis phase silencieuse)
4. Functional Requirements (FR1-FRN) — numérotés, testables, assignés, priorisés, traçables
5. Non-Functional Requirements (NFR1-NFRN)
6. User Interface Design Goals

### La présentation à l'utilisateur (non-technique)

**Ne PAS présenter le doc brut.** Présenter un overview :

> "Ton app permet à {users} de {actions principales}."
>
> **Ce qu'elle fait (MVP) :**
> - {Feature 1} — {description en 1 ligne}
> - {Feature 2} — {description en 1 ligne}
> - ...
>
> **Les rôles :**
> - {Role 1} : peut {actions résumées}
> - {Role 2} : peut {actions résumées}
>
> **Les pages principales :**
> - {Page 1} : {ce qu'on y fait}
> - {Page 2} : {ce qu'on y fait}
>
> **Ce qu'on garde pour plus tard :**
> - {Item 1}, {Item 2}, ...
>
> "Le PRD détaillé est dans `docs/prd.md` si tu veux checker. Sinon, on continue ?"

**L'utilisateur** : "OK" ou feedbacks → ajuster → écrire `docs/prd.md` + `docs/for-later.md`

### For Later (automatique)

Collecter tous les éléments post-MVP identifiés :
- Brainstorming : Future Innovations + Moonshots
- Brief : Post-MVP Vision + Nice-to-have
- Stories : hors scope POC
- UI Tree : placeholders
- PRD : FR Should-have / Nice-to-have

---

## Fin du workflow

```
Livrables :
- docs/brainstorming.md
- docs/brief.md
- docs/prd.md (inclut User Stories + UI Tree + FR/NFR)
- docs/for-later.md (post-MVP)

Next Step : /greenfield-jobs
  → Définit les jobs de l'application et les choix de services
```
