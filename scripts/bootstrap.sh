#!/usr/bin/env bash
# ===========================================================================
# SmartCollab — one-paste bootstrap for a fresh Ubuntu droplet.
#
# Usage on the droplet:
#   curl -fsSL https://raw.githubusercontent.com/nufailhzq/smartcollab/main/scripts/bootstrap.sh \
#     | GEMINI_API_KEY=your_key_here bash
#
# What it does:
#   1. Adds a 2 GB swapfile (small droplets need it to run `next build`)
#   2. Installs Docker + Docker Compose + git
#   3. Opens UFW for SSH + port 3000
#   4. Clones the repo into /root/smartcollab
#   5. Writes .env.docker with a fresh AUTH_SECRET + your Gemini key
#   6. Builds and launches `docker compose up -d`
# ===========================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/nufailhzq/smartcollab.git}"
APP_DIR="${APP_DIR:-/root/smartcollab}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"

if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌  GEMINI_API_KEY env var is required."
  echo "    Re-run with:  curl … | GEMINI_API_KEY=AQ.xxx bash"
  exit 1
fi

PUBLIC_IP=$(curl -fsSL -4 https://ifconfig.me || true)
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP=$(hostname -I | awk '{print $1}')
fi
echo "▶  Detected public IP: $PUBLIC_IP"

# ---------------------------------------------------------------------------
# 1) Swap — gives a 1 GB droplet enough headroom to build Next.js
# ---------------------------------------------------------------------------
if [ ! -f /swapfile ]; then
  echo "▶  Creating 2 GB swapfile…"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ---------------------------------------------------------------------------
# 2) Apt + Docker
# ---------------------------------------------------------------------------
echo "▶  Installing system packages…"
export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt install -y -qq git nano ufw curl ca-certificates

if ! command -v docker >/dev/null 2>&1; then
  echo "▶  Installing Docker…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# ---------------------------------------------------------------------------
# 3) Firewall
# ---------------------------------------------------------------------------
echo "▶  Configuring firewall…"
ufw allow OpenSSH >/dev/null
ufw allow 3000/tcp >/dev/null
ufw --force enable >/dev/null

# ---------------------------------------------------------------------------
# 4) Clone (or pull) repo
# ---------------------------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  echo "▶  Repo exists — pulling latest…"
  git -C "$APP_DIR" pull --ff-only
else
  echo "▶  Cloning $REPO_URL → $APP_DIR…"
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ---------------------------------------------------------------------------
# 5) Write .env.docker — secrets stay on the droplet, never in git
# ---------------------------------------------------------------------------
if [ ! -f .env.docker ]; then
  echo "▶  Generating .env.docker…"
  AUTH_SECRET=$(openssl rand -base64 32)
  MYSQL_ROOT_PW=$(openssl rand -base64 24 | tr -d '/+=')
  MYSQL_USER_PW=$(openssl rand -base64 24 | tr -d '/+=')
  cat > .env.docker <<EOF
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PW
MYSQL_DATABASE=ukm_lms_new
MYSQL_USER=ukm
MYSQL_PASSWORD=$MYSQL_USER_PW

AUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=http://$PUBLIC_IP:3000

GEMINI_API_KEY=$GEMINI_API_KEY
GEMINI_MODEL=$GEMINI_MODEL
EOF
  chmod 600 .env.docker
fi

# ---------------------------------------------------------------------------
# 6) Build + launch
# ---------------------------------------------------------------------------
echo "▶  Building image (first run takes ~5-8 min)…"
docker compose up -d --build

echo ""
echo "==========================================================="
echo "  ✅  SmartCollab is starting at http://$PUBLIC_IP:3000"
echo "==========================================================="
echo ""
echo "Tail the app logs with:"
echo "  docker compose -f $APP_DIR/docker-compose.yml logs -f app"
echo ""
echo "First-launch DB migration may take ~15-30s after the build"
echo "finishes — give it a moment before refreshing the browser."
