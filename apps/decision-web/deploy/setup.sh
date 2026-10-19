#!/bin/bash
# decision.aurict.com — sunucu kurulum scripti
# Repo checkout'u içinden çalıştırılır: ~/aurict/apps/decision-web/deploy/setup.sh
# Gereksinimler: bun, pm2, apache2 (mod_proxy, mod_rewrite), certbot

set -e

DOMAIN="decision.aurict.com"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Bağımlılıklar kuruluyor..."
cd "$APP_DIR"
bun install

echo "==> Build alınıyor..."
bun run build

echo "==> PM2 başlatılıyor..."
pm2 start "$APP_DIR/ecosystem.config.js" --env production
pm2 save

echo "==> Apache config kopyalanıyor..."
sudo cp "$APP_DIR/deploy/apache.conf" /etc/apache2/sites-available/decision-aurict.conf
sudo a2ensite decision-aurict.conf
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
sudo systemctl reload apache2

echo ""
echo "✓ Kurulum tamamlandı!"
echo "  SSL için: sudo certbot --apache -d $DOMAIN"
echo "  Loglar  : pm2 logs decision-aurict-web"
