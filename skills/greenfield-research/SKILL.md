---
name: greenfield-research
description: >
  Recherche technique des services externes identifies dans les jobs.
  Verifie la librairie partagee, recherche si necessaire, demande credentials,
  cree le .env. Source unique : .claude/resources/researches/
allowed-tools: Read, Write, WebSearch, WebFetch, Glob, Grep, Bash
model: opus
user-invocable: true
disable-model-invocation: false
---

> **Convention projet** : Tous les chemins `docs/` et `dev/` sont relatifs au dossier projet actif. Les recherches sont dans `.claude/resources/researches/`.

# Recherche des services externes

Source unique de verite pour les recherches : `.claude/resources/researches/`. Pas de copie dans le projet.

## Prerequis

1. Lire `docs/prd.md` — Si absent, STOP → `/greenfield-prd`
2. Lire `docs/architecture/backend/fr-mapping.md` — Si absent, STOP → `/greenfield-jobs`
3. Identifier les services externes depuis le fr-mapping (type = Service, categorie = API externe)

**Si aucun service externe identifie** : SKIP vers l'architecture.

---

## Phase 1 — Verifier la librairie

Pour chaque service identifie, verifier si `.claude/resources/researches/{service}.md` existe.

| Service | Dans la librairie ? | Action |
|---------|-------------------|--------|
| {service} | OUI | Pas de recherche |
| {service} | NON | Recherche necessaire |

---

## Phase 2 — Rechercher les services manquants

Pour chaque service NON present dans la librairie :

### 2.1 Recherche web

1. **WebSearch** `{service} python sdk documentation`
2. **WebFetch** pages cles (quickstart, API reference, pricing)
3. Extraire : SDK + version, auth, endpoints, formats I/O, limites, couts, exemples de code

**IMPORTANT — Pas de vrais credentials dans les recherches** : les fichiers `.claude/resources/researches/*.md` sont versionnés dans git. Ne JAMAIS y mettre de vrais tokens, clés API, webhooks ou secrets. Utiliser des placeholders (`<SLACK_WEBHOOK_URL>`, `{API_KEY}`, `YOUR_TOKEN_HERE`) dans les exemples de code et endpoints.

### 2.2 Ecrire dans la librairie

Creer `.claude/resources/researches/{service}.md` :

```markdown
# {Service Name} — Research

## Resume
{Ce que fait le service, en 2-3 phrases}

## Integration
- **SDK/Librairie** : {package Python, version}
- **Auth** : {type d'auth — API key, OAuth, etc.}
- **Base URL** : {URL de l'API}

## Endpoints utiles

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
- **Erreurs** : {codes d'erreur et signification}

## Limites & Couts
- **Rate limits** : {X req/min}
- **Cout** : {pricing pertinent}

## Patterns recommandes
- {best practices d'integration}
- {gestion d'erreurs, retries, idempotence}

## Exemples de code
```python
# snippet d'appel reel issu de la doc ou SDK
```

## Variables d'environnement necessaires
| Variable | Description |
|----------|-------------|
| `{VAR_NAME}` | {description} |
```

---

## Phase 3 — Demander les credentials

Presenter a l'utilisateur la liste de TOUS les services (librairie + nouvellement recherches) avec les credentials necessaires :

```
Pour builder et tester les services, j'ai besoin de tes cles API :

| Service | Variable | Statut |
|---------|----------|--------|
| {service} | {VAR_NAME} | EN ATTENTE |

Tu peux me les donner maintenant ?
```

**Des que l'utilisateur fournit les credentials** → Phase 4.

**Si l'utilisateur ne peut pas fournir certaines cles** → marquer comme STUB. Le build stubera ces services.

---

## Phase 4 — Creer le .env

Ecrire `{project}/docs/.env` avec les credentials fournis :

```env
# === {Service Name} ===
{VAR_NAME}={valeur fournie}

# === Services stubes (credentials manquants) ===
# {VAR_NAME}=  # EN ATTENTE
```

Ce fichier sera copie dans `dev/backend/.env` par le build (Phase 0 setup).

---

## Fin du workflow

```
Livrables :
  .claude/resources/researches/{service}.md  — Recherches (source unique)
  docs/.env                       — Credentials pour le build

Next Step : architecture (/arch-business-logic, /arch-schema, etc.)
```
