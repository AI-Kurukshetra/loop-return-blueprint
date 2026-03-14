# Loop Return

Returns management platform for Shopify brands. Process returns, exchanges, refunds, and shipping labels from one dashboard.

## Features

- **Return portal** – Customer-facing flow: select items → reason → shipping
- **Merchant dashboard** – Returns list, analytics, policies, settings
- **RMA generation** – Unique RMA numbers for each return
- **Shipping labels** – API-ready for EasyPost, Shippo, or carrier integration
- **Refunds** – Original payment or store credit
- **Analytics** – Return rate, refund vs exchange, fraud metrics (placeholders)
- **Analytics dashboard** – Recharts-powered metrics and trend charts computed from live transactional data
- **Inventory integration** – Restock/damage/liquidate workflows + warehouse stock ledger
- **Customer communication** – Event notifications for approval, label creation, and refunds
- **AI fraud scoring** – Rules-based scoring with `fraud_scores` and `fraud_events`
- **Authentication** – Protected dashboard with email/password login

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma 6** (PostgreSQL)
- **Recharts** (charts, add Tremor for richer dashboards)
- **Zod** (validation)

## Getting Started

### Node.js Version

This project is pinned to Node.js 24.x.

```bash
nvm use
```

### 1. Database

Copy `.env.example` to `.env` and set your env values:

```bash
cp .env.example .env
```

Use a PostgreSQL connection string, e.g.:

```
DATABASE_URL="postgresql://user:password@localhost:5432/loop_return"
DIRECT_URL="postgresql://user:password@localhost:5432/loop_return"
```

For Supabase, use:

- `DATABASE_URL`: pooler URL for app/runtime traffic.
- `DIRECT_URL`: direct or session URL (non-transaction-pooled) for Prisma migrations.

Set your NextAuth secret:

```
NEXTAUTH_SECRET="a-long-random-secret"
```

### 2. Migrate

```bash
npm run db:migrate
```

For shared/staging/production environments:

```bash
npm run db:deploy
```

Or for quick schema push without migrations:

```bash
npm run db:push
```

### 3. Run

```bash
npm run dev
```

### 4. Seed Dummy Data (Returns + Inventory)

```bash
npm run db:seed
```

Fresh reset + reseed:

```bash
npm run db:seed:fresh
```

- App: http://localhost:3000
- Return portal: http://localhost:3000/returns
- Dashboard: http://localhost:3000/dashboard
- Sign up: http://localhost:3000/signup

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # login, signup
│   │   ├── returns/
│   │   ├── orders/
│   │   ├── refunds/
│   │   ├── shipping/
│   │   ├── credits/
│   │   ├── analytics/
│   │   └── exchanges/
│   ├── dashboard/     # Merchant dashboard
│   ├── returns/       # Customer return portal
│   ├── login/
│   └── signup/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   └── utils.ts
└── generated/prisma
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Sign in |
| POST | /api/auth/signup | Create account |
| GET | /api/returns | List returns |
| POST | /api/returns | Create return |
| GET | /api/returns/:id | Get return |
| PATCH | /api/returns/:id | Update return |
| GET | /api/orders | List orders |
| GET | /api/orders/:id | Get order |
| GET | /api/customers | List customers |
| GET | /api/customers/:id | Get customer profile/history |
| GET | /api/merchants | List merchants |
| GET | /api/merchants/:id | Get merchant profile |
| POST | /api/shipping/label | Create label |
| GET | /api/shipping/track | Track shipment |
| POST | /api/refunds | Create refund |
| GET | /api/refunds/:id | Get refund |
| GET | /api/credits | Customer store credits |
| GET | /api/analytics/returns | Return metrics |
| GET | /api/analytics/revenue | Refund totals |
| POST | /api/exchanges | Create exchange |
| GET | /api/tracking | List tracking events |
| GET/POST | /api/tracking/:returnId | Return-specific tracking events |
| POST | /api/webhooks | Receive and persist webhook events |
| GET/POST | /api/policies | List/create return policies |

## Roadmap

- [ ] Shopify integration (orders sync)
- [ ] Real shipping label generation (EasyPost/Shippo)
- [ ] Resend (emails) and Twilio (SMS)
- [x] Store credits API flow
- [x] AI fraud scoring foundation
