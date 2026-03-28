---
name: greenfield-jobs
description: >
  Définit les jobs de l'application et les choix de services. Présentation
  centrée sur l'intention : "Quand un user fait X, il se passe Y via Z".
  Questions de préférence uniquement quand impact coût/qualité.
allowed-tools: Read, Write, Glob, Grep
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif (ex: `./tests-note/docs/prd.md`). Le dossier projet est communiqué par l'utilisateur ou le workflow parent.

# Du PRD aux Jobs & Services

Le coeur de l'application. Chaque job = une action métier complète. Les services, CRUD, utils sont les briques qui composent chaque job.

## Prérequis

→ Lire `docs/prd.md` — Si absent, STOP → `/greenfield-prd`
→ Extraire tous les Functional Requirements (FR1-FRN)

---

## Phase 1 — Identification des entités et fonctions

### 1.1 Extraction (silencieux)

Depuis le PRD, identifier :
1. **Entités métier** (User, Property, Booking...)
2. **Pour chaque FR** : type de fonction (Job / CRUD / Utils / Service) + fonction principale
3. **Services externes nécessaires** : quelles briques non-locales sont requises

### 1.2 Classification des fonctions

Pour chaque fonction identifiée, déterminer :
- **Jobs** : orchestrent une action métier complète (ex: "créer une réservation" = validation + CRUD + notification)
- **CRUD** : opérations DB pures (create, read, update, delete, list, filtres)
- **Utils** : logique pure sans I/O (validation, calculs, formatage)
- **Services** : interaction avec l'extérieur (API, email, AI, storage)

---

## Phase 2 — Choix de services

### 2.1 Préférences implicites du LLM (pas de question)

Le LLM applique ces préférences automatiquement, SANS demander :
- **Local > API externe** : librairie Python > API tierce quand possible
- **Open source > propriétaire** : sauf si le propriétaire est clairement supérieur
- **Simple > complexe** : 1 lib qui fait le job > 3 libs combinées
- **Gratuit > payant** : sauf si le payant est requis par le use case

Exemples de décisions silencieuses :
- PDF generation → `weasyprint` ou `reportlab` (pas d'API externe)
- Image resize → `Pillow` (pas Cloudinary)
- Validation email format → regex (pas d'API)
- Markdown → HTML → `markdown` lib (pas d'API)

### 2.2 Questions uniquement quand ça impacte (checkpoint partiel)

Poser des questions SEULEMENT pour :

**Choix avec impact coût significatif :**
- "Pour la génération de texte AI, tu préfères Claude (meilleur mais ~$3/1M tokens) ou un modèle local (gratuit mais moins performant) ?"

**Choix avec impact fonctionnel :**
- "Pour le paiement : Stripe (plus complet, webhook robustes) ou Lemon Squeezy (plus simple, orienté SaaS) ?"

**Choix impossibles sans input humain :**
- "Tu as déjà un compte chez un provider email ? (Resend, SendGrid, autre...)"
- "Pour le scraping, quels sites exactement ?"

**NE PAS demander :**
- Quel ORM (on n'en utilise pas — asyncpg direct)
- Quel framework (FastAPI — c'est dans le template)
- Quel validator (Pydantic — c'est dans le template)
- Quel format de date, encoding, etc. (conventions du projet)

---

## CHECKPOINT — Vue Jobs

**Objectif** : Présenter l'application du point de vue de ce qu'elle FAIT, pas de comment elle est codée.

### Format de présentation

Pour chaque entité principale, présenter les jobs en langage humain :

```
📦 {Entité}

  ▸ Quand un {rôle} {action} :
    1. {étape 1 en français}
    2. {étape 2 en français}
    3. {étape 3 en français}
    → Résultat : {ce qui se passe}
    → Service utilisé : {service} ({justification courte})

  ▸ Quand un {rôle} {autre action} :
    1. ...
```

**Exemple concret :**

```
📦 Booking

  ▸ Quand un client réserve un logement :
    1. On vérifie les disponibilités
    2. On bloque les dates
    3. On crée le paiement via Stripe
    4. On envoie un email de confirmation via Resend
    → Résultat : réservation confirmée, propriétaire notifié
    → Services : Stripe (paiement), Resend (email)

  ▸ Quand un propriétaire annule une réservation :
    1. On rembourse le client via Stripe
    2. On libère les dates
    3. On notifie le client par email
    → Résultat : réservation annulée, client remboursé
```

### Récapitulatif services

Après les jobs, présenter un tableau services :

| Service | Utilisé pour | Type | Choix |
|---------|-------------|------|-------|
| Stripe | Paiement | API externe | Confirmé par user |
| Resend | Email transactionnel | API externe | Décision LLM (gratuit < 3k/mois) |
| Pillow | Resize images | Lib Python locale | Décision LLM (pas besoin d'API) |

**L'utilisateur** : valide, challenge les choix, ou ajuste les workflows.

---

## Phase 3 — Écriture des documents

Après validation, écrire :

### `docs/architecture/backend/entities.md`
Liste des entités avec description.

### `docs/architecture/backend/fr-mapping.md`
Mapping FR → entité → type (Job/CRUD/Utils/Service) → fonction.

**Template entités** : `.claude/resources/templates/docs/architecture/backend/entities/entities.md`
**Template mapping** : `.claude/resources/templates/docs/architecture/backend/entities/fr-mapping.md`

---

## Fin du workflow

```
Livrables :
- docs/architecture/backend/entities.md
- docs/architecture/backend/fr-mapping.md

Next Step : /greenfield-research (si services externes)
  → OU /greenfield-architecture (si tout est local)
```
