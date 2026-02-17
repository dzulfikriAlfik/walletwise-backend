# WalletWise Backend — Build on Ubuntu Server

Complete guide for building and running WalletWise backend on Ubuntu server.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Install Node.js](#2-install-nodejs)
3. [Install PostgreSQL](#3-install-postgresql)
4. [Clone & Setup Project](#4-clone--setup-project)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Setup](#6-database-setup)
7. [Build & Run](#7-build--run)
8. [Production (Optional)](#8-production-optional)

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
# Update package list
sudo apt update

# Install curl if not present
sudo apt install -y curl

# Add Node.js 22.x repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node -v   # Should show v22.x.x
npm -v
```

### Option B: NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# Install Node.js 22
nvm install 22
nvm use 22

# Verify
node -v
```

---

## 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database (run as postgres user)
sudo -u postgres psql
```

Inside `psql`:

```sql
-- Create user
CREATE USER walletwise_user WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE walletwise_prod OWNER walletwise_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE walletwise_prod TO walletwise_user;

-- For Prisma migrations (schema ownership)
\c walletwise_prod
GRANT ALL ON SCHEMA public TO walletwise_user;

\q
```

---

## 4. Clone & Setup Project

```bash
# Create app directory (adjust path as needed)
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Clone repository
git clone https://github.com/dzulfikriAlfik/walletwise-backend.git
cd walletwise-backend

# Install dependencies
npm install
```

---

## 5. Environment Configuration

```bash
# Copy env template
cp .env.example .env

# Edit .env
nano .env
```

Fill `.env` for **production**:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=walletwise_user
DB_PASSWORD=your_secure_password
DB_NAME=walletwise_prod

# Server
NODE_ENV=production
PORT=3000

# JWT (MUST change to a strong random string!)
JWT_SECRET=generate_strong_secret_min_32_chars
JWT_REFRESH_SECRET=generate_another_strong_secret_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS - set to your frontend domain(s)
CORS_ORIGIN=https://walletwise.example.com,https://api.walletwise.example.com

# Logger
LOG_LEVEL=info
```

**Generate JWT secret:**

```bash
# Example: generate 64-char secret
openssl rand -base64 48
```

---

## 6. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (production)
npx prisma migrate deploy

# (Optional) Seed initial data
npm run prisma:seed
```

---

## 7. Build & Run

```bash
# Build TypeScript to JavaScript
npm run build

# Start application
npm start
```

Server runs at `http://localhost:3000`. Check endpoint:

```bash
curl http://localhost:3000/health
```

---

## 8. Production (Optional)

### 8.1 Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start app with PM2
cd /var/www/walletwise-backend
pm2 start dist/src/index.js --name walletwise-api

# Save config for auto-restart on reboot
pm2 save
pm2 startup
```

### 8.2 ecosystem.config.js (PM2)

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'walletwise-api',
    script: 'dist/src/index.js',
    cwd: '/var/www/walletwise-backend',
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

### 8.3 Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/walletwise-api
```

Contents:

```nginx
server {
    listen 80;
    server_name api.walletwise.example.com;

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/walletwise-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8.4 SSL with Let's Encrypt (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.walletwise.example.com
```

---

## Quick Reference — Build Pipeline

```bash
# Full sequence from scratch
cd /var/www/walletwise-backend
npm install
cp .env.example .env
# Edit .env with your configuration

npm run prisma:generate
npx prisma migrate deploy
npm run build
npm start
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Node version not supported` | Upgrade Node.js to 20.19+ or 22.12+ |
| `Cannot find module '@prisma/client'` | Run `npm run prisma:generate` |
| `Connection refused` (database) | Check PostgreSQL: `sudo systemctl status postgresql` |
| `Environment variable not found` | Ensure `.env` exists and has all required variables |
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
