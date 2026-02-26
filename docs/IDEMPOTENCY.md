# Idempotency Guide — WalletWise API

> Ensuring safe retries and reliable financial operations.

## Table of Contents

- [What Is Idempotency?](#what-is-idempotency)
- [Why It Matters for WalletWise](#why-it-matters-for-walletwise)
- [HTTP Method Idempotency Matrix](#http-method-idempotency-matrix)
- [Endpoint Classification](#endpoint-classification)
- [Idempotency-Key Header](#idempotency-key-header)
- [Payment Idempotency](#payment-idempotency)
- [Webhook Idempotency](#webhook-idempotency)
- [Implementation Details](#implementation-details)
- [Client Integration Guide](#client-integration-guide)
- [Error Handling & Retries](#error-handling--retries)

---

## What Is Idempotency?

An operation is **idempotent** if performing it multiple times produces the **same result** as performing it once. In the context of REST APIs, this means that sending the same request N times should have the same effect as sending it once — no duplicate records, no double charges, no inconsistent state.

```
Request 1: POST /transactions → 201 Created (transaction #42)
Request 2: POST /transactions → 200 OK    (returns existing #42, no new tx)
Request 3: POST /transactions → 200 OK    (returns existing #42, no new tx)
```

---

## Why It Matters for WalletWise

WalletWise is a **financial application** where data accuracy is critical:

| Risk                  | Scenario                                                  | Impact                     |
| --------------------- | --------------------------------------------------------- | -------------------------- |
| **Double spending**   | Network timeout on POST, client retries → 2 transactions  | Incorrect wallet balance   |
| **Duplicate payments**| Payment webhook delivered twice                           | User charged but plan not upgraded twice |
| **Ghost records**     | Wallet creation retried after timeout                     | Multiple wallets with same name |
| **Balance drift**     | Balance adjustment applied twice                          | Financial data corruption  |

Idempotency prevents all of these by ensuring each unique operation is only applied once.

---

## HTTP Method Idempotency Matrix

| Method   | Naturally Idempotent | Notes |
| -------- | -------------------- | ----- |
| `GET`    | ✅ Yes               | Read-only, no side effects |
| `HEAD`   | ✅ Yes               | Same as GET, without body |
| `PUT`    | ✅ Yes               | Full replacement → same state regardless of repetitions |
| `DELETE` | ✅ Yes               | Deleting an already-deleted resource is a no-op |
| `PATCH`  | ⚠️ Conditional       | Idempotent only if applying the same patch produces the same state |
| `POST`   | ❌ No                | Creates new resources — requires explicit idempotency handling |

---

## Endpoint Classification

### Naturally Idempotent Endpoints (Safe to Retry)

These endpoints can be safely retried without additional measures:

| Endpoint                            | Method   | Why Safe |
| ----------------------------------- | -------- | -------- |
| `GET /api/v1/auth/profile`          | GET      | Read-only |
| `GET /api/v1/wallets`               | GET      | Read-only |
| `GET /api/v1/wallets/:id`           | GET      | Read-only |
| `GET /api/v1/wallets/summary`       | GET      | Read-only |
| `GET /api/v1/transactions`          | GET      | Read-only |
| `GET /api/v1/transactions/:id`      | GET      | Read-only |
| `GET /api/v1/transactions/summary`  | GET      | Read-only |
| `GET /api/v1/transactions/export`   | GET      | Read-only |
| `GET /api/v1/categories`            | GET      | Read-only |
| `PUT /api/v1/wallets/:id`           | PUT      | Full replacement |
| `PUT /api/v1/transactions/:id`      | PUT      | Full replacement |
| `PUT /api/v1/categories/:id`        | PUT      | Full replacement |
| `DELETE /api/v1/wallets/:id`        | DELETE   | Delete is idempotent (returns 404 on retry) |
| `DELETE /api/v1/transactions/:id`   | DELETE   | Delete is idempotent |
| `DELETE /api/v1/categories/:id`     | DELETE   | Delete is idempotent |
| `POST /api/v1/auth/logout`          | POST     | Clears cookies — repeated clears are harmless |

### Non-Idempotent Endpoints (Require Idempotency-Key)

These endpoints create resources or trigger side effects and **must** use the `Idempotency-Key` header for safe retries:

| Endpoint                             | Method | Side Effect | Idempotency Strategy |
| ------------------------------------ | ------ | ----------- | -------------------- |
| `POST /api/v1/auth/register`         | POST   | Creates user + subscription | Unique constraint on `email` |
| `POST /api/v1/auth/login`            | POST   | Issues tokens | Naturally safe (no state mutation) |
| `POST /api/v1/wallets`               | POST   | Creates wallet + initial tx | `Idempotency-Key` header |
| `POST /api/v1/transactions`          | POST   | Creates tx + adjusts balance | `Idempotency-Key` header |
| `POST /api/v1/categories`            | POST   | Creates category | `Idempotency-Key` header |
| `POST /api/v1/billing/upgrade`       | POST   | Upgrades subscription | `Idempotency-Key` header |
| `POST /api/v1/payments`              | POST   | Initiates payment with gateway | `gatewayRef` as natural key |
| `POST /api/v1/payments/webhook/:gw`  | POST   | Activates subscription | Gateway event ID as idempotency key |

---

## Idempotency-Key Header

### Protocol

```
POST /api/v1/transactions
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{ "walletId": "...", "type": "expense", "amount": 50 }
```

### How It Works

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Client   │────────▶│  API Server  │────────▶│ Database │
│           │         │              │         │          │
│ Request 1 │         │ 1. Check key │         │          │
│ Key: abc  │         │ 2. Not found │         │          │
│           │         │ 3. Process   │────────▶│ INSERT   │
│           │◀────────│ 4. Store key │────────▶│ STORE    │
│ 201       │         │    + result  │         │          │
│           │         │              │         │          │
│ Request 2 │         │ 1. Check key │         │          │
│ Key: abc  │         │ 2. Found!    │         │          │
│           │◀────────│ 3. Return    │         │          │
│ 200       │         │    cached    │         │          │
└──────────┘         └──────────────┘         └──────────┘
```

### Rules

1. **Format**: UUIDv4 string (e.g., `550e8400-e29b-41d4-a716-446655440000`)
2. **Scope**: Keys are scoped per-user and per-endpoint
3. **TTL**: Keys expire after **24 hours** — after that, the same key creates a new operation
4. **Uniqueness**: Each distinct operation must have a unique key
5. **Reuse**: Retrying the same operation must reuse the same key
6. **Payload mismatch**: If the same key is sent with different payload, return `422 Unprocessable Entity`

### Response Behavior

| Scenario | Status | Response |
| -------- | ------ | -------- |
| First request | `201 Created` | Newly created resource |
| Duplicate with same payload | `200 OK` | Cached result from first request |
| Duplicate with different payload | `422 Unprocessable Entity` | Error: payload mismatch |
| Expired key (>24h) | `201 Created` | Treated as new request |

---

## Payment Idempotency

Payments require special handling because they involve external gateways (Stripe, Xendit):

### Gateway Reference as Natural Key

The `gatewayRef` field in the payment record acts as a natural idempotency key:

```typescript
// A payment is uniquely identified by:
// - userId + gatewayRef + gateway

const existingPayment = await prisma.payment.findFirst({
  where: {
    userId,
    gatewayRef,
    gateway,
  },
});

if (existingPayment) {
  // Return existing payment — do NOT create a duplicate
  return existingPayment;
}
```

### Gateway-Level Idempotency

Both Stripe and Xendit support idempotency keys at the gateway level:

**Stripe:**
```typescript
const paymentIntent = await stripe.paymentIntents.create(
  { amount: 1000, currency: 'usd' },
  { idempotencyKey: `walletwise_${userId}_${planId}_${timestamp}` }
);
```

**Xendit:**
```typescript
// Xendit uses external_id as idempotency reference
const invoice = await xendit.invoice.create({
  external_id: `walletwise_${userId}_${planId}_${timestamp}`,
  amount: 1000,
});
```

---

## Webhook Idempotency

Webhook endpoints receive events from payment gateways and **must** be idempotent because gateways may deliver the same event more than once.

### Current Implementation

The WalletWise payment service already handles webhook idempotency:

```typescript
// In payment.service.ts - activateSubscription()
const existing = await prisma.payment.findFirst({
  where: {
    gatewayRef: paymentData.gatewayRef,
    gateway: paymentData.gateway,
    status: 'completed',
  },
});

if (existing) {
  // Already processed — skip to avoid double activation
  return existing;
}
```

### Webhook Event Processing Flow

```
Gateway Event → Verify Signature → Extract Payment Data
                                        │
                                  ┌─────▼──────┐
                                  │ Already     │
                                  │ processed?  │
                                  ├─────┬───────┤
                                  │ Yes │  No   │
                                  │     │       │
                              ┌───▼──┐ ┌▼──────────┐
                              │Return│ │Process     │
                              │ 200  │ │Payment     │
                              │ OK   │ │Update Sub  │
                              └──────┘ │Mark Paid   │
                                       └────────────┘
```

### Important: Always Return 200

Even if a webhook has already been processed, **always return `200 OK`** to the gateway. Returning an error would cause the gateway to retry indefinitely.

---

## Implementation Details

### Idempotency Middleware

The recommended implementation uses a database-backed idempotency store:

```typescript
// middleware/idempotency.middleware.ts

interface IdempotencyRecord {
  key: string;
  userId: string;
  endpoint: string;
  payloadHash: string;
  statusCode: number;
  responseBody: string;
  createdAt: Date;
  expiresAt: Date;
}

export function idempotencyGuard() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string;

    // No key = proceed normally (no replay protection)
    if (!key) return next();

    // Validate UUID format
    if (!isValidUUID(key)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Idempotency-Key must be a valid UUID',
        },
      });
    }

    const record = await getIdempotencyRecord(key, req.user.id, req.path);

    if (record) {
      // Check payload mismatch
      const currentHash = hashPayload(req.body);
      if (record.payloadHash !== currentHash) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'IDEMPOTENCY_MISMATCH',
            message: 'Idempotency-Key was used with different request body',
          },
        });
      }

      // Return cached response
      return res.status(record.statusCode).json(JSON.parse(record.responseBody));
    }

    // Proceed and capture response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      storeIdempotencyRecord(key, req.user.id, req.path, req.body, res.statusCode, body);
      return originalJson(body);
    };

    next();
  };
}
```

### Database Schema (Prisma)

```prisma
model IdempotencyKey {
  id           String   @id @default(cuid())
  key          String
  userId       String
  endpoint     String
  payloadHash  String
  statusCode   Int
  responseBody String   @db.Text
  createdAt    DateTime @default(now())
  expiresAt    DateTime

  @@unique([key, userId, endpoint])
  @@index([expiresAt])

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Cleanup Job

Expired idempotency keys should be cleaned up periodically:

```typescript
// Run daily via cron or scheduled task
async function cleanupExpiredKeys() {
  const deleted = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  logger.info(`Cleaned up ${deleted.count} expired idempotency keys`);
}
```

---

## Client Integration Guide

### JavaScript / TypeScript (Frontend)

```typescript
import { v4 as uuidv4 } from 'uuid';

async function createTransaction(data: TransactionInput) {
  const idempotencyKey = uuidv4();

  const res = await fetch('/api/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey, // ← attach to mutating requests
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return res.json();
}
```

### Retry with Same Key

```typescript
async function safeCreateTransaction(data: TransactionInput, maxRetries = 3) {
  const idempotencyKey = uuidv4(); // Generate ONCE

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey, // Same key for all retries!
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (res.ok) return res.json();
      if (res.status >= 400 && res.status < 500) throw new Error('Client error');

    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
    }
  }
}
```

---

## Error Handling & Retries

### Retry Strategy

| Error Type | Retry? | Notes |
| ---------- | ------ | ----- |
| Network timeout | ✅ Yes | Use same Idempotency-Key |
| 5xx Server Error | ✅ Yes | Use same Idempotency-Key |
| 408 Timeout | ✅ Yes | Use same Idempotency-Key |
| 429 Too Many Requests | ✅ Yes | Respect `Retry-After` header |
| 4xx Client Error | ❌ No | Fix the request first |
| 422 Payload Mismatch | ❌ No | Generate new key with correct payload |

### Exponential Backoff

```
Attempt 1: Immediate
Attempt 2: Wait 1s
Attempt 3: Wait 2s
Attempt 4: Wait 4s
Attempt 5: Wait 8s (give up after this)
```

---

## Summary

| Aspect | Approach |
| ------ | -------- |
| GET/PUT/DELETE | Naturally idempotent — no extra handling needed |
| POST endpoints | Use `Idempotency-Key` header (UUIDv4) |
| Payments | `gatewayRef` as natural key + gateway-level idempotency |
| Webhooks | Check for existing completed payment before processing |
| Key storage | Database-backed with 24h TTL |
| Cleanup | Daily cron to purge expired keys |
| Client retries | Same key + exponential backoff |

> **Golden Rule**: Every state-changing operation should be safe to retry. If it creates something, use an idempotency key. If it updates or deletes, the operation is naturally idempotent.
