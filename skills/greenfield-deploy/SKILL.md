---
name: greenfield-deploy
description: >
  Déploie une application complète sur Dokploy Cloud. Génère les Dockerfiles,
  push sur GitHub, crée le projet Dokploy, configure GitHub/build/env/domaines,
  crée la DB, déploie et vérifie les logs runtime.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, mcp__dokploy__project-all, mcp__dokploy__project-create, mcp__dokploy__project-one, mcp__dokploy__application-create, mcp__dokploy__application-one, mcp__dokploy__application-update, mcp__dokploy__application-deploy, mcp__dokploy__application-redeploy, mcp__dokploy__application-reload, mcp__dokploy__application-stop, mcp__dokploy__application-start, mcp__dokploy__application-cleanQueues, mcp__dokploy__application-saveGithubProvider, mcp__dokploy__application-saveBuildType, mcp__dokploy__application-saveEnvironment, mcp__dokploy__domain-create, mcp__dokploy__postgres-create, mcp__ssh-mcp-personal-vps__execute-command
model: opus
user-invocable: true
disable-model-invocation: true
---

# Déploiement sur Dokploy Cloud

Déploie le contenu de `dev/` sur Dokploy Cloud. Le dossier `dev/` EST le repo GitHub (backend/ + frontend/ à la racine du repo).

## Prérequis

→ `dev/backend/` et `dev/frontend/` existent avec du code fonctionnel
→ `.mcp.json` configuré avec `dokploy` et `ssh-mcp-personal-vps`
→ L'utilisateur fournit : nom de domaine (ex: `app.mondomaine.fr`)
→ Le repo GitHub existe (l'utilisateur fournit l'URL)

## Constantes Dokploy Cloud

Récupérer ces valeurs depuis une application existante (via `application-one` sur un projet qui fonctionne) :

- **serverId** : obligatoire pour `application-create` sur Dokploy Cloud
- **githubId** : ID de l'intégration GitHub App

```
Appeler project-all → prendre une app existante → application-one → extraire serverId + githubId
```

---

## Phase 1 — Préparation du code

### 1.1 Dockerfiles

**Backend** (`dev/backend/Dockerfile`) :

```dockerfile
FROM python:3.13-slim

RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

**Points critiques backend :**
- `COPY requirements.txt` (pas `config/requirements.txt`) — le fichier à la racine du backend
- `requirements.txt` doit être un `pip freeze` complet (pas de versions min, toutes les deps transitives)
- User non-root `appuser`
- Healthcheck sur `/health`

**Frontend** (`dev/frontend/Dockerfile`) :

```dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" || exit 1

CMD ["node", "server.js"]
```

**Points critiques frontend :**
- `node:22-slim` (LTS) — PAS node:24 (pas de prebuilt binaries, build lent)
- `ENV HOSTNAME=0.0.0.0` dans le runner — OBLIGATOIRE sinon standalone écoute sur le hostname container
- `NEXT_PUBLIC_API_URL` en ARG (baked at build time)
- `output: "standalone"` dans `next.config.ts` — OBLIGATOIRE
- Pas de `reactCompiler: true` — trop CPU-intensive pour les builds VPS

**Frontend `.dockerignore`** (`dev/frontend/.dockerignore`) :

```
node_modules
.next
.git
*.md
.env*
```

### 1.2 run.sh (dev local)

**Backend** (`dev/backend/run.sh`) :

```bash
#!/bin/bash
SSH_HOST="root@{VPS_IP}"
LOCAL_PORT=5454
REMOTE_PORT=5454

echo "🔗 Opening SSH tunnel to PostgreSQL..."
ssh -f -N -L $LOCAL_PORT:localhost:$REMOTE_PORT $SSH_HOST

cleanup() {
    echo "🧹 Closing SSH tunnel..."
    pkill -f "ssh -f -N -L $LOCAL_PORT:localhost:$REMOTE_PORT"
}
trap cleanup EXIT INT TERM

echo "🚀 Starting FastAPI..."
source .venv/bin/activate
python -m app.api.main
```

### 1.3 Git init + push

Le repo Git est dans `dev/` (PAS à la racine du projet). Le repo contient `backend/` et `frontend/` à sa racine.

```bash
cd dev/
git init
git remote add origin {GITHUB_URL}
git add backend/ frontend/
git commit -m "Initial commit"
git push -u origin main
```

---

## Phase 2 — Configuration Dokploy

**IMPORTANT** : Dokploy Cloud a une concurrence de 1 déploiement par serveur (queue Inngest). Les opérations doivent être séquentielles.

### 2.1 Créer le projet

```
project-create(name: "{APP_NAME}", description: "{description}")
→ Récupérer projectId + environmentId
```

### 2.2 Créer les applications

**OBLIGATOIRE** : passer `serverId` sur Dokploy Cloud, sinon erreur "Authentication failed" (trompeuse).

```
application-create(name: "backend", environmentId: {envId}, serverId: {serverId})
application-create(name: "frontend", environmentId: {envId}, serverId: {serverId})
→ Récupérer les 2 applicationId
```

### 2.3 Connecter GitHub

```
Pour chaque app :
  application-saveGithubProvider(
    applicationId: {appId},
    owner: "{GITHUB_OWNER}",
    repository: "{REPO_NAME}",
    branch: "main",
    buildPath: "/",
    githubId: {githubId},
    enableSubmodules: false,
    triggerType: "push"
  )
```

**NOTE** : Le repo doit être autorisé dans l'app GitHub Dokploy (GitHub → Settings → Applications → dokploy-app → Repository access).

### 2.4 Configurer le build

```
Pour chaque app, utiliser application-update :

Backend :
  buildType: "dockerfile"
  dockerfile: "backend/Dockerfile"
  dockerContextPath: "backend"
  dockerBuildStage: ""
  networkSwarm: [{"Target": "db-network"}, {"Target": "dokploy-network"}]

Frontend :
  buildType: "dockerfile"
  dockerfile: "frontend/Dockerfile"
  dockerContextPath: "frontend"
  dockerBuildStage: ""
  networkSwarm: [{"Target": "dokploy-network"}]
```

**IMPORTANT buildPath** : toujours `/` (racine du repo). Le `dockerContextPath` pointe vers le sous-dossier. Si `buildPath` = `/backend`, Dokploy fait un double path `backend/backend/` → crash.

### 2.5 Configurer les variables d'environnement

```
Backend (via application-update, champ "env") :
  APP_NAME={app_name}
  DEBUG=false
  HOST=0.0.0.0
  PORT=8000
  PRODUCTION=true
  DB_HOST=postgres-unified
  DB_PORT=5432
  DB_NAME={db_name}
  DB_USER=postgres
  DB_PASSWORD={db_password}
  FRONTEND_URL=https://{domain_frontend}
  {autres variables selon le projet}

Frontend (via application-update, champ "env" ET "buildArgs") :
  env: "NEXT_PUBLIC_API_URL=https://{domain_api}\nHOSTNAME=0.0.0.0"
  buildArgs: "NEXT_PUBLIC_API_URL=https://{domain_api}"
```

**IMPORTANT env format** : Utiliser l'API directe `application.saveEnvironment` via curl (pas le MCP qui retourne 400). Les champs obligatoires sont : `applicationId`, `env`, `buildArgs`, `buildSecrets`, `createEnvFile`.

```bash
curl -s -X POST 'https://app.dokploy.com/api/trpc/application.saveEnvironment' \
  -H 'x-api-key: {API_KEY}' \
  -H 'Content-Type: application/json' \
  -d '{"json":{"applicationId":"{appId}","env":"{env_string}","buildArgs":"","buildSecrets":"","createEnvFile":true}}'
```

**IMPORTANT frontend** : `NEXT_PUBLIC_API_URL` doit être dans `env` ET dans `buildArgs`. Le `env` permet à Dokploy de créer le `.env` dans le context Docker. Le `buildArgs` injecte la valeur au build time.

### 2.6 Configurer les domaines

```
Pour chaque app :
  domain-create(
    host: "{subdomain}.{domain}",
    https: true,
    certificateType: "letsencrypt",
    stripPath: false,
    applicationId: {appId},
    domainType: "application",
    port: {8000 pour backend, 3000 pour frontend},
    path: "/"
  )
```

Convention de nommage :
- Frontend : `{app}.{domain}` (ex: `info-flash.multimodal-house.fr`)
- Backend : `{app}-api.{domain}` (ex: `info-flash-api.multimodal-house.fr`)

**Rappeler à l'utilisateur** : configurer les DNS (A records) chez le registrar pointant vers l'IP du VPS.

---

## Phase 3 — Base de données

### 3.1 Créer la DB sur postgres-unified

Via SSH MCP :

```
docker exec $(docker ps -q -f name=postgres-unified) psql -U postgres -c "CREATE DATABASE \"{db_name}\";"
```

Les migrations s'exécutent automatiquement au premier démarrage du backend (via `init_db()` dans le lifespan).

---

## Phase 3.5 — Pré-deploy checks

### 3.5.1 Vérifier le load serveur

**OBLIGATOIRE** avant tout déploiement. Un build Docker consomme beaucoup de CPU.

```bash
uptime  # load average doit être < 10
```

**Si load > 20** : NE PAS déployer. Attendre que ça descende. Identifier la cause (builds orphelins, containers en boucle).

### 3.5.2 Nettoyer les orphelins après suppression d'un projet

Quand on supprime un projet Dokploy, **3 types d'orphelins** restent sur le VPS :

#### A. Services Docker Swarm

```bash
docker service ls
# Comparer avec les apps dans Dokploy (via API project-all)
# Tout service sans app correspondante = orphelin
docker service rm {service_name}
```

#### B. Configs Traefik (CRITIQUE)

Les fichiers `.yml` dans `/etc/dokploy/traefik/dynamic/` ne sont PAS supprimés. Si un nouveau projet réutilise le même domaine, Traefik aura **deux routes pour le même domaine** → l'ancienne (service mort) prend le dessus → 502 Bad Gateway.

```bash
# Lister les configs Traefik
ls /etc/dokploy/traefik/dynamic/

# Supprimer les configs de l'ancien projet
rm /etc/dokploy/traefik/dynamic/{ancien_appName}.yml

# Recharger Traefik
docker kill -s HUP dokploy-traefik
```

#### C. Docker proxy orphelins (ports bloqués)

Si postgres-unified ou un autre service ne démarre plus avec "address already in use", un docker-proxy orphelin tient le port.

```bash
lsof -i :{port}    # trouver le PID
kill {PID}          # libérer le port
docker service update --force {service_name}
```

**ATTENTION** :
- **JAMAIS `docker kill $(docker ps -q)`** — ça kill TOUS les containers y compris Traefik (qui est un container standalone, pas un service Swarm, et ne revient pas tout seul)
- **TOUJOURS cibler par nom** : `docker service rm {nom_exact}`
- **Les volumes sont séparés des containers** — supprimer un service ne supprime pas les données

### 3.5.3 Vérifier que postgres-unified tourne

```bash
docker service ls | grep postgres-unified
# Doit être X/X (pas 0/X)
```

Si `0/X` : attendre ou `docker service update --force postgres-unified`.

---

## Phase 4 — Déploiement

### 4.1 Concurrence Dokploy Cloud

**Dokploy Cloud = 1 seul déploiement à la fois par serveur** (queue Inngest, `limit: 1` par `serverId`). Ce n'est PAS un bug, c'est by design pour protéger les resources du VPS.

Conséquences :
- Déployer backend PUIS frontend (séquentiel)
- Si un deploy est lancé pendant qu'un autre tourne, il est mis en queue
- L'API renvoie `true` même si le deploy est en queue (fire-and-forget vers Inngest)
- `cleanQueues` est un **noop** sur Dokploy Cloud (conçu pour BullMQ self-hosted)

### 4.2 Lancer les déploiements

**Utiliser l'API directe** (plus fiable que le MCP pour les mutations) :

```bash
# Backend en premier
curl -s -X POST 'https://app.dokploy.com/api/trpc/application.deploy' \
  -H 'x-api-key: {API_KEY}' \
  -H 'Content-Type: application/json' \
  -d '{"json":{"applicationId":"{backend_id}"}}'

# Attendre que le backend soit done sur Dokploy
# Puis frontend
curl -s -X POST 'https://app.dokploy.com/api/trpc/application.deploy' \
  -H 'x-api-key: {API_KEY}' \
  -H 'Content-Type: application/json' \
  -d '{"json":{"applicationId":"{frontend_id}"}}'
```

**Vérifier le statut** via le dashboard Dokploy ou via API :
```bash
curl -s 'https://app.dokploy.com/api/trpc/application.one?input=%7B%22json%22%3A%7B%22applicationId%22%3A%22{appId}%22%7D%7D' \
  -H 'x-api-key: {API_KEY}' | python3 -c "import sys,json; d=json.load(sys.stdin)['result']['data']['json']; print(f\"Status: {d['applicationStatus']}, Deployments: {len(d.get('deployments',[]))}\")"
```

### 4.3 Si un déploiement ne démarre pas

L'API renvoie `true` mais rien ne se passe = queue Inngest bloquée.

**Causes** :
- Un ancien deploy n'a jamais terminé (orphelin d'un projet supprimé)
- Services Docker orphelins sur le VPS
- Load serveur trop élevé

**Solutions** (dans l'ordre) :
1. Vérifier le load (`uptime`) — si > 20, attendre
2. Nettoyer les services Docker orphelins (voir Phase 3.5.2)
3. Vérifier sur le dashboard Dokploy s'il y a un deploy "running" bloqué → le cancel
4. Attendre 5-10 min (Inngest peut avoir un timeout interne qui libère le slot)

### 4.4 Vérifier les runtime logs

Après un build réussi, vérifier que le container démarre correctement via SSH MCP :

```bash
docker service logs {appName} --tail 20
```

**Backend OK** = `INFO: Uvicorn running on http://0.0.0.0:8000` + `✅ Database initialized`
**Frontend OK** = `✓ Ready in Xs` + écoute sur `0.0.0.0:3000`

**Erreurs fréquentes** :
- `ModuleNotFoundError` → dépendance manquante dans requirements.txt (faire `pip freeze`)
- Frontend écoute sur hostname container → `ENV HOSTNAME=0.0.0.0` manquant dans Dockerfile
- Child processes die → erreur d'import ou de config (lire les logs complets)
- Container restart en boucle → vérifier le load serveur, possible CPU starvation
- Workers Uvicorn die silencieusement → lancer avec `--workers 1` (via `application.update` champ `command`) pour voir l'erreur
- `.env` au mauvais endroit → Dokploy crée `.env` dans `{dockerContextPath}/` mais le code le cherche dans `config/`. Solution : `config.py` doit chercher le `.env` à la racine aussi (`pathlib.Path(__file__).parent.parent / ".env"`)
- 502 Bad Gateway → configs Traefik orphelines d'un ancien projet supprimé (voir Phase 3.5.2.B)

### 4.5 Après un fix qui nécessite un rebuild

```
1. Corriger le code localement
2. git add + commit + push
3. Lancer application.deploy via API directe (reclone le repo + rebuild)
```

**Lexique des commandes Dokploy** :
- `deploy` = reclone le repo + rebuild l'image Docker + restart le service
- `redeploy` = PAS de reclone, rebuild avec le code existant sur le VPS
- `reload` = PAS de rebuild, juste restart le service (force Swarm à recréer le container)
- `start` / `stop` = démarre/arrête le service sans rebuild

---

## Phase 5 — Vérification finale

### 5.1 Services en ligne

```
docker service ls | grep {appName}
```

Vérifier `X/X` replicas (pas `0/X`).

### 5.2 Endpoints accessibles

Demander à l'utilisateur de vérifier :
- `https://{domain_api}/health` → doit répondre
- `https://{domain_frontend}` → doit afficher l'app

### 5.3 Présenter le récapitulatif

```
✅ Déploiement terminé

Projet : {APP_NAME}
Backend : https://{domain_api}
Frontend : https://{domain_frontend}
DB : {db_name} sur postgres-unified

GitHub : {repo_url} (auto-deploy on push)
Dokploy : https://app.dokploy.com/dashboard/project/{projectId}

DNS à configurer (si pas fait) :
  {domain_api} → A → {VPS_IP}
  {domain_frontend} → A → {VPS_IP}
```

---

## Résumé des pièges Dokploy Cloud

| Piège | Solution |
|-------|----------|
| `application-create` fail "Auth error" | Passer `serverId` (obligatoire sur Cloud) |
| `saveGithubProvider` fail 400 | `buildPath` est obligatoire (ajouter `buildPath: "/"`) |
| `buildPath` + `dockerContextPath` = double path | `buildPath: /`, `dockerContextPath: {service}` |
| `saveEnvironment` fail 400 via MCP | Utiliser l'API directe curl avec tous les champs (`env`, `buildArgs`, `buildSecrets`, `createEnvFile`) |
| Deploy renvoie 200 mais rien ne se passe | Queue Inngest bloquée — vérifier services orphelins sur VPS, load serveur, attendre |
| `cleanQueues` ne fait rien | Normal sur Cloud — c'est un noop (BullMQ only). Pas de solution user-facing pour flush Inngest |
| 1 seul deploy à la fois par serveur | By design (Inngest `limit: 1` par `serverId`). Déployer séquentiellement |
| Frontend écoute sur hostname container | `ENV HOSTNAME=0.0.0.0` dans Dockerfile runner stage |
| `NEXT_PUBLIC_API_URL` pas pris en compte | Mettre dans `env` ET `buildArgs` |
| Image Docker pas mise à jour après rebuild | `redeploy` ou `reload` pour forcer Swarm à recréer le container |
| `node:24` build très lent | Utiliser `node:22-slim` (LTS, prebuilt binaries) |
| `requirements.txt` incomplet | Toujours utiliser `pip freeze` complet |
| Suppression projet ne supprime pas les services Docker | `docker service rm {orphan}` via SSH |
| Suppression projet ne supprime pas les configs Traefik | `rm /etc/dokploy/traefik/dynamic/{orphan}.yml` + `docker kill -s HUP dokploy-traefik` |
| 502 Bad Gateway alors que l'app tourne | Configs Traefik orphelines d'un ancien projet → même domaine, deux routes, Traefik prend la morte |
| Traefik disparaît après kill containers | Traefik = container standalone, PAS un service Swarm. Relancer manuellement (voir ci-dessous) |
| `.env` au mauvais endroit | Dokploy crée `.env` dans `{dockerContextPath}/`. `config.py` doit aussi chercher à la racine |
| Workers Uvicorn meurent silencieusement | Passer `--workers 1` via `application.update` champ `command` pour voir l'erreur |
| autoDeploy déclenche des builds à chaque push | Désactiver avec `application.update` `autoDeploy: false` pendant le debug |
| Load serveur > 100 | Builds empilés + steal time. Killer les process ciblés, JAMAIS `docker kill $(docker ps -q)` |

## Restaurer Traefik (si disparu)

Traefik est un container standalone (`--restart always`), PAS un service Swarm. Si killé, il faut le recréer manuellement :

```bash
docker rm -f dokploy-traefik 2>/dev/null
docker run -d \
  --name dokploy-traefik \
  --restart always \
  -v /etc/dokploy/traefik/traefik.yml:/etc/traefik/traefik.yml \
  -v /etc/dokploy/traefik/dynamic:/etc/dokploy/traefik/dynamic \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -p 443:443 \
  -p 80:80 \
  -p 443:443/udp \
  traefik:v3.6.7
docker network connect dokploy-network dokploy-traefik
docker network connect db-network dokploy-traefik
```

## Règles de sécurité

1. **JAMAIS `docker kill $(docker ps -q)`** — ça kill Traefik (standalone, ne revient pas) + tous les autres projets
2. **TOUJOURS cibler par nom** quand on supprime/kill un service ou container
3. **Vérifier le load avant de déployer** — un build sur un serveur surchargé empire tout
4. **Après suppression d'un projet Dokploy**, nettoyer 3 choses : services Docker + configs Traefik + docker-proxy orphelins
5. **Les volumes survivent aux kills/rm** — les données sont safe
6. **Désactiver `autoDeploy`** pendant le setup initial pour éviter les builds en cascade à chaque push
7. **Traefik = container standalone** — si il disparaît, le recréer manuellement (voir section ci-dessus)
