---
name: aura-backend-security
description: >-
  AURA TECH backend security: helmet, CORS, rate limits, JWT+Redis blacklist,
  protect/authorize, bcrypt, Joi, multer allowlist, ownership checks. Use when
  changing auth, middleware, uploads, or access control.
---

# Backend Security

## HTTP hardening (`src/app.ts`)

- `helmet()`
- CORS: `origin: CORS_ORIGIN || '*'`, `credentials: true`
- Global rate limit: 300 / 15m; `/api/auth`: 30 / 15m
- Body limits: JSON/urlencoded 10mb

## Auth

| Piece | Detail | Path |
|-------|--------|------|
| JWT | Bearer; payload `{ user_id, email, role }` | `src/utils/jwt.ts` |
| Protect | Verify JWT; Redis `blacklist:{token}`; **fail-open** if Redis down | `src/middleware/auth.ts` |
| Logout | Blacklist token for remaining TTL | `AuthService.logout` |
| RBAC | `authorize([Role...])` after `protect` | `src/middleware/rbac.ts` |
| Roles | `admin`, `sub_admin`, `customer` | `src/types/rbac.ts` |
| Passwords | bcrypt (`BCRYPT_ROUNDS`, default 10) | `src/utils/password.ts` |

`protect` maps token `user_id` → `req.user.id`.

Auth routes: `POST /register`, `POST /login` public + Joi; `POST /logout`, `GET /me` require `protect`.

Password rule: 8–64 chars, upper + lower + digit. Phone: Yemeni `+9677…` or `07…` on register.

## Validation & uploads

- Joi via `validateRequest` → `req.validatedData` (`src/middleware/validation.ts`).
- Multer: MIME + extension allowlist, 5MB, memory storage (`src/config/multer.ts`).

## Boot checks (`src/server.ts`)

- `JWT_SECRET` ≥ 32 characters
- `DB_PASSWORD` required

## Domain checks

- Ownership: orders/addresses/payments must belong to `req.user.id`.
- Checkout uses pessimistic write locks on stock.
- Soft-deleted records stay excluded via TypeORM delete dates.

## Rules for agents

1. Never weaken `protect`/`authorize` on private mutations without an explicit product decision.
2. Do not log JWTs or passwords.
3. Keep Redis blacklist behavior documented if changed (fail-open today).
4. Treat `.env.example` values as placeholders — never commit live secrets.
