#!/bin/bash
# Configura Nginx + SSL para vi.amovidas.com.br (rodar NO SERVIDOR, uma vez).
# Pré-requisito: DNS de vi.amovidas.com.br apontando para o IP do servidor (24.144.95.220).
#
# No servidor:
#   cd /www/vi-amovidas/assistente-vi
#   sudo bash scripts/setup-site-vi.sh
#
# Ou da sua máquina (via SSH):
#   ssh root@24.144.95.220 'cd /www/vi-amovidas/assistente-vi && sudo bash scripts/setup-site-vi.sh'

set -euo pipefail

DOMAIN="vi.amovidas.com.br"
NGINX_CONF="/etc/nginx/conf.d/vi.amovidas.conf"
SOURCE_CONF="$(dirname "$0")/nginx-vi.amovidas.conf"

if [ ! -f "$SOURCE_CONF" ]; then
  echo "Arquivo não encontrado: $SOURCE_CONF"
  echo "Execute a partir de /www/vi-amovidas/assistente-vi (ou onde está o script)."
  exit 1
fi

echo "=== Configurando site $DOMAIN ==="

# 1. Copiar config do Nginx
echo "Copiando config Nginx para $NGINX_CONF ..."
cp "$SOURCE_CONF" "$NGINX_CONF"

# 2. Certificado SSL (se não existir)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "Certificado SSL não encontrado."
  echo "Crie o certificado antes (DNS de $DOMAIN deve apontar para este servidor):"
  echo "  sudo mkdir -p /var/www/certbot"
  echo "  sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email admin@amovidas.com.br"
  echo ""
  echo "Depois execute este script de novo: sudo bash scripts/setup-site-vi.sh"
  exit 1
fi

# 3. Testar e recarregar Nginx
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "✅ Nginx recarregado. Site: https://$DOMAIN"
else
  echo "❌ Erro no config do Nginx. Rode: sudo nginx -t"
  exit 1
fi
