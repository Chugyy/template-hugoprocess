---
name: greenfield-prd
description: >
  Brainstorming conversationnel + PRD adaptatif. 2 checkpoints humains :
  brainstorming (crescendo de questions) et PRD (overview non-technique).
  Detecte le scope du projet et ne genere que les sections pertinentes.
allowed-tools: Read, Write
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif (ex: `./tests-note/docs/prd.md`). Le dossier projet est communique par l'utilisateur ou le workflow parent.

# De l'idee au PRD

2 checkpoints humains. Le reste est silencieux — les documents sont produits pour le LLM, l'humain interagit via des overviews non-techniques.

> **REGLE** : Quand le PRD mentionne des services externes (APIs, SDKs) ou des variables d'env, TOUJOURS lister les choix de services et demander validation a l'utilisateur AVANT de finaliser le document.

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
- "Quel probleme ca resout ?"

**Niveau 2 — Cadrage** (questions de plus en plus precises)
- "Qu'est-ce qui existe deja comme solution ?"
- "C'est quoi le truc que ton app fait que personne d'autre fait ?"
- "Si tu devais montrer UNE seule fonctionnalite a quelqu'un, ce serait laquelle ?"

**Niveau 3 — Limites** (challenge)
- "Qu'est-ce qui est absolument PAS dans le MVP ?"
- "Quelles contraintes techniques ? (budget, temps, stack imposee)"
- "Il y a des utilisateurs avec des roles differents ?"

**Niveau 4 — Details critiques** (precision)
- Questions specifiques au domaine detecte
- Challenge les incoherences ("tu dis X mais ca implique Y, tu confirmes ?")
- Approfondir les features mentionnees en passant

### Techniques appliquees silencieusement

Le LLM utilise SCAMPER, 5 Whys, First Principles en interne pour structurer sa comprehension. Il ne les mentionne PAS a l'utilisateur.

### Detection de scope

Pendant le brainstorming, le LLM identifie silencieusement le **scope du projet** :

| Scope | Description | Exemple |
|-------|-------------|---------|
| `full-stack` | App complete (backend + frontend + DB, ou sous-ensemble) | App web, API seule, dashboard |
| `standalone` | Pas d'app — scripts, prompts, docs, outils | Serie de prompts, CLI tool, automation |

Note : le mode **feature** (ajout a un projet existant) ne passe PAS par le PRD. Il a son propre process (voir CLAUDE.md section "Mode Feature").

Le scope `full-stack` s'adapte naturellement : si le projet n'a pas de frontend, le PRD ne generera pas d'UI tree. Si pas de backend, pas de jobs. Le LLM detecte ce qui est pertinent.

### Validation

Quand le LLM estime avoir assez de matiere :
- Presenter un **resume structure** en langage humain :
  - "Ton projet c'est {resume}. Il permet a {users} de {action principale}."
  - "Le MVP inclut : {liste courte}"
  - "Ce qu'on garde pour plus tard : {liste courte}"
  - **"Scope detecte : {scope}"** — l'utilisateur valide ou corrige
- L'utilisateur valide ou ajuste
- Ecrire `docs/brainstorming.md` (inclut le scope detecte)

---

## Phase silencieuse — Brief + Stories + UI Tree (adaptatif)

**Objectif** : Produire les documents intermediaires sans validation individuelle.

Le LLM enchaine ces phases automatiquement apres validation du brainstorming. **Les sections generees dependent du scope detecte.**

### Brief (`docs/brief.md`) — TOUJOURS

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

### User Stories (integrees dans le PRD) — SI scope = full-stack

Organiser par **parcours utilisateur complet** (pas par feature) :
- Chaque role a son bloc
- Numerotation sequentielle au sein de chaque parcours
- Format : "{Role} fait {action} → {resultat visible}"
- Ordre chronologique reel
- Couvrir cas nominaux + transitions

**Si scope = standalone** : remplacer par une section "Livrables" listant les fichiers/outputs attendus avec leur description.

### UI Tree (integre dans le PRD) — SI le projet a un frontend

Genere uniquement si le projet inclut un frontend (detecte pendant le brainstorming).

Arborescence complete de l'interface :
```
App
├── /route
│   ├── Section
│   │   ├── Element (description du contenu)
│   │   └── Action → Modale/Navigation
│   │       ├── Contenu de la modale (champs, boutons)
│   │       └── Resultat de l'action
```

Chaque element interactif indique ce qu'il declenche. Chaque modale liste ses champs et boutons. Assez detaille pour qu'un developpeur construise chaque page.

**Si pas de frontend** : remplacer par une section "API Overview" listant les endpoints principaux et leur role.
**Si scope = standalone** : ne pas generer cette section.

---

## CHECKPOINT 2 — PRD overview

**Objectif** : Presenter le PRD de maniere non-technique pour validation finale.
**Output** : `docs/prd.md`, `docs/for-later.md`
**Template PRD** : `.claude/resources/templates/docs/bmad/prd-tmpl.yaml`
**Template for-later** : `.claude/resources/templates/docs/for-later.md`

### Le document PRD (adaptatif)

Sections generees selon ce que le projet inclut :

| Section | full-stack | standalone |
|---------|-----------|-----------|
| Goals & Background | OUI | OUI |
| User Stories | OUI (si users) | NON (Livrables) |
| UI Tree | SI frontend | NON |
| API Overview | SI backend sans frontend | NON |
| Functional Requirements | OUI | OUI |
| Non-Functional Requirements | OUI | Optionnel |
| UI Design Goals | SI frontend | NON |

Le scope est indique en haut du PRD : `**Scope** : {scope}`

### La presentation a l'utilisateur (non-technique)

**Ne PAS presenter le doc brut.** Presenter un overview adapte :

**Si full-stack (avec frontend) :**
> "Ton app permet a {users} de {actions principales}."
>
> **Ce qu'elle fait (MVP) :**
> - {Feature 1} — {description en 1 ligne}
>
> **Les roles :**
> - {Role 1} : peut {actions resumees}
>
> **Les pages principales :**
> - {Page 1} : {ce qu'on y fait}
>
> **Ce qu'on garde pour plus tard :**
> - {Item 1}, {Item 2}, ...

**Si full-stack (sans frontend — API seule) :**
> "Ton API permet a {consumers} de {actions principales}."
>
> **Endpoints principaux :**
> - {Endpoint 1} — {ce qu'il fait}
>
> **Entites :**
> - {Entity 1} : {description}

**Si standalone :**
> "Ce projet produit {livrables}."
>
> **Livrables :**
> - {Livrable 1} — {description}
>
> **Contraintes :**
> - {Contrainte 1}

Puis : "Le PRD detaille est dans `docs/prd.md` si tu veux checker. Sinon, on continue ?"

**L'utilisateur** : "OK" ou feedbacks, puis ajuster et ecrire `docs/prd.md` + `docs/for-later.md`

### For Later (automatique)

Collecter tous les elements post-MVP identifies :
- Brainstorming : Future Innovations + Moonshots
- Brief : Post-MVP Vision + Nice-to-have
- Stories : hors scope POC
- UI Tree : placeholders
- PRD : FR Should-have / Nice-to-have

---

## Fin du workflow — Next Step adaptatif

Le next step depend du scope detecte :

| Scope | Next Step | Raison |
|-------|-----------|--------|
| `full-stack` | `/greenfield-jobs` | Cartographie des entites, jobs et services |
| `standalone` | Execution directe | Pas besoin d'architecture — l'agent principal code le livrable |

```
Livrables :
- docs/brainstorming.md (inclut le scope detecte)
- docs/brief.md
- docs/prd.md (sections adaptees au projet)
- docs/for-later.md (post-MVP)

Next Step : depend du scope (voir tableau ci-dessus)
```
