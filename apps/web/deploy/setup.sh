#!/bin/bash
# Aurict website — sunucu kurulum scripti
# Gereksinimler: bun, pm2, apache2 (mod_proxy, mod_rewrite)

set -e

DOMAIN="aurict.com"
APP_DIR="/var/www/aurict-web"
REPO="https://github.com/aurict/aurict.git"

echo "==> Repo klonlanıyor..."
if [ -d "$APP_DIR" ]; then
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO" /tmp/aurict-clone
  mkdir -p "$APP_DIR"
  cp -r /tmp/aurict-clone/apps/web/. "$APP_DIR/"
  rm -rf /tmp/aurict-clone
fi

echo "==> Bağımlılıklar kuruluyor..."
cd "$APP_DIR"
bun install

echo "==> .env.local oluşturuluyor..."
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "RESEND_API_KEY=your_key_here" > "$APP_DIR/.env.local"
  echo "  UYARI: $APP_DIR/.env.local içine RESEND_API_KEY ekle!"
fi

echo "==> Build alınıyor..."
bun run build

echo "==> PM2 başlatılıyor..."
pm2 start "$APP_DIR/ecosystem.config.js" --env production
pm2 save

echo "==> Apache config kopyalanıyor..."
cp "$APP_DIR/deploy/apache.conf" /etc/apache2/sites-available/aurict.conf
a2ensite aurict.conf
a2enmod proxy proxy_http proxy_wstunnel rewrite
systemctl reload apache2

echo ""
echo "✓ Kurulum tamamlandı!"
echo "  SSL için: certbot --apache -d $DOMAIN"
echo "  Loglar  : pm2 logs aurict-web"
