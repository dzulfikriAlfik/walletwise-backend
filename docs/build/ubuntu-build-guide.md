# WalletWise Backend — Build on Ubuntu Server

Complete guide for building and running WalletWise backend on Ubuntu server, from scratch.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Install Node.js](#2-install-nodejs)
3. [Install PostgreSQL](#3-install-postgresql)
4. [Clone & Setup Project](#4-clone--setup-project)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Setup](#6-database-setup)
7. [Build & Run](#7-build--run)
8. [Production: PM2 & Nginx](#8-production-pm2--nginx)

---

## 1. System Requirements

| Requirement | Version |
|-------------|---------|
| Ubuntu | 20.04 LTS or 22.04 LTS |
| Node.js | 20.19+ or 22.12+ (Prisma 7) |
| PostgreSQL | 14+ |
| Git | 2.x |
| Memory | Min. 512MB RAM |

---

## 2. Install Node.js

### Option A: NodeSource (recommended)

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # v22.x.x
npm -v
```

### Option B: NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

---

## 3. Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create user and database:

```bash
sudo -u postgres psql
```

```sql
CREATE USER walletwise_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE walletwise OWNER walletwise_user;
GRANT ALL PRIVILEGES ON DATABASE walletwise TO walletwise_user;

\c walletwise
GRANT ALL ON SCHEMA public TO walletwise_user;

\q
```

---

## 4. Clone & Setup Project

```bash
# Create directory (using domain as folder name)
sudo mkdir -p /var/www/walletwise-backend.pintarware.com
sudo chown $USER:$USER /var/www/walletwise-backend.pintarware.com
cd /var/www/walletwise-backend.pintarware.com

# Clone
git clone https://github.com/dzulfikriAlfik/walletwise-backend.git .

# Install dependencies (include devDependencies for build)
npm install
```

---

## 5. Environment Configuration

```bash
cp .env.example .env
nano .env
```

Production `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=walletwise_user
DB_PASSWORD=your_secure_password
DB_NAME=walletwise

# Server
NODE_ENV=production
PORT=3000

# JWT (generate: openssl rand -base64 48)
JWT_SECRET=your_strong_secret_min_32_chars
JWT_REFRESH_SECRET=another_strong_secret_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS - your frontend domain(s)
CORS_ORIGIN=https://walletwise.pintarware.com

# Logger
LOG_LEVEL=info
```

---

## 6. Database Setup

```bash
cd /var/www/walletwise-backend.pintarware.com

npm run prisma:generate
npx prisma migrate deploy

# Optional: seed
npm run prisma:seed
```

---

## 7. Build & Run

```bash
cd /var/www/walletwise-backend.pintarware.com

npm run build
npm start
```

Test:

```bash
curl http://localhost:3000/health
```

---

## 8. Production: PM2 & Nginx

### 8.1 Cleanup (if re-installing)

If you already have a previous deployment (e.g. site in sites-enabled), remove it first:

```bash
# Remove Nginx site
sudo rm -f /etc/nginx/sites-enabled/walletwise-backend.pintarware.com
sudo rm -f /etc/nginx/sites-available/walletwise-backend.pintarware.com
sudo nginx -t
sudo systemctl reload nginx

# Stop and delete PM2 app (if exists)
pm2 delete walletwise-backend 2>/dev/null || true
pm2 save
```

---

### 8.2 PM2

```bash
# Install PM2 globally (if not installed)
sudo npm install -g pm2

# Start app
cd /var/www/walletwise-backend.pintarware.com
pm2 start dist/src/index.js --name walletwise-backend

# Auto-start on reboot
pm2 save
pm2 startup
```

**PM2 commands:**

```bash
pm2 status
pm2 logs walletwise-backend
pm2 restart walletwise-backend
```

**Optional:** Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'walletwise-backend',
    script: 'dist/src/index.js',
    cwd: '/var/www/walletwise-backend.pintarware.com',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '500M',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
  }]
}
```

```bash
pm2 start ecosystem.config.js
```

---

### 8.3 Nginx

```bash
# Install Nginx (if not installed)
sudo apt install -y nginx

# Create site config
sudo nano /etc/nginx/sites-available/walletwise-backend.pintarware.com
```

Contents:

```nginx
server {
    listen 80;
    server_name walletwise-backend.pintarware.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/walletwise-backend.pintarware.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 8.4 SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d walletwise-backend.pintarware.com
```

---

## Quick Reference — Full Sequence

```bash
# From scratch
cd /var/www/walletwise-backend.pintarware.com
npm install
cp .env.example .env
nano .env

npm run prisma:generate
npx prisma migrate deploy
npm run build

pm2 start dist/src/index.js --name walletwise-backend
pm2 save
pm2 startup
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Node version not supported` | Upgrade Node.js to 20.19+ or 22.12+ |
| `Cannot find module '@prisma/client'` | Run `npm run prisma:generate` |
| `tsc-alias: not found` | Run `npm install` (include devDependencies), then `npm run build` |
| `Cannot find package '@/config'` (ERR_MODULE_NOT_FOUND) | Run full `npm run build` (includes tsc-alias). Do not use old dist. |
| `P1000: Authentication failed` (Prisma migrate) | Verify `.env` matches PostgreSQL. Test: `psql -U walletwise_user -d walletwise -h localhost -W` |
| `Connection refused` (database) | `sudo systemctl status postgresql` |
| `Environment variable not found` | Ensure `.env` exists with all required variables |
| Port 3000 already in use | Change `PORT` in `.env` |

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port |
| `DB_USER` | Yes | Database username |
| `DB_PASSWORD` | Yes | Database password |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for access token |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh token |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: 3000) |
| `CORS_ORIGIN` | No | Allowed frontend URL(s) |
