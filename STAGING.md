# Vaypr Staging

Staging runs beside production on the same VPS/Coolify Traefik network.

## Domains
- Production frontend: `https://vaypr.net`
- Production API: `https://api.vaypr.net`
- Staging frontend: `https://staging.vaypr.net`
- Staging API: `https://api-staging.vaypr.net`

## DNS
Create these DNS records for `vaypr.net`:

```text
staging      A      72.60.212.167
api-staging  A      72.60.212.167
```

## VPS Setup
Create a staging env file on the VPS:

```bash
cd /home/deploy/vaypr
cp .env.staging.example .env.staging
chmod 600 .env.staging
nano .env.staging
```

Use separate staging credentials where possible:

- Separate MongoDB Atlas database, for example `vaypr_staging`
- Separate Google OAuth callback: `https://api-staging.vaypr.net/auth/google/callback`
- Stripe test-mode keys for staging
- Brevo test/sandbox sender if available

## Validate

```bash
cd /home/deploy/vaypr
docker compose -f docker-compose.staging.yml config
```

## Deploy Staging

```bash
cd /home/deploy/vaypr
git pull
docker compose -f docker-compose.staging.yml up -d --build
docker compose -f docker-compose.staging.yml ps
docker logs --tail=80 vayper-backend-staging
docker logs --tail=40 vayper-frontend-staging
```

## Test

```bash
curl -I https://staging.vaypr.net
curl -I https://api-staging.vaypr.net
```

Only deploy to production after staging is verified.
