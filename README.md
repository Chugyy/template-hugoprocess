# Greenfield Development Framework

Framework structuré pour le développement greenfield avec Claude Code.

## Setup

### 1. MCP Servers

Copier le fichier d'exemple à la racine du projet :

```bash
cp .claude/.mcp.json.example .mcp.json
```

Modifier `.mcp.json` avec tes propres valeurs :
- `ssh-mcp-personal-vps` : remplacer `YOUR_VPS_IP` et `YOUR_PASSPHRASE` par tes infos

Les serveurs `origin-ui`, `shadcn` et `icons8mcp` fonctionnent sans configuration.

### 2. Workflow

Le framework suit un pipeline séquentiel :

```
/greenfield-prd          → Brainstorming + PRD
/greenfield-jobs         → Jobs & Services
/greenfield-research     → Recherche services externes (facultatif)
/greenfield-architecture → Architecture + Review Final
/greenfield-build        → Code par couches avec tests progressifs
```

Détails complets dans `CLAUDE.md`.
