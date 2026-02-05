# WalletWise Backend

## 📋 Overview

WalletWise Backend adalah RESTful API untuk aplikasi expense tracking SaaS yang dibangun dengan:

- **Express.js** - Lightweight, flexible Node.js framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Modern, type-safe database ORM
- **PostgreSQL** - Production-grade database
- **JWT Authentication** - Secure token-based auth

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Update .env with your database credentials
# Then run migrations:
npm run prisma:migrate

# Start development server
npm run dev
```

Server akan run di `http://localhost:3000`

## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.ts     # Prisma client setup
│   └── env.ts          # Environment variables validation
├── controllers/         # Request handlers
│   ├── auth.controller.ts
│   ├── wallet.controller.ts
│   └── transaction.controller.ts
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── wallet.service.ts
│   └── transaction.service.ts
├── middleware/          # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── routes/              # API routes
│   ├── auth.routes.ts
│   ├── wallet.routes.ts
│   └── transaction.routes.ts
├── schemas/             # Zod validation schemas
│   ├── auth.schemas.ts
│   ├── wallet.schemas.ts
│   └── transaction.schemas.ts
├── types/               # TypeScript types
│   └── index.ts
├── utils/               # Utility functions
│   ├── jwt.ts
│   ├── errors.ts
│   └── logger.ts
└── index.ts            # Application entry point
```

## 🛠️ Available Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
```

## 📚 API Documentation

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

## 🔐 Security

- Password hashing dengan bcryptjs
- JWT token-based authentication
- Refresh token rotation
- CORS configuration
- Helmet security headers
- Input validation dengan Zod
- Rate limiting (to be added)

## 🗄️ Database Schema

See `prisma/schema.prisma` for detailed schema.

### Key Tables:
- `users` - User accounts
- `subscriptions` - Subscription tier info
- `wallets` - User wallets
- `transactions` - Income/expense transactions

## 📝 Environment Variables

Lihat `.env.example` untuk semua variabel yang diperlukan.

Penting:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key untuk signing tokens
- `NODE_ENV` - development / production

## 🤝 Contributing

1. Buat feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'feat: add amazing feature'`)
3. Push ke branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

MIT License - lihat LICENSE file untuk details.

## 👥 Author

Dibuat oleh: Your Name (GitHub: @dzulfikriAlfik)

## 🆘 Support

Untuk pertanyaan atau issues, buka GitHub Issues.
