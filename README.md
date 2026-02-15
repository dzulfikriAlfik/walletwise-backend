# WalletWise Backend

RESTful API untuk aplikasi expense tracking SaaS WalletWise.

## System Design Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     WalletWise Backend (Express API)               │
├─────────────────────────────────────────────────────────────────┤
│  Routes                                                           │
│  ├── /api/auth     (register, login, profile)                     │
│  ├── /api/wallets  (CRUD wallets)                                 │
│  └── /api/transactions (CRUD transactions)                        │
├─────────────────────────────────────────────────────────────────┤
│  Middleware                                                       │
│  ├── auth.middleware (JWT validation)                             │
│  ├── validation.middleware (Zod schemas)                          │
│  └── error.middleware                                             │
├─────────────────────────────────────────────────────────────────┤
│  Prisma ORM ──────────────────────► PostgreSQL                   │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod |
| Security | Helmet, bcryptjs |

## Feature List

### Core Features
- User registration & login
- JWT authentication with refresh tokens
- Wallet CRUD (create, read, update, delete)
- Transaction management
- Subscription tier (free vs pro)

### Subscription Rules
- Free users: up to 3 wallets
- Pro users: unlimited wallets
- Subscription logic mocked for demo

## API Documentation

### Base URL
- **Local:** `http://localhost:3000/api`
- **Production:** `_Add base URL when deployed_`

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Password123!"
}

Response: 201
{
  "user": { ... },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response: 200
{
  "user": { ... },
  "tokens": { ... }
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <accessToken>

Response: 200
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "subscription": {
    "tier": "free",
    "isActive": true
  }
}
```

### Wallets

#### Get All Wallets
```
GET /api/wallets
Authorization: Bearer <accessToken>

Response: 200
{
  "data": [ ... ],
  "pagination": { ... }
}
```

#### Create Wallet
```
POST /api/wallets
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "My Wallet",
  "balance": 1000,
  "currency": "USD"
}

Response: 201
{ ... wallet data ... }
```

#### Update Wallet
```
PATCH /api/wallets/:id
Authorization: Bearer <accessToken>

Response: 200
{ ... updated wallet ... }
```

#### Delete Wallet
```
DELETE /api/wallets/:id
Authorization: Bearer <accessToken>

Response: 204
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

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/walletwise"
# JWT_SECRET="your-secret-key"

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

### Available Scripts
```bash
npm run dev              # Start with hot reload
npm run build            # Build for production
npm run start            # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `NODE_ENV` | `development` or `production` |

## Deployment Link

<!-- Add your deployed backend URL here, e.g. https://api.walletwise.com -->
- **Production:** _Add deployment link when ready_
- **Staging:** _Add staging link when ready_

---

## 📁 Project Structure

```
src/
├── config/              # Configuration
├── controllers/         # Request handlers
├── services/            # Business logic
├── middleware/          # Auth, validation, error
├── routes/              # API routes
├── schemas/             # Zod validation
└── index.ts             # Entry point
```

## 📄 License

MIT License
