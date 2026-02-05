# Deploy da Assistente Vi (vi.amovidas.com.br)

Deploy no mesmo servidor do sistema Amo Vidas.

## Pré-requisitos no servidor

1. **Node.js** (>= 22.12.0, conforme `package.json`)
2. **PostgreSQL** (pode ser o mesmo do sistema, com outro database, ex: `amovidas_vi`)
3. **Nginx** (para proxy e SSL)
4. **Certificado SSL** para `vi.amovidas.com.br` (Let's Encrypt)

## Primeira vez no servidor

### 1. Clonar o repositório

```bash
ssh root@24.144.95.220
mkdir -p /www
cd /www
git clone <URL_DO_REPOSITORIO_AMOVIDAS> vi-amovidas
cd vi-amovidas/assistente-vi
```

### 2. Criar `.env`

```bash
cp .env.example .env
nano .env
```

Preencha pelo menos:

- `DATABASE_URL` – PostgreSQL (pode criar um DB `amovidas_vi`)
- **`AUTH_SECRET`** – gere com: `openssl rand -base64 32` (obrigatório para login em produção; o código também aceita `NEXTAUTH_SECRET`)
- **`AUTH_URL=https://vi.amovidas.com.br`** – URL pública do site (obrigatório em produção para o login não redirecionar para localhost; se usar proxy, o código já usa `trustHost: true`)

### 3. Rodar migrações e seed (se necessário)

```bash
npx prisma migrate deploy
npm run build
# Opcional: seed admin/knowledge
# npx tsx scripts/seed-admin.ts
```

### 4. Instalar e ativar o serviço systemd

```bash
sudo cp scripts/assistente-vi-app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable assistente-vi-app
sudo systemctl start assistente-vi-app
sudo systemctl status assistente-vi-app
```

### 5. Configurar Nginx

- Copie o conteúdo de `scripts/nginx-vi.amovidas.conf` para o Nginx (dentro do `http` ou em um arquivo em `conf.d/`).
- Ajuste os caminhos do SSL se precisar.

### 6. Certificado SSL para vi.amovidas.com.br

Antes do HTTPS funcionar, o DNS de `vi.amovidas.com.br` deve apontar para o IP do servidor. Depois:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d vi.amovidas.com.br
sudo nginx -t && sudo systemctl reload nginx
```

## Deploy contínuo (a partir da sua máquina)

Na pasta **assistente-vi** (ou na raiz do repo amovidas):

```bash
bash scripts/deploy.sh
```

O script vai:

1. Conectar no servidor
2. Fazer `git pull` em `/www/vi-amovidas`
3. Em `assistente-vi`: `npm ci`, `npm run build`, reiniciar o serviço `assistente-vi-app`

## URLs

- Produção: **https://vi.amovidas.com.br**
- Serviço no servidor: `http://127.0.0.1:3001`

## Comandos úteis no servidor

```bash
# Logs da assistente
sudo journalctl -u assistente-vi-app -f

# Reiniciar
sudo systemctl restart assistente-vi-app

# Status
sudo systemctl status assistente-vi-app
curl -I http://127.0.0.1:3001
```
