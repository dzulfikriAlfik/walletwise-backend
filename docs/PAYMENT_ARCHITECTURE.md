# Payment System Architecture

## Summary

Production-ready payment system with Stripe (Card, Subscription), Xendit (Invoice, VA, E-wallet, QRIS), and Midtrans (Snap: VA, E-wallet, QRIS, card). All payment status updates occur **only via webhooks** with signature verification and idempotency.

## Core Features

- **Unified `/api/v1/payments/create`** – Single endpoint for all payment creation
- **Gateway abstraction** – Stripe, Xendit, and Midtrans behind a common interface
- **Webhook-only activation** – Subscription activates only when webhook confirms PAID
- **Realtime updates** – Socket.IO emits `subscription:updated` to connected clients
- **Pro trial** – Direct activation (no gateway) for 7-day free trial

## Subscription Tiers

| Tier      | Max Wallets | Custom Categories | Analytics | Export |
|-----------|-------------|-------------------|-----------|--------|
| Free      | 3           | No                | No        | No     |
| Pro Trial | Unlimited   | Yes (7 days)      | No        | No     |
| Pro       | Unlimited   | Yes               | No        | No     |
| Pro+      | Unlimited   | Yes               | Yes       | Yes    |

## Payment Flow

```
User selects plan → Payment modal (gateway selector) → POST /payments/create
  → Stripe: redirect to Checkout (dev popup)
  → Xendit: dev popup (in development)
  → Midtrans: redirect to Snap payment page
  → Pro Trial: direct activation
  → Webhook received → signature verified → idempotent handler → subscription activated
  → Socket.IO emits to user room → Frontend updates instantly
```

## Security Rules

- **Webhook-only updates** – No frontend-driven success logic
- **Signature verification** – Stripe (webhook secret), Xendit (callback token), Midtrans (SHA512 signature)
- **Idempotency** – `gatewayRef` unique constraint prevents double processing
- **Raw payload storage** – `rawRequest`, `rawResponse`, `rawWebhook` in `payments` table

## Database

### payments

| Column       | Type   | Description                    |
|--------------|--------|--------------------------------|
| id           | string | Primary key                    |
| userId       | string | FK to users                    |
| gateway      | string | 'stripe' \| 'xendit' \| 'midtrans' |
| gatewayRef   | string | External ID (idempotency key)  |
| method       | string | 'card' \| 'invoice' \| etc.    |
| status       | string | 'pending' \| 'paid' \| 'failed'|
| rawRequest   | json   | Request sent to gateway        |
| rawResponse  | json   | Response from gateway          |
| rawWebhook   | json   | Last webhook payload           |

### subscriptions

Existing model: `userId`, `tier`, `status`, `startDate`, `endDate`

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_...
STRIPE_PRICE_PRO_PLUS_YEARLY=price_...

# Xendit
XENDIT_SECRET_KEY=xnd_...
XENDIT_WEBHOOK_TOKEN=...

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_IS_PRODUCTION=false

# App
FRONTEND_URL=http://localhost:5173
```

## Webhook Endpoints

- `POST /webhook/stripe` – Raw body, Stripe signature verification
- `POST /webhook/xendit` – JSON body, callback token verification
- `POST /webhook/midtrans` – JSON body, SHA512 signature verification

**Midtrans Dashboard:** Configure Payment Notification URL to `https://your-api.com/webhook/midtrans` and Finish Redirect URL to `https://your-app.com/transactions?midtransPayment=success`.

## Migration

```bash
npx prisma migrate dev --name add_payments_table
# or
npx prisma db push
```
