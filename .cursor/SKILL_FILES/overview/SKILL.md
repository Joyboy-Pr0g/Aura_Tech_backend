---
name: aura-backend-overview
description: >-
  AURA TECH backend overview: Express TypeScript API, stack, directory tree,
  entry points, and API prefixes. Use when onboarding or locating where a
  domain module should live.
---

# Backend Overview

## Purpose

AURA TECH e-commerce API: products/categories, cart, checkout/orders, manual bank-transfer payments, addresses, wishlists/reviews/Q&A. Yemen-oriented (phone rules, default country, receipt uploads).

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js, TypeScript 5.5 (strict, decorators) |
| HTTP | Express 4 |
| ORM | TypeORM 0.3 + PostgreSQL (`pg`) |
| DI | tsyringe + `reflect-metadata` |
| Auth | JWT + bcrypt; Redis token blacklist |
| Validation | Joi |
| Security | helmet, cors, express-rate-limit |
| Uploads | multer (memory) + Cloudinary |

## Entry points

- Dev: `nodemon` → `ts-node` → `src/server.ts`
- Prod: `tsc` → `node dist/server.js`
- Boot: env validate → `initializeDatabase()` → Redis → `app.listen`
- App wiring: `src/app.ts`
- Migrations CLI: root `data-source.ts`

## Layout

```
src/
  server.ts, app.ts
  config/          # database, redis, cloudinary, multer
  di/              # container, tokens, registerDependencies
  routes/          # *.routes.ts + index
  controllers/{domain}/
  services/{domain}/
  repositories/{domain}/
  interfaces/repositories/
  models/
  validators/
  middleware/
  core/errors, core/responses
  database/migrations/
  seeds/
```

## API mounts

| Prefix | Domain |
|--------|--------|
| `/api/auth` | auth |
| `/api/categories` | category |
| `/api/products` | product |
| `/api/cart` | cart |
| `/api/orders` | order |
| `/api/payments` | payment |
| `/api/addresses` | address |
| `/api/*` engagement | wishlists, reviews, questions |
| `/health` | unauthenticated health |

## Related skills

- Architecture → [../architecture/SKILL.md](../architecture/SKILL.md)
- DB → [../db/SKILL.md](../db/SKILL.md)
- Security → [../security/SKILL.md](../security/SKILL.md)
