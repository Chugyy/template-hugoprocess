---
name: greenfield-research
description: >
  Recherche et validation post-PRD. Boucle itérative en 3 phases :
  Identify (quoi chercher + questions user) → Research (fetch docs, APIs, libs) →
  Validate (complet ou besoin de + d'info). Produit docs/to-resarch.md.
allowed-tools: Read, Write, WebSearch, WebFetch, Glob, Grep
model: opus
user-invocable: true
disable-model-invocation: true
---

# Du PRD à la recherche technique

Boucle itérative qui identifie, recherche et valide toutes les dépendances externes avant l'architecture.

## Prérequis

→ Lire `docs/prd.md` — Si absent, STOP et recommander `/greenfield-prd`
→ Lire `docs/to-resarch.md` si existant (reprendre où on en était)

---

## PHASE 1 — Identify

**Objectif** : Lister tout ce qu'on doit chercher et poser les questions nécessaires.

### 1.1 Analyse du PRD

Depuis `docs/prd.md`, identifier :

1. **Services externes** — APIs tierces à intégrer (paiement, scraping, AI, email, storage...)
2. **Librairies Python** — Packages non-standard nécessaires (SDK, parsers, workers...)
3. **Décisions techniques ouvertes** — Choix non encore actés (quel provider, quel modèle, quel Actor...)
4. **Credentials nécessaires** — Toutes les clés API, tokens, secrets à obtenir

### 1.2 Questions utilisateur

Pour chaque élément identifié, formuler des questions concrètes :
- Préférences (ex: "Stripe ou Lemon Squeezy pour le paiement ?")
- Informations manquantes (ex: "Quels Actors Apify utilisez-vous ?")
- Choix techniques (ex: "Claude Sonnet ou Opus pour la génération ?")

**Présenter les questions à l'utilisateur et attendre ses réponses avant de continuer.**

### 1.3 Écriture initiale

Écrire `docs/to-resarch.md` avec la structure :

```markdown
# {Project} — Tool Research

## Statut

| Element | Statut |
|---------|--------|
| {service} | {À CHERCHER / EN COURS / DOCUMENTÉ / BLOQUÉ — raison} |

---

## Ce que le CLIENT doit fournir

### Clés API

| Service | Ce qu'il faut | Statut |
|---------|--------------|--------|
| {service} | {clé(s) nécessaire(s)} | {EN ATTENTE / FOURNI} |

### Décisions en attente

| Question | Impact |
|----------|--------|
| {question} | {impact sur l'architecture/build} |

---

## Recherches par service

### {N}. {Service Name}

**Statut : {À FAIRE / DOCUMENTÉ / BLOQUÉ}**
**Documentation officielle** : {URL}

#### Résumé
- {ce que fait le service dans notre contexte}

#### Intégration
- **SDK/Librairie** : {package Python, version}
- **Auth** : {type d'auth — API key, OAuth, etc.}
- **Endpoints utilisés** : {liste des endpoints/méthodes qu'on va appeler}

#### Format I/O
- **Input** : {format des requêtes — params, body, headers}
- **Output** : {format des réponses — structure JSON, types}

#### Limites & Coûts
- **Rate limits** : {X req/min, etc.}
- **Coût** : {pricing pertinent pour notre usage}
- **Taille max** : {si applicable — upload, payload, etc.}

#### Patterns recommandés
- {best practices d'intégration issues de la doc officielle}
- {gestion d'erreurs, retries, idempotence}

#### Impact architecture
- **Tables DB** : {tables/colonnes nécessaires pour ce service}
- **Config** : {variables d'environnement nécessaires}

---

## Décisions d'architecture actées

### {Sujet}
- {décision et justification}

---

## .env template

```env
# === {Category} ===
{VAR_NAME}=               # {description, statut}
```

---

## Prochaine étape

{Ce qui reste à faire / Ce qui est prêt}
```

---

## PHASE 2 — Research

**Objectif** : Pour chaque service identifié (statut "À CHERCHER"), aller récupérer la documentation.

### Process par service

1. **Trouver la doc officielle** — WebSearch pour `{service} python sdk documentation`
2. **Fetch la doc pertinente** — WebFetch sur les pages clés (quickstart, API reference, pricing)
3. **Extraire** :
   - SDK Python recommandé + version
   - Méthode d'authentification
   - Endpoints/méthodes qu'on va utiliser (basé sur les FR du PRD)
   - Format exact des requêtes et réponses
   - Limites (rate limits, taille max, quotas)
   - Coût estimé pour notre usage
   - Patterns d'intégration recommandés (retry, error handling, webhooks)
4. **Identifier l'impact architecture** :
   - Tables/colonnes DB nécessaires (ex: `stripe_customer_id`, `webhook_events`)
   - Types de données à stocker
   - Flows asynchrones (webhooks, callbacks)
5. **Mettre à jour** la section du service dans `docs/to-resarch.md`

### Ordre de recherche

Prioriser par impact :
1. Services qui influencent le schema DB (paiement, auth externe)
2. Services coeur métier (AI, scraping)
3. Services utilitaires (email, storage)

---

## PHASE 3 — Validate

**Objectif** : Vérifier la complétude et décider : boucler ou continuer.

### Checklist de validation

Pour chaque service :
- [ ] Documentation récupérée et résumée
- [ ] Format I/O documenté
- [ ] Limites et coûts identifiés
- [ ] Impact architecture identifié (tables, colonnes, config)
- [ ] Clé API / credentials : statut clair (fourni, en attente, pas nécessaire)

### Décision

**Si tous les services sont documentés ET toutes les questions utilisateur ont une réponse :**
→ Marquer le statut global comme COMPLET
→ Générer le `.env.template` final
→ Présenter le résumé à l'utilisateur

**Si des éléments manquent :**
→ Identifier précisément ce qui manque
→ Formuler les nouvelles questions pour l'utilisateur
→ Retour en PHASE 1 (boucle)

**Si un service est BLOQUÉ (en attente de clés/infos client) :**
→ Le marquer comme BLOQUÉ avec la raison
→ Continuer avec les autres services
→ Un service bloqué n'empêche PAS de passer à l'architecture (il sera implémenté en stub puis complété)

---

## 🛑 CHECKPOINT — Recherche complète

**Présenter à l'utilisateur** :

| Service | Doc | I/O | Limites | Impact DB | Credentials | Statut |
|---------|-----|-----|---------|-----------|-------------|--------|
| {service} | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/⏳/❌ | {PRÊT/BLOQUÉ} |

- Services prêts : X/Y
- Services bloqués : Z (liste + raison)
- Questions restantes : N

**Utilisateur** : "OK" pour passer à `/greenfield-architecture`, ou réponses aux questions restantes.

---

## Fin du workflow

```
Livrable : docs/to-resarch.md (complet et structuré)

Next Step : /greenfield-architecture
  → L'architecture consommera to-resarch.md pour :
    - Schema DB enrichi (tables liées aux services)
    - Business logic avec vrais formats I/O
    - Services décrits avec signatures réelles (pas des placeholders)
```
