# Vaypr Production Deployment

Production deploys automatically when code is pushed to `main`.

```text
push to main -> GitHub Actions -> SSH to Hostinger VPS -> docker compose up -d --build
```

## Required GitHub Secrets

Add these in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Required secrets:

```text
VPS_HOST=72.60.212.167
VPS_PORT=22
VPS_USER=deploy
VPS_SSH_KEY=<private SSH key for GitHub Actions deploy access>
```

## GitHub Actions SSH Key

Create a dedicated deploy key pair on your Mac:

```bash
ssh-keygen -t ed25519 -C "github-actions-vaypr-deploy" -f ~/.ssh/vaypr_github_actions -N ""
```

Add the public key to the VPS:

```bash
cat ~/.ssh/vaypr_github_actions.pub
```

Paste that public key into:

```text
/home/deploy/.ssh/authorized_keys
```

Add the private key to GitHub Actions:

```bash
cat ~/.ssh/vaypr_github_actions
```

Paste the full private key into the `VPS_SSH_KEY` repository secret.

## VPS Requirements

The VPS must already have:

- Repo cloned at `/home/deploy/vaypr`
- Production env file at `/home/deploy/vaypr/.env`
- Docker and Docker Compose installed
- `deploy` user in the `docker` group
- `coolify` Docker network available
- Traefik/Coolify proxy running

## Manual Production Deploy

Run as `deploy` on the VPS:

```bash
cd /home/deploy/vaypr
git pull --ff-only origin main
docker compose config
docker compose up -d --build
docker compose ps
```

## Verify

```bash
curl -I https://vaypr.net
curl -I https://api.vaypr.net
docker logs --tail=80 vayper-backend
docker logs --tail=40 vayper-frontend
```
