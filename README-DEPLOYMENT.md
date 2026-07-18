# AURA TECH Backend — Hetzner Deployment Guide

Deploy the AURA TECH gaming e-commerce API on a **Hetzner CX23** (2 vCPU, 4 GB RAM, Ubuntu 22.04) with Docker Compose.

| Component | Details |
|---|---|
| Domain | `https://api.auratechplus.com` |
| Frontend | `https://www.auratechplus.com` (Vercel) |
| Stack | Node.js 20 · Express · PostgreSQL 15 · Redis 7 |
| Exposed port | **3000** (host) → **5000** (container) |

---

## Architecture

```text
Internet / Cloudflare
        │
        ▼
  Hetzner CX23 :3000  ──►  backend:5000
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              postgres:5432            redis:6379
              (internal only)          (internal only)
```

---

## Files in this setup

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Node 20 Alpine production image |
| `.dockerignore` | Smaller, safer builds |
| `docker-compose.yml` | Production stack (3 services) |
| `docker-compose.override.yml` | **Local dev only** — exposes DB/Redis, live reload |
| `.env.example` | Environment template |
| `init.sql` | Postgres extensions (schema via TypeORM migrations) |
| `nginx.conf` | Optional host reverse proxy + SSL |
| `setup-hetzner.sh` | First-time VPS bootstrap |
| `deploy.sh` | Pull, rebuild, health-check deploy |
| `Makefile` | Shortcuts (`make up`, `make backup`, …) |

---

## Step 1 — Provision Hetzner CX23

1. Create a server at [Hetzner Cloud](https://www.hetzner.com/cloud):
   - **CX23** (2 vCPU, 4 GB RAM, 40 GB SSD)
   - **Ubuntu 22.04 LTS**
   - Add your SSH key
2. Note the server **public IP**.

---

## Step 2 — Initial server setup

SSH as root:

```bash
ssh root@YOUR_SERVER_IP
```

Clone or upload the backend, then run:

```bash
export REPO_URL=https://github.com/YOUR_ORG/Aura_Tech_backend.git
chmod +x setup-hetzner.sh
./setup-hetzner.sh
```

This installs Docker, configures UFW (22, 80, 443, 3000), creates user `deploy`, and prepares `/app/auratech-backend`.

---

## Step 3 — Configure environment

```bash
ssh deploy@YOUR_SERVER_IP
cd /app/auratech-backend
cp .env.example .env
nano .env
```

**Required values:**

```bash
NODE_ENV=production
PORT=5000
API_URL=https://api.auratechplus.com
CORS_ORIGIN=https://www.auratechplus.com

DB_HOST=postgres
DB_PASSWORD=<strong password>
DB_NAME=auratech_db

REDIS_HOST=redis

JWT_SECRET=<openssl rand -hex 32>
BREVO_API_KEY=...
BREVO_FROM_EMAIL=...
ADMIN_EMAIL=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional push notifications (one line JSON):
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### `.env.production` (manual — do not commit)

There is **no** committed `.env.production` file. On the server, your live secrets live in **`.env`** only (chmod 600).

---

## Step 4 — Start production stack

**Important:** On production, use **`docker-compose.yml` only**. Do not use `docker-compose.override.yml` (local dev).

```bash
cd /app/auratech-backend
docker compose -f docker-compose.yml up -d --build
```

Or:

```bash
make up
./deploy.sh
```

Verify:

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok","timestamp":"..."}
```

Check logs:

```bash
make logs
# or
docker compose logs -f backend
```

Expected startup log lines:

```text
✅ PostgreSQL connected
✅ Migrations applied
✅ Redis connected
🚀 AURA TECH Backend running
```

---

## Step 5 — Cloudflare DNS

1. Cloudflare → DNS → **Add record**
   - Type: **A**
   - Name: `api`
   - Content: **Hetzner server IP**
   - Proxy: **Proxied** (orange cloud)

2. SSL/TLS → **Full (strict)**

3. Options:
   - **A)** Cloudflare → origin `:3000` directly (simplest; allow 3000 in UFW — already done)
   - **B)** Install `nginx.conf` on the host for TLS termination on `:443`

---

## Step 6 — Update Vercel frontend

```env
BACKEND_API_URL=https://api.auratechplus.com/api
NEXT_PUBLIC_SITE_URL=https://www.auratechplus.com
STOREFRONT_COMING_SOON=false
NEXT_PUBLIC_STOREFRONT_COMING_SOON=false
```

Redeploy Vercel.

---

## Memory budget (CX23 — 4 GB total)

| Service | Limit |
|---|---|
| PostgreSQL | 1200 MB |
| Backend | 600 MB |
| Redis | 256 MB |
| OS + Docker overhead | ~1 GB |

---

## Makefile commands

```bash
make help      # List commands
make up        # Start production
make down      # Stop services
make logs      # Follow logs
make build     # Rebuild images
make ps        # Status
make restart   # Restart all
make health    # Hit /health
make backup    # pg_dump to /app/backups
make prod      # Run deploy.sh
make dev       # Local dev with override (on laptop only)
```

---

## Database backup & restore

**Backup:**

```bash
make backup
# → /app/backups/auratech_db_YYYYMMDD_HHMMSS.sql
```

**Restore:**

```bash
make backup-restore BACKUP=/app/backups/auratech_db_20260101_120000.sql
```

---

## CI/CD deploy (manual)

On the server after git push:

```bash
cd /app/auratech-backend
./deploy.sh
```

`deploy.sh` will:

1. Temporarily disable `docker-compose.override.yml`
2. `git pull`
3. Rebuild & restart
4. Health-check `http://127.0.0.1:3000/health`
5. Roll back backend container on failure

---

## Optional — Nginx on host

```bash
sudo apt install nginx
sudo mkdir -p /etc/ssl/auratech
# Place Cloudflare Origin Certificate:
#   /etc/ssl/auratech/origin.pem
#   /etc/ssl/auratech/origin.key
sudo cp nginx.conf /etc/nginx/sites-available/auratech-api
sudo ln -s /etc/nginx/sites-available/auratech-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then you can close port 3000 from the public firewall and only expose 443.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `DB_PASSWORD is required` | Set `DB_PASSWORD` in `.env` |
| Backend restart loop | `docker compose logs backend` — check JWT_SECRET length ≥ 32 |
| CORS errors | `CORS_ORIGIN=https://www.auratechplus.com` (no trailing slash) |
| 502 from Cloudflare | Server down or wrong origin port; check `curl localhost:3000/health` |
| Redis/Postgres connection refused | Use service names `postgres` / `redis`, not `localhost`, inside containers |
| Out of memory | `docker stats` — reduce `DB_POOL_SIZE` or upgrade VPS |
| Migrations failed | Check postgres logs; ensure fresh volume or backup before retry |
| Dev override on production | Use `docker compose -f docker-compose.yml up` or `./deploy.sh` |

---

## Security checklist

- [ ] `.env` chmod 600, never in git
- [ ] Postgres & Redis **not** published to `0.0.0.0`
- [ ] UFW enabled (22, 80, 443, 3000 only as needed)
- [ ] Strong `DB_PASSWORD` and `JWT_SECRET`
- [ ] Cloudflare proxy enabled
- [ ] fail2ban active (installed by setup script)
- [ ] Firebase JSON via env var, not committed files

---

## Local development (your laptop)

```bash
cp .env.example .env
# Set DB_HOST=postgres, REDIS_HOST=redis for compose network
make dev
# API: http://localhost:3000/health
# Postgres: localhost:5432, Redis: localhost:6379
```

---

## NOTES — How everything fits together

1. **`docker-compose.yml`** is the production source of truth on Hetzner.
2. **`docker-compose.override.yml`** auto-merges locally for dev — **do not rely on it in production**; `deploy.sh` temporarily removes it during deploy.
3. **Schema** is created by **TypeORM migrations** on backend boot (`initializeDatabase()`), not by `init.sql` alone.
4. **`init.sql`** only adds Postgres extensions on first volume creation.
5. **Port mapping `3000:5000`** means Cloudflare/host hits port **3000**, app listens on **5000** inside the container.
6. **Email** uses **Brevo** (`BREVO_*`); SendGrid is optional/unused by default.
7. **Gemini** is documented in `.env.example` for future use — not active in current code.
8. **Render `render.yaml` / `DEPLOY.md`** are legacy; this guide replaces them for Hetzner.

---

## Quick reference

```bash
# Production start
docker compose -f docker-compose.yml up -d --build

# Health
curl http://127.0.0.1:3000/health

# Logs
docker compose logs -f backend

# Update
./deploy.sh
```
