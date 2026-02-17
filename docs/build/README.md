# Build Documentation

Build and deploy documentation for WalletWise backend.

## Documents

| File | Description |
|------|-------------|
| [ubuntu-build-guide.md](./ubuntu-build-guide.md) | Complete build guide for Ubuntu Server |

## Quick Summary

```bash
# Prerequisites: Node.js 22+, PostgreSQL 14+
npm install
cp .env.example .env   # Edit .env
npm run prisma:generate
npx prisma migrate deploy
npm run build
npm start
```
