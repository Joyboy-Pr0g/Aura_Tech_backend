---
name: aura-backend-db
description: >-
  AURA TECH database: PostgreSQL + TypeORM, migrations on boot, entity map,
  repository pattern, seeds. Use when changing schema, models, migrations,
  queries, or seed data.
---

# Backend Database

## Setup

- Engine: **PostgreSQL**
- Runtime DataSource: `AppDataSource` in `src/config/database.ts`
  - `synchronize: false`
  - Runs pending migrations on boot
  - Pool: `DB_POOL_SIZE` (default 10)
  - SSL in production (`rejectUnauthorized: false`)
- CLI DataSource: root `data-source.ts` (same entities/migrations)

## Scripts

```
migration:generate / migration:run / migration:revert   # -d data-source.ts
seed / seed:users
```

## Migrations (ordered)

1. `1719000000000-InitialSchema.ts` — users, admin logs, role/status enums
2. `1719100000000-ProductCatalog.ts` — categories, products, variants, inventory
3. `1719200000000-Phase3CartOrderPayment.ts` — addresses, carts, orders, payments
4. `1719300000000-SchemaAlignment.ts` — full_name, country, engagement, indexes
5. `1719400000000-ProductUpdatedById.ts` — products.updated_by_id FK to users

Always add a new migration for schema changes — never rely on synchronize.

## Pagination

List endpoints use **cursor pagination** (`src/utils/cursorPagination.ts`):

- Query: `limit` + optional `cursor` (not `page`)
- Response: `data` = items array (or nested for reviews meta), plus top-level `next_cursor` / `has_more`
- Keyset on `(created_at DESC, id DESC)`; payments pending queue uses `submitted_at ASC`
- Fetch `limit + 1` rows to detect `has_more`, then encode cursor from last item

## Repository pattern

```ts
private get repo() {
  return AppDataSource.getRepository(Entity);
}
```

- Interface: `src/interfaces/repositories/I*.ts`
- Impl: `src/repositories/{domain}/*Repository.ts`
- Multi-step writes: `AppDataSource.transaction(...)`

## Entity groups (`src/models/`)

**Commerce:** User, Category, Product, ProductVariant, InventoryLog, Cart, CartItem, CustomerAddress, Order, OrderItem, OrderStatusHistory, OrderDiscount, Payment, PaymentMethod, Coupon, CouponUsage

**Engagement / extras:** Wishlist, ProductReview, ProductRating, ReviewHelpfulVote, ProductQuestion, QuestionAnswer, AnswerHelpfulVote, ProductView, SearchQuery, TrendingProduct, OutOfStockReminder, Notification, NotificationLog, ProductReturn, Refund, AdminActionLog

Some extras exist in schema with little or no service API yet — check services before assuming endpoints exist.

## Seeds

`src/seeds/` — users, categories, products, payment methods, coupons. Prefer idempotent skip-if-exists behavior.

## Rules

1. Column names stay snake_case to match API/frontend.
2. Soft-delete with `deleted_at` where the model already uses it.
3. Order status transitions live on the Order model (`ORDER_TRANSITIONS`) — respect them in services.
