---
name: tools-clarify
description: >
  Analyse une demande, identifie les zones de flou, propose des options
  basées sur la codebase et crée un markdown de clarification.
allowed-tools: Read, Write, Glob, Grep
model: sonnet
user-invocable: true
disable-model-invocation: false
---

# Clarification de demande

## Règles

1. **Concision** : Pas de verbosité
2. **Focus OÙ/QUOI** : Pas "comment" (l'agent sait coder)
3. **Pas de code complet** : Juste les spécifications
4. **Exigences précises** : Noms de fonctions, patterns, conventions
5. **Analyse codebase** : Baser les recommandations sur l'existant

## Process

1. Analyser la demande → comprendre l'objectif global
2. Explorer la codebase (Glob/Grep) → trouver fichiers similaires, patterns existants
3. Identifier les zones de flou → qu'est-ce qui manque ? Ambigu ?
4. Proposer des options basées sur la codebase actuelle
5. Spécifier ce qui est clair avec exigences précises
6. Créer le markdown de clarification

## Format de sortie

**Fichier** : `docs/[feature-name]-clarification.md`

```markdown
# [Feature] - Clarification

## Résumé
[Objectif en 1-2 phrases]

## Zones de flou identifiées

### Zone 1 : [Titre]
**Où** : `chemin/fichier.py`, fonction `nom`
**Quoi** : [Ce qui doit être fait]
**Flou** : [Question/ambiguïté]
**Options** :
  - Option A : [Description] → Pour/Contre
  - Option B : [Description] → Pour/Contre
**Recommandation** : [Option X] (raison)

## Spécifications claires

### Partie 1 : [Titre]
**Où** : `chemin/fichier.py`
**Quoi** : [Description précise]
**Exigences** :
- Nom fonction : `exact_function_name`
- Pattern : [async/await, class-based, etc.]
- Paramètres : [liste]
- Retour : [type]
- Conventions : [nommage, structure]

## Prochaines étapes
1. Clarifier : [Zone X]
2. Valider avec `/tools-validate`
```
