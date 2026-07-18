#!/usr/bin/env bash
# =============================================================================
# AURA TECH — Hetzner CX23 initial server setup (Ubuntu 22.04 LTS)
# Run as root on a fresh VPS:
#   curl -fsSL <raw-url>/setup-hetzner.sh | bash
#   OR: chmod +x setup-hetzner.sh && sudo ./setup-hetzner.sh
# =============================================================================
set -euo pipefail

APP_DIR="/app/auratech-backend"
DEPLOY_USER="deploy"
REPO_URL="${REPO_URL:-https://github.com/YOUR_ORG/Aura_Tech_backend.git}"

echo "==> AURA TECH Hetzner setup starting..."

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates \
  curl \
  git \
  gnupg \
  lsb-release \
  ufw \
  fail2ban \
  htop \
  unzip \
  openssl

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable docker
systemctl start docker

echo "==> Creating deploy user..."
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
  passwd -l "$DEPLOY_USER" 2>/dev/null || true
fi

echo "==> Configuring firewall (ufw)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp comment 'HTTP/nginx'
ufw allow 443/tcp comment 'HTTPS/nginx'
ufw allow 3000/tcp comment 'AURA TECH API (Cloudflare origin)'
ufw --force enable

echo "==> Creating application directory..."
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" /app

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Cloning repository..."
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$APP_DIR" || {
    echo "Clone failed. Set REPO_URL and clone manually into $APP_DIR"
  }
fi

if [[ -f "$APP_DIR/.env.example" && ! -f "$APP_DIR/.env" ]]; then
  echo "==> Creating .env from .env.example..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo ""
  echo "Generated secrets (add to $APP_DIR/.env):"
  echo "  DB_PASSWORD=$(openssl rand -base64 24)"
  echo "  JWT_SECRET=$(openssl rand -hex 32)"
  echo ""
fi

mkdir -p /app/backups
chown "$DEPLOY_USER:$DEPLOY_USER" /app/backups

echo ""
echo "=============================================================================="
echo " Setup complete."
echo "=============================================================================="
echo "Next steps:"
echo "  1. ssh ${DEPLOY_USER}@YOUR_SERVER_IP"
echo "  2. cd $APP_DIR"
echo "  3. nano .env   # set DB_PASSWORD, JWT_SECRET, BREVO, CLOUDINARY, etc."
echo "  4. docker compose -f docker-compose.yml up -d --build"
echo "  5. curl http://localhost:3000/health"
echo "  6. Cloudflare DNS: api.auratechplus.com → A record → server IP (proxied)"
echo "  7. Cloudflare SSL: Full (strict) + optional nginx.conf on host"
echo "  8. Optional: ./deploy.sh for future updates"
echo "=============================================================================="
