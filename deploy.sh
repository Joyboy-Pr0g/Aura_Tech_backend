#!/usr/bin/env bash
# =============================================================================
# AURA TECH — Production deployment script (run on Hetzner server)
# Usage: ./deploy.sh
# Optional: BRANCH=main REPO_URL=... ./deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/app/auratech-backend}"
BRANCH="${BRANCH:-main}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/health}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
OVERRIDE_FILE="docker-compose.override.yml"
OVERRIDE_BACKUP=""

log() { echo "[deploy] $*"; }

rollback() {
  log "Deployment failed — attempting rollback..."
  if [[ -n "${PREVIOUS_IMAGE:-}" ]]; then
    docker tag "$PREVIOUS_IMAGE" auratech-backend:rollback 2>/dev/null || true
  fi
  docker compose -f "$COMPOSE_FILE" up -d --no-build backend || true
}

cleanup() {
  if [[ -n "$OVERRIDE_BACKUP" && -f "$OVERRIDE_BACKUP" ]]; then
    mv "$OVERRIDE_BACKUP" "$OVERRIDE_FILE" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  log "ERROR: .env not found. Copy .env.example to .env and configure secrets."
  exit 1
fi

# Prevent local dev override from merging in production
if [[ -f "$OVERRIDE_FILE" ]]; then
  OVERRIDE_BACKUP=$(mktemp)
  mv "$OVERRIDE_FILE" "$OVERRIDE_BACKUP"
  log "Temporarily disabled $OVERRIDE_FILE for production deploy"
fi

log "Pulling latest code (branch: $BRANCH)..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

PREVIOUS_IMAGE=$(docker images -q auratech-backend 2>/dev/null | head -n1 || true)

log "Building images..."
docker compose -f "$COMPOSE_FILE" build --pull

log "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

log "Waiting for health check..."
TRIES=30
until curl -fsS "$HEALTH_URL" >/dev/null 2>&1; do
  TRIES=$((TRIES - 1))
  if [[ $TRIES -le 0 ]]; then
    log "Health check failed: $HEALTH_URL"
    rollback
    exit 1
  fi
  sleep 2
done

log "Deployment successful."
curl -fsS "$HEALTH_URL" | head -c 200 || true
echo ""

log "Running containers:"
docker compose -f "$COMPOSE_FILE" ps
