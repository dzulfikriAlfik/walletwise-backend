# WalletWise Backend

RESTful API for the WalletWise expense tracking SaaS application.

## System Design Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     WalletWise Backend (Express API)                     │
├──────────────────────────────────────────────────────────────────────────┤
│  Routes (versioned under /api/v1)                                        │
│  ├── /api/v1/auth        (register, login, refresh, profile, logout)     │
│  ├── /api/v1/wallets     (CRUD, summary)                                 │
│  ├── /api/v1/transactions (CRUD, summary)                                │
│  ├── /api/v1/categories  (CRUD custom categories, Pro/Pro Trial)         │
│  ├── /api/v1/billing     (plans, upgrade, dummy-payment)                 │
│  └── /api/v1/openapi.yaml (OpenAPI 3.1 specification)                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Middleware                                                              │
│  ├── auth.middleware (JWT validation via httpOnly cookies)               │
│  ├── validation.middleware (Zod schemas)                                 │
│  ├── logger.middleware                                                   │
│  └── error.middleware                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Prisma ORM ─────────────────────────────► PostgreSQL                    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + httpOnly cookies |
| Validation | Zod |
| Security | Helmet, bcryptjs, cookie-parser |
| CORS | Configurable origins with credentials |

## Feature List

### Core Features
- User registration & login
- JWT authentication with access + refresh tokens (httpOnly cookies)
- Token refresh & logout
- User profile (get, update) with avatar, preferred language, preferred currency
- Wallet CRUD (create, read, update, delete)
- Wallet summary (aggregate stats)
- Transaction management (CRUD)
- Transaction summary (aggregate stats)
- Category CRUD (Pro / Pro Trial) – custom income and expense categories
- Subscription tiers (free, pro_trial, pro, pro_plus)
- Billing API (plans, upgrade, dummy payment for demo)

### Subscription Rules
| Tier | Max Wallets | Custom Categories | Features |
|------|-------------|-------------------|----------|
| Free | 3 | System only | Transaction tracking, basic summary |
| Pro Trial | Unlimited (7 days) | Yes (while active) | Same as Pro, one-time trial |
| Pro | Unlimited | Yes | $9.99/mo or $99.99/yr |
| Pro+ | Unlimited | Yes | Analytics, CSV/Excel export; $19.99/mo or $199.99/yr |

## API Documentation

All endpoints are versioned under `/api/v1`. For the complete specification, see `GET /api/v1/openapi.yaml` or [docs/openapi/openapi.yaml](docs/openapi/openapi.yaml).

### Base URL
- **Local:** `http://localhost:3000/api/v1`
- **Production:** _Add base URL when deployed_

### OpenAPI 3.1 Specification
- **Spec URL:** `GET /api/v1/openapi.yaml`
- **Local:** http://localhost:3000/api/v1/openapi.yaml
- **Policy:** See [docs/API_VERSIONING.md](docs/API_VERSIONING.md) for versioning rules

### Authentication

All auth responses set `accessToken` and `refreshToken` as httpOnly cookies. Protected routes require `credentials: true` and cookies will be sent automatically.

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Password123!"
}

Response: 201
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatarUrl": null,
      "preferredLanguage": null,
      "preferredCurrency": null,
      "subscription": {
        "tier": "free",
        "isActive": true,
        "startDate": "...",
        "endDate": null
      }
    }
  }
}
```
_Tokens are set in httpOnly cookies._

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response: 200
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```
_Tokens are set in httpOnly cookies._

#### Refresh Token
```http
POST /api/v1/auth/refresh
Cookie: refreshToken=<refreshToken>

Response: 200
{
  "success": true,
  "message": "Token refreshed successfully"
}
```
_New access token is set in httpOnly cookie._

#### Get Profile
```http
GET /api/v1/auth/profile
Cookie: accessToken=<accessToken>

Response: 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "preferredLanguage": "en",
    "preferredCurrency": "USD",
    "subscription": {
      "tier": "free",
      "isActive": true,
      "startDate": "...",
      "endDate": null
    },
    "createdAt": "..."
  }
}
```

#### Update Profile
```http
PATCH /api/v1/auth/profile
Cookie: accessToken=<accessToken>
Content-Type: application/json

{
  "name": "Jane Doe",
  "avatarUrl": "https://...",
  "preferredLanguage": "id",
  "preferredCurrency": "IDR"
}

Response: 200
{ "success": true, "data": { ... } }
```

#### Logout
```http
POST /api/v1/auth/logout
Cookie: accessToken=<accessToken>

Response: 200
{
  "success": true,
  "message": "Logged out successfully"
}
```
_Cookies are cleared._

---

### Wallets

_All wallet endpoints require `Cookie: accessToken`._

#### Get Summary
```http
GET /api/v1/wallets/summary

Response: 200
{ "success": true, "data": { ... } }
```

#### Get All Wallets
```http
GET /api/v1/wallets

Response: 200
{
  "success": true,
  "data": [ ... ]
}
```

#### Get Wallet by ID
```http
GET /api/v1/wallets/:id

Response: 200
{ "success": true, "data": { ... } }
```

#### Create Wallet
```http
POST /api/v1/wallets
Content-Type: application/json

{
  "name": "My Wallet",
  "balance": 1000,
  "currency": "USD",
  "color": "#4CAF50",
  "icon": "wallet"
}

Response: 201
{ "success": true, "data": { ... } }
```

#### Update Wallet
```http
PATCH /api/v1/wallets/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "balance": 1500,
  "color": "#2196F3",
  "icon": "credit-card"
}

Response: 200
{ "success": true, "data": { ... } }
```

#### Delete Wallet
```http
DELETE /api/v1/wallets/:id

Response: 204
```

---

### Transactions

_All transaction endpoints require `Cookie: accessToken`._

#### Get Summary
```http
GET /api/v1/transactions/summary

Response: 200
{ "success": true, "data": { ... } }
```

#### Get All Transactions
```http
GET /api/v1/transactions?walletId=clx...&type=expense&category=food&startDate=2025-02-01&endDate=2025-02-28

Response: 200
{
  "success": true,
  "data": [ ... ]
}
```
_Optional query params: `walletId`, `type`, `category`, `startDate`, `endDate`._

#### Get Transaction by ID
```http
GET /api/v1/transactions/:id

Response: 200
{ "success": true, "data": { ... } }
```

#### Create Transaction
```http
POST /api/v1/transactions
Content-Type: application/json

{
  "walletId": "clx...",
  "type": "expense",
  "category": "food",
  "amount": 25.50,
  "description": "Lunch",
  "date": "2025-02-21T12:00:00.000Z"
}

Response: 201
{ "success": true, "data": { ... } }
```

#### Update Transaction
```http
PATCH /api/v1/transactions/:id
Content-Type: application/json

{
  "type": "income",
  "category": "salary",
  "amount": 3000,
  "description": "Monthly salary",
  "date": "2025-02-21T00:00:00.000Z"
}

Response: 200
{ "success": true, "data": { ... } }
```

#### Delete Transaction
```http
DELETE /api/v1/transactions/:id

Response: 204
```

---

### Billing

#### Get Plans (Public)
```http
GET /api/v1/billing/plans

Response: 200
{
  "success": true,
  "data": {
    "free": { "tier": "free", "name": "Free", "maxWallets": 3, "features": [...], ... },
    "pro": { "tier": "pro", "name": "Pro", "maxWallets": null, "features": [...], "prices": {...}, "trialDays": 7 },
    "pro_plus": { "tier": "pro_plus", "name": "Pro+", "maxWallets": null, "features": [...], "prices": {...} }
  }
}
```

#### Upgrade Subscription (Protected)
```http
POST /api/v1/billing/upgrade
Cookie: accessToken=<accessToken>
Content-Type: application/json

{
  "targetTier": "pro_trial",
  "billingPeriod": "monthly"
}

// For paid upgrade:
{
  "targetTier": "pro",
  "billingPeriod": "yearly"
}

Response: 200
{
  "success": true,
  "data": {
    "subscription": {
      "tier": "pro",
      "isActive": true,
      "startDate": "...",
      "endDate": "..."
    },
    "payment": {
      "amount": 99.99,
      "currency": "USD",
      "billingPeriod": "yearly",
      "isTrial": false
    }
  }
}
```

#### Dummy Payment (Protected)
```http
POST /api/v1/billing/dummy-payment
Cookie: accessToken=<accessToken>
Content-Type: application/json

{
  "targetTier": "pro",
  "billingPeriod": "monthly",
  "cardNumber": "4111111111111111",
  "expiry": "12/28",
  "cvv": "123"
}

Response: 200
{
  "success": true,
  "data": {
    "subscription": { ... },
    "payment": { ... },
    "paymentStatus": "completed",
    "transactionId": "dummy_..."
  }
}
```

---

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "email": ["Invalid email address"] }
  }
}
```

Error codes: `VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `PRO_TRIAL_EXPIRED`, `INTERNAL_SERVER_ERROR`.

---

### Health Check

```http
GET /health

Response: 200
{
  "status": "ok",
  "timestamp": "2025-02-21T..."
}
```

## How to Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database and JWT credentials:
# DB_USER=your_username
# DB_PASSWORD=your_password
# DB_NAME=walletwise_dev
# JWT_SECRET=your-secret-key
# JWT_REFRESH_SECRET=your-refresh-secret-key

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

### Available Scripts
```bash
npm run dev              # Start with hot reload (tsx watch)
npm run build            # Build for production (prisma generate + tsc)
npm run start            # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
npm run lint             # Run ESLint
npm run format           # Run Prettier
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | PostgreSQL host | No (default: localhost) |
| `DB_PORT` | PostgreSQL port | No (default: 5432) |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_NAME` | Database name | Yes |
| `DATABASE_URL` | Full PostgreSQL URL (overrides components) | No |
| `JWT_SECRET` | Secret for access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `JWT_EXPIRES_IN` | Access token expiry | No (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | No (default: 7d) |
| `NODE_ENV` | development \| production | No (default: development) |
| `PORT` | Server port | No (default: 3000) |
| `CORS_ORIGIN` | Comma-separated origins | No (default: localhost:5173, localhost:3000) |
| `LOG_LEVEL` | Log level | No (default: debug) |

## Deployment Link

<!-- Add your deployed backend URL here -->
- **Production:** _Add deployment link when ready_
- **Staging:** _Add staging link when ready_

---

## Project Structure

```
src/
├── config/          # Database, env, load-env
├── constants/       # Subscription tier limits, prices
├── controllers/     # Request handlers (auth, wallet, transaction, billing)
├── middleware/      # Auth, validation, error, logger
├── routes/
│   └── v1/          # API v1 route definitions (auth, wallet, transaction, billing)
├── schemas/         # Zod validation schemas
├── services/        # Business logic
├── utils/           # JWT, errors, logger, validation
├── app.ts           # Express app setup
└── index.ts         # Entry point
```

## License

MIT License
