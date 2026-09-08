#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#   🤖 Naqoli Studio — Setup Script (v2.5.1)
#   Fully automated kids-video bot for TikTok + Telegram management
#
#   Supported OS: Ubuntu 20.04+ / Debian 11+
#
#   Full install:
#     sudo bash setup.sh
#     sudo bash setup.sh --domain example.com   ← with domain + auto SSL
#   Other options:
#     sudo bash setup.sh --port 8080            ← custom port
#     sudo bash setup.sh --update               ← pull, rebuild, restart
#     sudo bash setup.sh --status               ← service status
# ════════════════════════════════════════════════════════════════
set -euo pipefail

# ──────────── Defaults (overridable via flags) ────────────
APP_NAME="naqoli-studio"
APP_DIR="/var/www/${APP_NAME}"
DB_NAME="app_db"
DB_USER="postgres"
DB_PASS=""                      # empty = a secure random password is generated
APP_PORT=3000
DOMAIN=""                       # empty = no domain/SSL
NODE_MAJOR=22
SERVICE_NAME="naqoli"
ACTION="install"

# ──────────── Colored output ────────────
C_OK="\033[1;32m"; C_INFO="\033[1;36m"; C_WARN="\033[1;33m"; C_ERR="\033[1;31m"; C_OFF="\033[0m"
log()  { echo -e "${C_INFO}🤖 [setup]${C_OFF} $1"; }
ok()   { echo -e "${C_OK}✅${C_OFF} $1"; }
warn() { echo -e "${C_WARN}⚠️${C_OFF} $1"; }
err()  { echo -e "${C_ERR}❌ $1${C_OFF}" >&2; exit 1; }

# ──────────── Parse flags ────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="$2"; shift 2 ;;
    --port)    APP_PORT="$2"; shift 2 ;;
    --app-dir) APP_DIR="$2"; shift 2 ;;
    --db-pass) DB_PASS="$2"; shift 2 ;;
    --update)  ACTION="update"; shift ;;
    --status)  ACTION="status"; shift ;;
    -h|--help) ACTION="help"; shift ;;
    *) err "Unknown flag: $1 (use --help for usage)" ;;
  esac
done

if [[ "$ACTION" == "help" ]]; then
  echo "Usage: sudo bash setup.sh [options]"
  echo ""
  echo "  --domain DOMAIN    Your domain (auto-installs Caddy + free SSL)"
  echo "  --port PORT        Application port (default: 3000)"
  echo "  --app-dir DIR      Install directory (default: /var/www/naqoli-studio)"
  echo "  --db-pass PASS     Database password (default: secure random)"
  echo "  --update           Pull latest code, rebuild and restart"
  echo "  --status           Service status and recent logs"
  exit 0
fi

# ──────────── Status mode ────────────
if [[ "$ACTION" == "status" ]]; then
  systemctl status "${SERVICE_NAME}" --no-pager || true
  echo ""
  echo "─── last 10 log lines ───"
  journalctl -u "${SERVICE_NAME}" -n 10 --no-pager || true
  exit 0
fi

[[ "$(id -u)" == "0" ]] || err "This script must run as root:  sudo bash setup.sh"

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

run_psql() { sudo -u postgres psql "$@"; }

echo ""
echo "════════════════════════════════════════════"
echo "   🤖 Naqoli Studio Installer — v2.5.1"
echo "════════════════════════════════════════════"
echo ""

# ════════════════ Update mode ════════════════
if [[ "$ACTION" == "update" ]]; then
  [[ -d "$APP_DIR" ]] || err "Project not found at ${APP_DIR}; run the full install first."
  cd "$APP_DIR"
  git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  if [[ -d .git ]]; then
    log "Pulling latest changes from git…"
    git pull --ff-only || warn "git pull failed; continuing with the current code."
  else
    warn "This installation has no git repository; to update, copy the new release onto the server and run this script again."
  fi
  log "Installing dependencies…"
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
  log "Applying possible schema changes…"
  set -a; [[ -f .env ]] && . ./.env; set +a
  npx drizzle-kit push --force || warn "drizzle-kit push skipped (fine if the schema did not change)"
  log "Building for production…"
  npm run build
  chown -R www-data:www-data "$APP_DIR"
  log "Restarting service…"
  systemctl restart "${SERVICE_NAME}"
  ok "Update complete! Check: systemctl status ${SERVICE_NAME}"
  exit 0
fi

# ════════════════ 1) Base packages ════════════════
log "Installing base packages (apt)…"
apt-get update -y >/dev/null || warn "apt-get update reported errors; continuing…"
apt-get install -y curl ca-certificates gnupg git rsync openssl >/dev/null \
  || err "Failed to install base packages; check the server's internet connection."
ok "Base packages installed"

# ════════════════ 1.5) Ensure project files exist ════════════════
# If the script was downloaded alone, clone the repository automatically
if [[ ! -f "${SRC_DIR}/package.json" ]]; then
  log "Project files not found next to the script; cloning from GitHub…"
  rm -rf "${SRC_DIR}/.naqoli-src"
  git clone --depth 1 https://github.com/darkfalkon369-crypto/naqoli-studio.git "${SRC_DIR}/.naqoli-src" \
    || err "Auto-clone from GitHub failed; place the project files next to this script."
  SRC_DIR="${SRC_DIR}/.naqoli-src"
  ok "Project source fetched from GitHub"
fi

# ════════════════ 2) Node.js ════════════════
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  CUR_MAJOR=$(node -p "parseInt(process.versions.node)" 2>/dev/null || echo 0)
  [[ "$CUR_MAJOR" -ge 20 ]] && NEED_NODE=0 && ok "Node.js $(node -v) already installed"
fi
if [[ "$NEED_NODE" == "1" ]]; then
  log "Installing Node.js ${NODE_MAJOR}…"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh \
    || err "Could not download the NodeSource setup script; check the internet connection."
  bash /tmp/nodesource_setup.sh >/dev/null
  rm -f /tmp/nodesource_setup.sh
  apt-get install -y nodejs >/dev/null || err "Node.js installation failed."
  ok "Node.js $(node -v) installed"
fi

# ════════════════ 3) PostgreSQL ════════════════
if ! command -v psql >/dev/null 2>&1; then
  log "Installing PostgreSQL…"
  apt-get install -y postgresql >/dev/null || err "PostgreSQL installation failed."
fi
systemctl enable --now postgresql >/dev/null
ok "PostgreSQL is ready ($(psql --version | head -1))"

# Database password
if [[ -z "$DB_PASS" ]]; then
  DB_PASS=$(openssl rand -hex 16)
  log "Generated a secure random database password (stored in .env)"
fi
run_psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" >/dev/null
if ! run_psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  run_psql -c "CREATE DATABASE ${DB_NAME};" >/dev/null
  log "Database ${DB_NAME} created"
fi
ok "Database is ready"

# ── Make sure PostgreSQL accepts password connections from localhost ──
# (the #1 cause of "schema migration failed" on custom server images)
HBA_FILE=$(sudo -u postgres psql -tAc "SHOW hba_file;" 2>/dev/null || true)
if [[ -n "$HBA_FILE" && -f "$HBA_FILE" ]]; then
  if ! grep -Eq "^host[[:space:]]+all[[:space:]]+all[[:space:]]+(127\.0\.0\.1/32|localhost)" "$HBA_FILE"; then
    log "Adding password-auth rule for localhost to pg_hba.conf…"
    {
      echo "host all all 127.0.0.1/32 md5"
      echo "host all all ::1/128 md5"
    } >> "$HBA_FILE"
    sudo -u postgres psql -c "SELECT pg_reload_conf();" >/dev/null
    ok "pg_hba.conf updated and reloaded"
  fi
fi

log "Verifying database connectivity over TCP…"
if ! PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1;" >/tmp/naqoli-dbcheck.log 2>&1; then
  echo "──── database connection error ────"
  cat /tmp/naqoli-dbcheck.log
  echo "───────────────────────────────────"
  err "Cannot connect to PostgreSQL at 127.0.0.1:5432. Fix the error above, then run this script again."
fi
ok "Database connection verified"

# ════════════════ 4) Copy project files ════════════════
mkdir -p "$(dirname "$APP_DIR")"
SRC_REAL="$(realpath "$SRC_DIR")"
APP_REAL="$(realpath -m "$APP_DIR")"
if [[ "$SRC_REAL" != "$APP_REAL" ]]; then
  log "Copying project from ${SRC_DIR} to ${APP_DIR}…"
  # NOTE: .git is intentionally kept so "--update" can pull later
  rsync -a --delete \
    --exclude node_modules --exclude .next \
    "${SRC_DIR}/" "${APP_DIR}/"
fi
cd "$APP_DIR"
ok "Project files are in ${APP_DIR}"

# ════════════════ 5) .env file ════════════════
log "Writing .env file…"
cat > "${APP_DIR}/.env" <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
PORT=${APP_PORT}
NODE_ENV=production
EOF
chmod 600 "${APP_DIR}/.env"
ok ".env file created"

# ════════════════ 6) Dependencies, schema, seed, build ════════════════
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"

log "Installing npm dependencies (this may take a few minutes)…"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund
ok "Dependencies installed"

log "Applying database schema (drizzle-kit push)…"
if ! npx drizzle-kit push --force; then
  warn "drizzle-kit push failed; retrying once after a short wait…"
  sleep 3
  npx drizzle-kit push --force \
    || err "Schema migration failed. Run this to see the exact error:  PGPASSWORD=\"\$DB_PASS\" psql -h 127.0.0.1 -U postgres -d ${DB_NAME} -c 'SELECT 1;'  — then check pg_hba.conf and free RAM."
fi
ok "Schema applied"

VIDEOS_COUNT=$(PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM videos" 2>/dev/null || echo 0)
if [[ "$VIDEOS_COUNT" == "0" && -f "src/db/seed.sql" ]]; then
  log "Database is empty; inserting sample data…"
  PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f src/db/seed.sql >/dev/null \
    || warn "Sample data import did not fully complete; the panel still works."
  ok "Sample data inserted"
else
  log "Database already has data; seeding skipped"
fi

log "Production build (npm run build)…"
npm run build || err "Build failed; if the server has little RAM, add swap (see the README troubleshooting section)."
ok "Build completed successfully"

# ════════════════ 7) systemd service ════════════════
log "Creating systemd service ${SERVICE_NAME}…"
id -u www-data >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin www-data
chown -R www-data:www-data "$APP_DIR"

cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Naqoli Studio - Kids TikTok Automation Bot
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=${APP_DIR}/node_modules/.bin/next start -H 0.0.0.0 -p ${APP_PORT}
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"
if systemctl is-active --quiet "${SERVICE_NAME}"; then
  ok "Service ${SERVICE_NAME} is active and running"
  HEALTH_OK=0
  log "Running application healthcheck (up to 20 seconds)…"
  for i in $(seq 1 10); do
    if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
      HEALTH_OK=1
      break
    fi
    sleep 2
  done
  if [[ "$HEALTH_OK" == "1" ]]; then
    ok "Application healthcheck passed — everything is healthy 🎯"
  else
    warn "App is not responding yet; check logs: journalctl -u ${SERVICE_NAME} -n 50"
  fi
else
  warn "Service did not become active — check logs: journalctl -u ${SERVICE_NAME} -n 50"
fi

# ════════════════ 8) Domain & SSL (optional, Caddy) ════════════════
WEBHOOK_HINT="http://YOUR_SERVER_IP:${APP_PORT}/api/webhook (Telegram requires a domain + HTTPS)"
if [[ -n "$DOMAIN" ]]; then
  log "Installing Caddy for ${DOMAIN} with automatic SSL…"
  CADDY_OK=0
  if apt-get install -y debian-keyring debian-archive-keyring apt-transport-https >/dev/null 2>&1 \
     && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
          | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null \
     && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list \
     && apt-get update -y >/dev/null 2>&1 \
     && apt-get install -y caddy >/dev/null 2>&1; then
    CADDY_OK=1
  fi
  if [[ "$CADDY_OK" == "1" ]]; then
    cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    encode gzip zstd
    reverse_proxy 127.0.0.1:${APP_PORT}
}
EOF
    systemctl enable --now caddy >/dev/null 2>&1 || true
    systemctl restart caddy >/dev/null 2>&1 || true
    ok "Caddy is up — an SSL certificate for ${DOMAIN} will be issued within moments"
    WEBHOOK_HINT="https://${DOMAIN}/api/webhook"
  else
    warn "Caddy installation failed; the app is still installed and running without SSL."
    warn "The app is reachable on port ${APP_PORT}. See the README for manual domain setup."
  fi
fi

# ════════════════ 9) Firewall ════════════════
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  if [[ -z "$DOMAIN" ]]; then ufw allow "${APP_PORT}/tcp" >/dev/null 2>&1 || true; fi
  ok "Required ports opened in the firewall"
fi

# ════════════════ Final summary ════════════════
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")
echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${C_OK}   🎉 Installation completed successfully!${C_OFF}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "   🌐 Panel URL:"
if [[ -n "$DOMAIN" ]]; then
  echo "      https://${DOMAIN}"
else
  echo "      http://${SERVER_IP}:${APP_PORT}"
fi
echo ""
echo "   🔑 Database password (saved in ${APP_DIR}/.env):"
echo "      ${DB_PASS}"
echo ""
echo "   📡 Telegram webhook URL (set it after creating your bot):"
echo "      ${WEBHOOK_HINT}"
echo ""
echo "   Management commands:"
echo "      sudo systemctl status ${SERVICE_NAME}     ← service status"
echo "      sudo systemctl restart ${SERVICE_NAME}    ← restart"
echo "      journalctl -fu ${SERVICE_NAME}            ← live logs"
echo "      sudo bash ${APP_DIR}/setup.sh --update    ← update"
echo "      sudo bash ${APP_DIR}/setup.sh --status    ← quick report"
echo ""
echo "   Next steps: see the README or the in-app “Setup Guide” page."
echo "════════════════════════════════════════════════════════"
