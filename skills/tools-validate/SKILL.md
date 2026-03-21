---
name: tools-validate
description: >
  Valide un markdown de clarification contre la codebase.
  Verdict : PRÊT ou PAS PRÊT avec détails.
allowed-tools: Read, Write, Glob, Grep
model: sonnet
user-invocable: true
disable-model-invocation: false
---

# Validation de clarification

## Input

Markdown de clarification (produit par `/tools-clarify` ou manuellement).
Chercher dans `docs/*-clarification.md` ou demander le chemin.

## Process

1. Lire le markdown de clarification
2. Pour chaque spécification, vérifier dans la codebase :
   - Le fichier cible existe ?
   - Le pattern mentionné est cohérent avec l'existant ?
   - Les dépendances sont disponibles ?
   - Pas de conflit avec le code existant ?
3. Pour chaque zone de flou non résolue → marquer comme bloquante
4. Verdict final : PRÊT / PAS PRÊT

## Format de sortie

```markdown
# Validation : [Feature]

## Verdict : PRÊT / PAS PRÊT

## Vérifications

### [Spécification 1]
- Fichier cible : existe / n'existe pas
- Pattern : cohérent / incohérent (détail)
- Dépendances : OK / manquante (détail)
- **Statut** : OK / BLOQUANT

## Zones de flou non résolues
- [Zone X] : [Pourquoi c'est bloquant]

## Résumé
- Spécifications validées : X/Y
- Bloquants : Z
```
