---
name: greenfield-research
description: >
  Recherche technique des services externes identifiés dans les jobs.
  Boucle : fetch docs → extraire I/O, limites, coûts, impact DB → valider.
  Facultatif si tout est local. Produit docs/to-resarch.md.
allowed-tools: Read, Write, WebSearch, WebFetch, Glob, Grep
model: opus
user-invocable: true
disable-model-invocation: true
---

# De la liste des services à la documentation technique

Recherche ciblée sur les services externes identifiés dans `/greenfield-jobs`. Si aucun service externe → SKIP cette étape.

## Prérequis

→ Lire `docs/prd.md` — Si absent, STOP → `/greenfield-prd`
→ Lire `docs/architecture/backend/fr-mapping.md` — Si absent, STOP → `/greenfield-jobs`
→ Identifier les services externes depuis le fr-mapping (type = Service, catégorie = API externe)
→ Lire `docs/to-resarch.md` si existant (reprendre où on en était)

**Si aucun service externe identifié** : écrire un `docs/to-resarch.md` minimal (aucun service externe) et SKIP → `/greenfield-architecture`

---

## PHASE 1 — Identify

### 1.1 Liste des services à documenter

Depuis le fr-mapping, lister tous les services externes avec :
- Nom du service + provider choisi (validé dans `/greenfield-jobs`)
- Dans quels jobs il est utilisé
- Ce qu'on attend de lui (input/output attendus)

### 1.2 Questions complémentaires (si nécessaire)

Poser des questions UNIQUEMENT si des infos manquent pour la recherche :
- Credentials existants ("Tu as déjà un compte Stripe ?")
- Environnement test/sandbox disponible
- Contraintes spécifiques non mentionnées

### 1.3 Écriture initiale

Écrire `docs/to-resarch.md` avec la structure :

```markdown
# {Project} — Tool Research

## Statut

| Service | Statut |
|---------|--------|
| {service} | {À CHERCHER / EN COURS / DOCUMENTÉ / BLOQUÉ — raison} |

---

## Ce que le CLIENT doit fournir

### Clés API

| Service | Ce qu'il faut | Statut |
|---------|--------------|--------|
| {service} | {clé(s) nécessaire(s)} | {EN ATTENTE / FOURNI} |

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
- **Taille max** : {si applicable}

#### Patterns recommandés
- {best practices d'intégration issues de la doc officielle}
- {gestion d'erreurs, retries, idempotence}

#### Exemples de code
- {snippet d'appel réel issu de la doc ou SDK}
- {snippet de parsing de réponse}

#### Impact architecture
- **Tables DB** : {tables/colonnes nécessaires pour ce service}
- **Config** : {variables d'environnement nécessaires}

---

## .env template

```env
# === {Category} ===
{VAR_NAME}=               # {description, statut}
```
```

---

## PHASE 2 — Research

Pour chaque service (statut "À CHERCHER") :

1. **WebSearch** `{service} python sdk documentation`
2. **WebFetch** pages clés (quickstart, API reference, pricing)
3. **Extraire** : SDK + version, auth, endpoints, formats I/O, limites, coûts, patterns, exemples de code
4. **Impact architecture** : tables/colonnes DB, types, flows async (webhooks)
5. **Mettre à jour** la section dans `docs/to-resarch.md`

### Ordre de recherche

1. Services qui influencent le schema DB (paiement, auth externe)
2. Services coeur métier (AI, scraping)
3. Services utilitaires (email, storage)

---

## PHASE 3 — Validate

### Checklist par service

- [ ] Documentation récupérée et résumée
- [ ] Format I/O documenté avec exemples
- [ ] Limites et coûts identifiés
- [ ] Exemples de code extraits
- [ ] Impact architecture identifié (tables, colonnes, config)
- [ ] Clé API : statut clair (fourni, en attente, pas nécessaire)

### Décision

**Tout documenté** → Marquer COMPLET, générer `.env.template` final

**Éléments manquants** → Boucle PHASE 1 (nouvelles questions)

**Service BLOQUÉ** (en attente de clés) → Marquer BLOQUÉ, continuer. Un service bloqué = stub pendant le build.

---

## 🛑 CHECKPOINT — Research complète

**Présenter à l'utilisateur** :

| Service | Doc | I/O | Coût | Impact DB | Credentials | Statut |
|---------|-----|-----|------|-----------|-------------|--------|
| {service} | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/⏳/❌ | {PRÊT/BLOQUÉ} |

- Services prêts : X/Y
- Services bloqués : Z (liste + raison)

**Utilisateur** : "OK" → `/greenfield-architecture`, ou réponses aux questions restantes.

---

## Fin du workflow

```
Livrable : docs/to-resarch.md (complet et structuré)

Next Step : /greenfield-architecture
  → L'architecture consommera to-resarch.md pour :
    - Schema DB enrichi (tables liées aux services)
    - Business logic avec vrais formats I/O
    - Services décrits avec signatures réelles
```
