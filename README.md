# AURA TECH — Backend API

Arabic-first e-commerce REST API for the **AURA TECH** gaming & tech storefront. Handles catalog, cart, checkout, bank-transfer payments with SMS auto-verification, order fulfillment, admin operations, analytics, and fraud monitoring.

**Production:** [api.auratechplus.com](https://api.auratechplus.com)  
**Frontend companion:** [Aura_Tech](../../Frontend/Next.js/Aura_Tech) (Next.js 14, port 3001)

---

## Highlights (for reviewers)

| Area | What was built |
|------|----------------|
| **Architecture** | Layered Express API — Route → Controller → Service → Repository → TypeORM |
| **DI** | tsyringe with interface-based repositories and singleton services |
| **Data** | PostgreSQL 15, 40+ entities, 18 TypeORM migrations, cursor pagination |
| **Cache / state** | Redis — JWT blacklist, OTP codes, auth rate limits, payment verify queue, suspicious-activity counters |
| **Auth** | JWT + bcrypt, role-based access (`admin`, `sub_admin`, `customer`), token revocation on logout |
| **Payments** | Receipt upload, admin approval, **SMS payment bridge** (mobile device ingests bank SMS → regex + optional Gemini parsing → auto-match) |
| **Orders** | Enforced status state machine (8 statuses), status history audit trail |
| **Security** | Helmet, CORS, global + auth rate limits, Redis-backed registration/forgot-password throttling, Arabic UGC moderation, suspicious-user monitoring |
| **Ops** | node-cron (trending, notification retries, stock reminders, payment expiry), Docker Compose, Hetzner deploy scripts |
| **i18n** | Arabic API responses via centralized translation layer (English in code → Arabic at response time) |

---

## Tech stack

- **Runtime:** Node.js, TypeScript 5.5
- **HTTP:** Express 4
- **ORM:** TypeORM 0.3 + PostgreSQL
- **Cache:** Redis (ioredis)
- **Validation:** Joi
- **DI:** tsyringe + reflect-metadata
- **Media:** Cloudinary, Multer
- **Email:** Brevo
- **Push:** Firebase Admin (optional)
- **AI:** Google Gemini (optional SMS parsing fallback)
- **Scheduling:** node-cron

---

## Features

### Storefront / customer

- Registration, login, email verification, forgot password
- Category tree & product catalog with variants and dynamic JSONB features
- Cart (guest + authenticated), checkout, coupons, shipping fees
- Orders: bank transfer or pay-on-delivery
- Payment receipt upload with payer account number
- Addresses, wishlist, reviews, Q&A, back-in-stock reminders
- In-app + email + push notifications
- Refund requests (24h post-delivery window)

### Admin

- Dashboard KPIs and nav badges (pending orders, payments, questions, refunds, suspicious users)
- Users — activate, block, soft-delete, restore, reset password
- Categories, products, variants, stock, inventory logs
- Order status management
- Payment approve/reject, payment methods, manual payments
- Payment bridge — register mobile devices & SMS providers
- Coupons, shipping fees, blogs, website settings (SEO, logos, SAR→YER rate)
- Q&A moderation, refund approval, expense ledger
- Analytics — revenue, top products, customers, inventory, payments, financial
- Suspicious user reports — dismiss, block, or delete flagged customers

### Payment auto-verification

1. Customer submits bank transfer + receipt at checkout.
2. Registered mobile **payment bridge** posts bank SMS to `POST /api/payment-events`.
3. Parser matches amount, account, and currency (SAR→YER via site settings).
4. On success: payment auto-approved, order advanced, customer notified.
5. Cron expires stale verifications every minute; admins see failure reasons.

### Suspicious activity monitoring

Redis counters track profile/password/address changes, order volume, cancellations, and refund requests. Threshold breaches create admin review reports automatically.

---

## Project structure

```
src/
├── app.ts                 # Express middleware & route mounting
├── server.ts              # Bootstrap, graceful shutdown, cron start
├── config/                # database, redis, firebase, cloudinary
├── controllers/           # HTTP handlers
├── core/                  # AppError, APIResponse
├── database/migrations/   # TypeORM migrations
├── di/                    # tsyringe container & repository tokens
├── i18n/                  # Arabic translation (translate.ts, notification-messages.ts)
├── interfaces/repositories/
├── jobs/                  # Cron scheduler
├── middleware/            # auth, rbac, validation, rate limits
├── models/                # TypeORM entities
├── repositories/          # Data access
├── routes/                # Public + admin/ routers
├── services/              # Business logic
├── validators/            # Joi schemas
└── utils/                 # JWT, cursor pagination, auth rate limit
```

**Request flow:**

```
HTTP → Middleware → Route → Controller → Validator → Service → Repository → PostgreSQL
                                                              ↘ Redis / Cloudinary / Brevo / Firebase
```

---

## API overview

Base URL: `/api`

| Prefix | Description |
|--------|-------------|
| `/auth` | Register, login, profile, email verification, logout |
| `/categories`, `/products` | Public catalog |
| `/cart`, `/orders`, `/payments` | Commerce |
| `/addresses`, `/shipping-fees`, `/coupons` | Checkout support |
| `/notifications`, `/reminders` | Engagement |
| `/blogs`, `/website-settings` | Content & config |
| `/payment-events`, `/payment-bridge/*` | Payment bridge (device auth) |
| `/admin/*` | Full admin API (JWT + admin/sub_admin) |

Health: `GET /health`, `/health/live`, `/health/ready`

Response envelope:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "next_cursor": null,
  "has_more": false
}
```

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 15
- Redis 7
- (Optional) Cloudinary, Brevo, Firebase, Gemini API keys

### Local development

```bash
cd Aura_Tech_backend
cp .env.example .env
# Edit .env — set DB_*, REDIS_*, JWT_SECRET (min 32 chars), etc.

npm install
npm run migration:run    # or migrations run automatically on boot
npm run seed             # optional: sample users & catalog
npm run dev              # nodemon → http://localhost:3000
```

> **Port 3000** must be free. If Docker or another process occupies it, the API will fail with `EADDRINUSE` and the frontend will show fetch errors.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development with nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed database |
| `npm run seed:users` | Seed users only |
| `npm run seed:payment-bridge` | Seed payment bridge providers |

### Docker (production-style)

```bash
cp .env.example .env
# Set DB_PASSWORD, JWT_SECRET, and integration keys
docker compose up -d --build
```

Postgres and Redis run on an internal Docker network (not exposed publicly).

---

## Environment variables

See `.env.example` for the full template. Key groups:

| Group | Variables |
|-------|-----------|
| App | `NODE_ENV`, `PORT`, `API_URL`, `CORS_ORIGIN` |
| Database | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| Auth | `JWT_SECRET`, `JWT_EXPIRY`, `BCRYPT_ROUNDS` |
| Verification | `VERIFICATION_CODE_EXPIRY`, `RESET_CODE_EXPIRY`, `CODE_ATTEMPTS` |
| Media | `CLOUDINARY_*` |
| Email | `BREVO_API_KEY`, `BREVO_FROM_EMAIL` |
| Push | `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH` |
| Payments | `PAYMENT_VERIFY_TTL_SEC`, `GEMINI_API_KEY` |
| Security | `SUSPICIOUS_*`, `AUTH_*` rate-limit tuning |

Never commit `.env` or secrets to git.

---

## Scheduled jobs

| Schedule | Task |
|----------|------|
| Daily 1:00 AM | Recalculate trending products |
| Every 5 min | Retry failed notifications |
| Hourly | Back-in-stock reminder emails |
| Every minute | Expire stale payment auto-verifications |

---

## Design decisions (interview talking points)

1. **Repository pattern + DI** — Services depend on interfaces, not concrete DB access; easy to test and swap implementations.
2. **Cursor pagination** — Stable, efficient lists for orders, products, and admin tables (`next_cursor`, `has_more`).
3. **Order state machine** — Transitions defined in code and enforced in `OrderService`, not free-form status updates.
4. **Redis for ephemeral state** — OTP codes, rate limits, and activity counters don't belong in Postgres; keeps DB lean.
5. **Payment bridge as separate actor** — Mobile device uses API key + device ID, not user JWT; isolates SMS ingestion from customer auth.
6. **Arabic at the response layer** — Business logic stays in English; `APIResponse` translates messages for a consistent Arabic UX.
7. **Graceful shutdown** — SIGTERM/SIGINT close HTTP server, then DB and Redis connections.

---

## Related documentation

- Full system brief (architecture, schema, workflows): [`AURA_TECH_SYSTEM_OVERVIEW_FOR_CLAUDE.md`](./AURA_TECH_SYSTEM_OVERVIEW_FOR_CLAUDE.md)
- Frontend README: [`../../Frontend/Next.js/Aura_Tech/README.md`](../../Frontend/Next.js/Aura_Tech/README.md)

---

## License

Private — AURA TECH. All rights reserved.
