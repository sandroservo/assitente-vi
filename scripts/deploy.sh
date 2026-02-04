#!/bin/bash
# Deploy da Assistente Vi para o servidor
# Domínio: vi.amovidas.com.br
# Uso: a partir da pasta assistente-vi: bash scripts/deploy.sh
# Ou da raiz do repo: bash assistente-vi/scripts/deploy.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_USER="root"
SERVER_IP="24.144.95.220"
SERVER_PORT="22"
# No servidor: repositório clonado com pasta assistente-vi (ou só a assistente)
SERVER_DIR="/www/vi-amovidas"
APP_SUBDIR="assistente-vi"
SERVICE_NAME="assistente-vi-app"
PORT="3001"

# Diretório do script: pode ser assistente-vi ou assistente-vi/scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"/assistente-vi/scripts" ]]; then
  ASSISTENTE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
  # Se assistente-vi tem seu próprio .git, usar como REPO_ROOT (deploy do repo assistente-vi)
  if [ -d "$ASSISTENTE_DIR/.git" ]; then
    REPO_ROOT="$ASSISTENTE_DIR"
  else
    REPO_ROOT="$(cd "$ASSISTENTE_DIR/.." && pwd)"
  fi
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  ASSISTENTE_DIR="$REPO_ROOT"
fi

echo -e "${BLUE}"
echo "=========================================="
echo "  Assistente Vi - Deploy (vi.amovidas.com.br)"
echo "=========================================="
echo -e "${NC}"

# Verificar se estamos na pasta assistente-vi (tem package.json e next.config)
if [ ! -f "$ASSISTENTE_DIR/package.json" ] || [ ! -f "$ASSISTENTE_DIR/next.config.ts" ]; then
  echo -e "${RED}❌ Execute a partir da pasta assistente-vi ou da raiz do repositório amovidas.${NC}"
  exit 1
fi

# Verificar git e SSH
if ! command -v git >/dev/null 2>&1; then
  echo -e "${RED}❌ git não encontrado.${NC}"
  exit 1
fi
if ! ssh -p "$SERVER_PORT" -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo OK" >/dev/null 2>&1; then
  echo -e "${RED}❌ Não foi possível conectar ao servidor ${SERVER_IP}.${NC}"
  exit 1
fi

# Verificar alterações não commitadas (na raiz do repo)
if [ -d "$REPO_ROOT/.git" ]; then
  if [ -n "$(cd "$REPO_ROOT" && git status --porcelain --untracked-files=no)" ]; then
    echo -e "${RED}❌ Há alterações não commitadas no repositório. Faça commit ou stash antes do deploy.${NC}"
    cd "$REPO_ROOT" && git status --short
    exit 1
  fi
fi

echo -e "${YELLOW}📤 Enviando código e fazendo deploy no servidor...${NC}"

ssh -p "$SERVER_PORT" "${SERVER_USER}@${SERVER_IP}" bash -s <<EOSSH
set -e
# Se SERVER_DIR não existir, clonar o repo (primeira vez)
if [ ! -d "$SERVER_DIR" ]; then
  echo "Diretório $SERVER_DIR não existe. Configure primeiro:"
  echo "  ssh ${SERVER_USER}@${SERVER_IP}"
  echo "  git clone <URL_DO_REPOSITORIO> $SERVER_DIR"
  echo "  cd $SERVER_DIR/$APP_SUBDIR && cp .env.example .env && nano .env"
  echo "  sudo cp $SERVER_DIR/$APP_SUBDIR/scripts/assistente-vi-app.service /etc/systemd/system/"
  echo "  sudo systemctl daemon-reload && sudo systemctl enable assistente-vi-app"
  exit 1
fi

cd "$SERVER_DIR" || exit 1
if [ ! -d .git ]; then
  echo "❌ $SERVER_DIR não é um repositório git. Clone o repositório primeiro:"
  echo "   git clone https://github.com/sandroservo/assitente-vi.git $SERVER_DIR"
  exit 1
fi
if [ -n "\$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  git stash push -m "Deploy assistente \$(date +%Y%m%d_%H%M%S)" || true
fi
git fetch --all
git pull origin main || true

# App na raiz do clone (assistente-vi repo) ou em subpasta assistente-vi (monorepo)
if [ -f "$SERVER_DIR/package.json" ] && [ -f "$SERVER_DIR/next.config.ts" ]; then
  APP_DIR="$SERVER_DIR"
else
  APP_DIR="$SERVER_DIR/$APP_SUBDIR"
fi
cd "\$APP_DIR" || exit 1
if [ ! -f .env ]; then
  echo "⚠️  .env não encontrado em \$APP_DIR. Crie a partir de .env.example"
  exit 1
fi

echo "📦 Instalando dependências..."
npm ci --omit=dev || npm install --omit=dev

echo "🔨 Build..."
npm run build

echo "🔄 Reiniciando serviço $SERVICE_NAME..."
sudo systemctl restart $SERVICE_NAME || true

sleep 3
if curl -sf "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
  echo "✅ Assistente respondendo em http://127.0.0.1:$PORT"
else
  echo "⚠️  Verifique: sudo journalctl -u $SERVICE_NAME -n 50"
fi
EOSSH

echo -e "${GREEN}"
echo "=========================================="
echo "  Deploy concluído"
echo "=========================================="
echo -e "${NC}"
echo "URL: https://vi.amovidas.com.br"
echo ""
echo -e "${YELLOW}Se o site não abrir:${NC} no servidor configure Nginx + SSL (uma vez):"
echo "  ssh ${SERVER_USER}@${SERVER_IP}"
echo "  cd $SERVER_DIR/$APP_SUBDIR && sudo bash scripts/setup-site-vi.sh"
echo "  (Antes: DNS vi.amovidas.com.br → ${SERVER_IP} e certificado: certbot --webroot -w /var/www/certbot -d vi.amovidas.com.br)"
echo ""
