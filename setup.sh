#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#   🤖 اسکریپت راه‌انداز «نقلی‌استودیو» — نسخه ۲.۴.۱
#   ربات خودکار تولید و انتشار ویدئوی کودک در تیک‌تاک
#
#   سیستم‌عامل: Ubuntu 20.04+ / Debian 11+
#
#   نصب کامل:
#     sudo bash setup.sh
#     sudo bash setup.sh --domain example.com   ← با دامنه و SSL خودکار
#   سایر:
#     sudo bash setup.sh --port 8080            ← پورت دلخواه
#     sudo bash setup.sh --update               ← به‌روزرسانی و بیلد مجدد
#     sudo bash setup.sh --status               ← وضعیت سرویس
# ════════════════════════════════════════════════════════════════
set -euo pipefail

# ──────────── تنظیمات پیش‌فرض (با فلگ قابل تغییرند) ────────────
APP_NAME="naqoli-studio"
APP_DIR="/var/www/${APP_NAME}"
DB_NAME="app_db"
DB_USER="postgres"
DB_PASS=""                      # خالی = تصادفی امن ساخته می‌شود
APP_PORT=3000
DOMAIN=""                       # خالی = بدون دامنه/SSL
NODE_MAJOR=22
SERVICE_NAME="naqoli"
ACTION="install"

# ──────────── خروجی رنگی ────────────
C_OK="\033[1;32m"; C_INFO="\033[1;36m"; C_WARN="\033[1;33m"; C_ERR="\033[1;31m"; C_OFF="\033[0m"
log()  { echo -e "${C_INFO}🤖 [نقلی]${C_OFF} $1"; }
ok()   { echo -e "${C_OK}✅${C_OFF} $1"; }
warn() { echo -e "${C_WARN}⚠️${C_OFF} $1"; }
err()  { echo -e "${C_ERR}❌ $1${C_OFF}" >&2; exit 1; }

# ──────────── خواندن فلگ‌ها ────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="$2"; shift 2 ;;
    --port)    APP_PORT="$2"; shift 2 ;;
    --app-dir) APP_DIR="$2"; shift 2 ;;
    --db-pass) DB_PASS="$2"; shift 2 ;;
    --update)  ACTION="update"; shift ;;
    --status)  ACTION="status"; shift ;;
    -h|--help) ACTION="help"; shift ;;
    *) err "فلگ ناشناخته: $1 (از --help استفاده کنید)" ;;
  esac
done

if [[ "$ACTION" == "help" ]]; then
  echo "استفاده: sudo bash setup.sh [گزینه‌ها]"
  echo ""
  echo "  --domain DOMAIN    دامنه شما (نصب خودکار Caddy + SSL رایگان)"
  echo "  --port PORT        پورت اپلیکیشن (پیش‌فرض: 3000)"
  echo "  --app-dir DIR      محل نصب (پیش‌فرض: /var/www/naqoli-studio)"
  echo "  --db-pass PASS     رمز دیتابیس (پیش‌فرض: تصادفی امن)"
  echo "  --update           به‌روزرسانی کد، بیلد مجدد و ری‌استارت"
  echo "  --status           وضعیت سرویس و لاگ‌های اخیر"
  exit 0
fi

# ──────────── حالت وضعیت ────────────
if [[ "$ACTION" == "status" ]]; then
  systemctl status "${SERVICE_NAME}" --no-pager || true
  echo ""
  echo "─── ۱۰ خط آخر لاگ ───"
  journalctl -u "${SERVICE_NAME}" -n 10 --no-pager || true
  exit 0
fi

[[ "$(id -u)" == "0" ]] || err "اسکریپت باید با دسترسی روت اجرا شود:  sudo bash setup.sh"

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

run_psql() { sudo -u postgres psql "$@"; }

echo ""
echo "════════════════════════════════════════════"
echo "   🤖 راه‌انداز نقلی‌استودیو — نسخه ۲.۴.۱"
echo "════════════════════════════════════════════"
echo ""

# ════════════════ حالت به‌روزرسانی ════════════════
if [[ "$ACTION" == "update" ]]; then
  [[ -d "$APP_DIR" ]] || err "پروژه در ${APP_DIR} پیدا نشد؛ اول نصب کامل را اجرا کنید."
  cd "$APP_DIR"
  git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  if [[ -d .git ]]; then
    log "دریافت آخرین تغییرات از گیت…"
    git pull --ff-only || warn "git pull ناموفق بود؛ از کد فعلی استفاده می‌شود."
  fi
  log "نصب وابستگی‌ها…"
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
  log "اعمال تغییرات احتمالی اسکیما…"
  set -a; [[ -f .env ]] && . ./.env; set +a
  npx drizzle-kit push --force || warn "drizzle-kit push انجام نشد (اگر اسکیما تغییری نکرده مهم نیست)"
  log "بیلد پروداکشن…"
  npm run build
  chown -R www-data:www-data "$APP_DIR"
  log "ری‌استارت سرویس…"
  systemctl restart "${SERVICE_NAME}"
  ok "به‌روزرسانی کامل شد! وضعیت: systemctl status ${SERVICE_NAME}"
  exit 0
fi

# ════════════════ ۱) پیش‌نیازها ════════════════
log "نصب پکیج‌های پایه (apt)…"
apt-get update -y >/dev/null || warn "apt-get update با خطا مواجه شد؛ ادامه می‌دهیم…"
apt-get install -y curl ca-certificates gnupg git rsync openssl >/dev/null \
  || err "نصب پکیج‌های پایه ناموفق بود؛ اتصال اینترنت سرور را بررسی کنید."
ok "پکیج‌های پایه نصب شدند"

# ════════════════ ۲) Node.js ════════════════
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  CUR_MAJOR=$(node -p "parseInt(process.versions.node)" 2>/dev/null || echo 0)
  [[ "$CUR_MAJOR" -ge 20 ]] && NEED_NODE=0 && ok "Node.js $(node -v) از قبل موجود است"
fi
if [[ "$NEED_NODE" == "1" ]]; then
  log "نصب Node.js ${NODE_MAJOR}…"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh \
    || err "دانلود مخزن NodeSource ممکن نشد؛ اتصال اینترنت سرور را بررسی کنید."
  bash /tmp/nodesource_setup.sh >/dev/null
  rm -f /tmp/nodesource_setup.sh
  apt-get install -y nodejs >/dev/null || err "نصب Node.js ناموفق بود."
  ok "Node.js $(node -v) نصب شد"
fi

# ════════════════ ۳) PostgreSQL ════════════════
if ! command -v psql >/dev/null 2>&1; then
  log "نصب PostgreSQL…"
  apt-get install -y postgresql >/dev/null || err "نصب PostgreSQL ناموفق بود."
fi
systemctl enable --now postgresql >/dev/null
ok "PostgreSQL آماده است ($(psql --version | head -1))"

# رمز دیتابیس
if [[ -z "$DB_PASS" ]]; then
  DB_PASS=$(openssl rand -hex 16)
  log "یک رمز امن تصادفی برای دیتابیس ساخته شد (در .env ذخیره می‌شود)"
fi
run_psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" >/dev/null
if ! run_psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  run_psql -c "CREATE DATABASE ${DB_NAME};" >/dev/null
  log "دیتابیس ${DB_NAME} ساخته شد"
fi
ok "دیتابیس آماده است"

# ════════════════ ۴) کپی کد پروژه ════════════════
mkdir -p "$(dirname "$APP_DIR")"
SRC_REAL="$(realpath "$SRC_DIR")"
APP_REAL="$(realpath -m "$APP_DIR")"
if [[ "$SRC_REAL" != "$APP_REAL" ]]; then
  log "کپی پروژه از ${SRC_DIR} به ${APP_DIR}…"
  rsync -a --delete \
    --exclude node_modules --exclude .next --exclude .git \
    "${SRC_DIR}/" "${APP_DIR}/"
fi
cd "$APP_DIR"
ok "کد پروژه در ${APP_DIR} قرار گرفت"

# ════════════════ ۵) فایل .env ════════════════
log "ساخت فایل .env…"
cat > "${APP_DIR}/.env" <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
PORT=${APP_PORT}
NODE_ENV=production
EOF
chmod 600 "${APP_DIR}/.env"
ok "فایل .env ساخته شد"

# ════════════════ ۶) وابستگی‌ها، اسکیما، سید، بیلد ════════════════
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"

log "نصب وابستگی‌های npm (ممکن است چند دقیقه طول بکشد)…"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund
ok "وابستگی‌ها نصب شدند"

log "اعمال اسکیما دیتابیس (drizzle-kit push)…"
npx drizzle-kit push --force || err "اعمال اسکیما ناموفق بود؛ لاگ‌های بالا را بررسی کنید."
ok "اسکیما اعمال شد"

VIDEOS_COUNT=$(PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM videos" 2>/dev/null || echo 0)
if [[ "$VIDEOS_COUNT" == "0" && -f "src/db/seed.sql" ]]; then
  log "دیتابیس خالی است؛ داده‌های نمونه درج می‌شوند…"
  PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f src/db/seed.sql >/dev/null \
    || warn "درج داده‌های نمونه کامل نشد؛ پنل همچنان کار می‌کند."
  ok "داده‌های نمونه افزوده شد"
else
  log "دیتابیس دارای داده است؛ سید رد شد"
fi

log "بیلد پروداکشن (npm run build)…"
npm run build || err "بیلد ناموفق بود؛ اگر رم سرور کم است، سواپ بسازید (راهنما در صفحه آموزش)."
ok "بیلد با موفقیت انجام شد"

# ════════════════ ۷) سرویس سیستمی (systemd) ════════════════
log "ساخت سرویس سیستمی ${SERVICE_NAME}…"
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
sleep 3
if systemctl is-active --quiet "${SERVICE_NAME}"; then
  ok "سرویس ${SERVICE_NAME} فعال و در حال اجراست"
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    ok "هلث‌چک اپلیکیشن پاسخ داد — همه‌چیز سالم است 🎯"
  else
    warn "اپ هنوز بالا نیامده؛ چند لحظه صبر کنید و دوباره /api/health را چک کنید."
  fi
else
  warn "سرویس فعال نشد — لاگ‌ها را ببینید: journalctl -u ${SERVICE_NAME} -n 50"
fi

# ════════════════ ۸) دامنه و SSL (اختیاری با Caddy) ════════════════
WEBHOOK_HINT="http://YOUR_SERVER_IP:${APP_PORT}/api/webhook (برای تلگرام به دامنه و HTTPS نیاز دارید)"
if [[ -n "$DOMAIN" ]]; then
  log "نصب Caddy برای دامنه ${DOMAIN} و صدور گواهی SSL خودکار…"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https >/dev/null 2>&1 || true
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y >/dev/null
  apt-get install -y caddy >/dev/null || err "نصب Caddy ناموفق بود."

  cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    encode gzip zstd
    reverse_proxy 127.0.0.1:${APP_PORT}
}
EOF
  systemctl enable --now caddy
  systemctl restart caddy
  ok "Caddy فعال شد — ظرف چند لحظه گواهی SSL برای ${DOMAIN} صادر می‌شود"
  WEBHOOK_HINT="https://${DOMAIN}/api/webhook"
fi

# ════════════════ ۹) فایروال ════════════════
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  if [[ -z "$DOMAIN" ]]; then ufw allow "${APP_PORT}/tcp" >/dev/null 2>&1 || true; fi
  ok "پورت‌های لازم در فایروال باز شدند"
fi

# ════════════════ خلاصه پایانی ════════════════
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")
echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${C_OK}   🎉 نصب با موفقیت کامل شد!${C_OFF}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "   🌐 آدرس پنل:"
if [[ -n "$DOMAIN" ]]; then
  echo "      https://${DOMAIN}"
else
  echo "      http://${SERVER_IP}:${APP_PORT}"
fi
echo ""
echo "   🔑 رمز دیتابیس شما (در ${APP_DIR}/.env ذخیره شده):"
echo "      ${DB_PASS}"
echo ""
echo "   📡 آدرس وب‌هوک تلگرام (بعد از ساخت ربات در پنل وارد کنید):"
echo "      ${WEBHOOK_HINT}"
echo ""
echo "   دستورات مدیریتی:"
echo "      sudo systemctl status ${SERVICE_NAME}     ← وضعیت سرویس"
echo "      sudo systemctl restart ${SERVICE_NAME}    ← ری‌استارت"
echo "      journalctl -fu ${SERVICE_NAME}            ← لاگ زنده"
echo "      sudo bash ${APP_DIR}/setup.sh --update    ← به‌روزرسانی"
echo "      sudo bash ${APP_DIR}/setup.sh --status    ← گزارش سریع"
echo ""
echo "   مراحل بعدی را در صفحه «آموزش راه‌اندازی» داخل پنل ببینید."
echo "════════════════════════════════════════════════════════"
