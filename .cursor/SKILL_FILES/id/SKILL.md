---
name: aura-backend-id
description: >-
  AURA TECH ID conventions: UUID primary keys via Postgres gen_random_uuid,
  AT-YYYYMMDD order numbers, slugs/SKUs/coupon codes, JWT user_id. Use when
  creating entities, FKs, validators, or human-facing identifiers.
---

# Backend IDs

## Primary keys

- Default: `@PrimaryGeneratedColumn('uuid')` on entities.
- Migrations: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- FKs are `uuid` columns (`customer_id`, `product_id`, …).
- Joi: `Joi.string().uuid()` for ID params/bodies.

Do **not** use Mongo ObjectIds, auto-increment integer PKs, or app-side `uuid` package generation unless there is a strong reason — DB generates UUIDs.

## Human-facing / alternate IDs

| Kind | Pattern | Where |
|------|---------|--------|
| Order number | `AT-YYYYMMDD-{5 char random}` e.g. `AT-20260711-A3F9K` | `OrderRepository.generateOrderNumber()` |
| Product / category slug | `toSlug(title/name)` — lowercase, non-alnum → `-` | Product/Category services |
| Variant SKU | Unique string (client/seed) | `ProductVariant.sku` |
| Coupon code | Unique string | `Coupon.code` |

## Auth identity

- JWT payload field: `user_id` (UUID string).
- After `protect`: available as `req.user.id`.

## Rules

1. New entities get UUID PKs unless explicitly specified otherwise.
2. Public URLs prefer slugs where the domain already uses them (products/categories).
3. Keep order number format stable — customers and receipts rely on `AT-…`.
4. Validate external ID inputs as UUIDs before querying.
