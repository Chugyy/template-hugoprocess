---
name: greenfield-research
description: >
  Recherche technique des services externes identifiés dans les jobs.
  Boucle : fetch docs, extraire I/O, limites, couts, impact DB, valider.
  Facultatif si tout est local. Produit docs/research/{service}.md par service.
allowed-tools: Read, Write, WebSearch, WebFetch, Glob, Grep, Bash
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif (ex: `./tests-note/docs/prd.md`). Le dossier projet est communique par l'utilisateur ou le workflow parent.

# De la liste des services a la documentation technique

Recherche ciblee sur les services externes identifies dans `/greenfield-jobs`. Si aucun service externe, SKIP cette etape.

## Prerequis

1. Lire `docs/prd.md` — Si absent, STOP, dire a l'utilisateur de lancer `/greenfield-prd`
2. Lire `docs/architecture/backend/fr-mapping.md` — Si absent, STOP, dire de lancer `/greenfield-jobs`
3. Identifier les services externes depuis le fr-mapping (type = Service, categorie = API externe)
4. Verifier si `dev/researches/` contient deja des recherches reutilisables (cache)
5. Verifier si `docs/research/` existe deja (reprendre ou on en etait)

**Si aucun service externe identifie** : creer `docs/research/index.md` minimal (aucun service externe) et SKIP vers `/greenfield-architecture`

---

## Structure de sortie

```
docs/research/
  index.md              # Tableau de statut + .env template
  stripe.md             # Un fichier par service
  twilio.md
  apify.md
  ...

dev/researches/         # Cache reutilisable entre projets
  stripe.md             # Copie des recherches finalisees
  twilio.md
  ...
```

---

## PHASE 1 — Identify

### 1.1 Verifier le cache

Avant toute recherche, verifier `dev/researches/` :
- Si `dev/researches/{service}.md` existe deja, le copier dans `docs/research/{service}.md`
- Proposer a l'utilisateur : "J'ai trouve une recherche existante pour {service}. Je la reutilise ou je refais la recherche ?"
- Si reutilise : marquer comme DOCUMENTE dans l'index

### 1.2 Liste des services a documenter

Depuis le fr-mapping, lister tous les services externes avec :
- Nom du service + provider choisi (valide dans `/greenfield-jobs`)
- Dans quels jobs il est utilise
- Ce qu'on attend de lui (input/output attendus)

### 1.3 Questions complementaires (si necessaire)

Poser des questions UNIQUEMENT si des infos manquent pour la recherche :
- Credentials existants ("Tu as deja un compte Stripe ?")
- Environnement test/sandbox disponible
- Contraintes specifiques non mentionnees

### 1.4 Ecriture initiale — Index

Creer `docs/research/index.md` :

```markdown
# {Project} — Service Research Index

## Statut

| Service | Fichier | Statut | Source |
|---------|---------|--------|--------|
| {service} | [{service}.md](./{service}.md) | {A CHERCHER / DOCUMENTE / BLOQUE} | {NOUVEAU / CACHE} |

---

## Cles API requises

| Service | Ce qu'il faut | Statut |
|---------|--------------|--------|
| {service} | {cle(s) necessaire(s)} | {EN ATTENTE / FOURNI} |

---

## .env template

```env
# === {Category} ===
{VAR_NAME}=               # {description, statut}
```
```

---

## PHASE 2 — Research

Pour chaque service (statut "A CHERCHER") :

### 2.1 Recherche

1. **WebSearch** `{service} python sdk documentation`
2. **WebFetch** pages cles (quickstart, API reference, pricing)
3. **Extraire** : SDK + version, auth, endpoints, formats I/O, limites, couts, patterns, exemples de code
4. **Impact architecture** : tables/colonnes DB, types, flows async (webhooks)

### 2.2 Ecriture — Un fichier par service

Creer `docs/research/{service}.md` :

```markdown
# {Service Name}

**Statut** : DOCUMENTE
**Documentation officielle** : {URL}

## Resume

{Ce que fait le service dans notre contexte}

## Integration

- **SDK/Librairie** : {package Python, version}
- **Auth** : {type d'auth — API key, OAuth, etc.}
- **Base URL** : {URL de l'API}

## Endpoints utilises

### {endpoint_name}

- **Methode** : {GET/POST/...}
- **URL** : {path}
- **Input** :
  ```json
  {exemple request body}
  ```
- **Output** :
  ```json
  {exemple response body}
  ```
- **Erreurs** : {codes d'erreur et leur signification}

## Limites & Couts

- **Rate limits** : {X req/min, etc.}
- **Cout** : {pricing pertinent pour notre usage}
- **Taille max** : {si applicable}

## Patterns recommandes

- {best practices d'integration issues de la doc officielle}
- {gestion d'erreurs, retries, idempotence}

## Exemples de code

```python
# {snippet d'appel reel issu de la doc ou SDK}
```

## Impact architecture

- **Tables DB** : {tables/colonnes necessaires pour ce service}
- **Config** : {variables d'environnement necessaires}

## Utilise par

| Job/Route | Methode appelee | Input | Output attendu |
|-----------|----------------|-------|----------------|
| {job_name} | {method} | {params} | {return type} |
```

### Ordre de recherche

1. Services qui influencent le schema DB (paiement, auth externe)
2. Services coeur metier (AI, scraping)
3. Services utilitaires (email, storage)

---

## PHASE 3 — Validate

### Checklist par service

- [ ] Documentation recuperee et resumee
- [ ] Format I/O documente avec exemples JSON reels
- [ ] Limites et couts identifies
- [ ] Exemples de code extraits
- [ ] Impact architecture identifie (tables, colonnes, config)
- [ ] Cle API : statut clair (fourni, en attente, pas necessaire)

### Decision

**Tout documente** : Marquer DOCUMENTE dans l'index, mettre a jour `.env template`

**Elements manquants** : Boucle PHASE 2 (completer la recherche)

**Service BLOQUE** (en attente de cles) : Marquer BLOQUE dans l'index, continuer. Un service bloque = stub pendant le build.

---

## PHASE 4 — Cache

Copier tous les fichiers `docs/research/{service}.md` finalises (statut DOCUMENTE) dans `dev/researches/`.

Cela permet de reutiliser les recherches dans de futurs projets sans refaire le travail.

---

## CHECKPOINT — Research complete

**Presenter a l'utilisateur** :

| Service | Doc | I/O | Cout | Impact DB | Credentials | Statut |
|---------|-----|-----|------|-----------|-------------|--------|
| {service} | OK/NON | OK/NON | OK/NON | OK/NON | OK/EN ATTENTE/NON | {PRET/BLOQUE} |

- Services prets : X/Y
- Services bloques : Z (liste + raison)

> **REGLE — Cles API** : Si des services necessitent des cles API (credentials EN ATTENTE), DEMANDER explicitement a l'utilisateur de les fournir maintenant. Les cles sont necessaires pour la phase de build (tests reels des services). Format attendu : "Pour continuer, j'ai besoin de tes cles API : {liste}. Tu peux me les donner ou je stub les services en attendant ?"

**Utilisateur** : "OK" puis passer a `/greenfield-architecture`, ou repondre aux questions restantes.

---

## Fin du workflow

```
Livrables :
  docs/research/index.md        — Index + statuts + .env template
  docs/research/{service}.md    — Un fichier par service documente
  dev/researches/{service}.md   — Cache reutilisable

Next Step : /greenfield-architecture
  L'architecture consommera docs/research/{service}.md pour :
    - Schema DB enrichi (tables liees aux services)
    - Business logic avec vrais formats I/O
    - Services decrits avec signatures reelles
```
