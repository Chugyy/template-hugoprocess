# {Service Name} — Integration Reference

Date: {YYYY-MM-DD}

## Overview

- **Service** : {nom du service}
- **Usage dans le projet** : {pourquoi on l'utilise, quelles features}
- **SDK** : {package name + version}
- **Pricing** : {resume du modele de prix}

---

## Authentication

- **Type** : {API key / OAuth / Bearer token}
- **Header** : `{header_name}: {format}`
- **Env var** : `{VAR_NAME}`

---

## Endpoints utilises

### {Endpoint 1 — Nom descriptif}

**URL** : `{METHOD} {url}`
**Description** : {ce que ca fait}

**Input** :
```json
{format de la requete}
```

**Output** :
```json
{format de la reponse}
```

**Erreurs** :
| Code | Signification | Action |
|------|--------------|--------|
| {code} | {description} | {retry / abandon / fallback} |

---

## Code Snippets

### Setup client

```python
{code d'initialisation du client SDK}
```

### {Operation 1}

```python
{code complet pour l'operation}
```

---

## Rate Limits

| Limite | Valeur |
|--------|--------|
| {type de limite} | {valeur} |

---

## Pricing

| Operation | Cout |
|-----------|------|
| {operation} | {prix} |

**Estimation projet** : {cout estime par user/mois ou par operation}

---

## Notes d'integration

- {Piege ou gotcha a connaitre}
- {Best practice specifique au service}
