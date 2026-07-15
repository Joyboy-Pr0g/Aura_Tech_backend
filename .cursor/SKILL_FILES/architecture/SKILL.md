---
name: aura-backend-architecture
description: >-
  AURA TECH backend architecture: route→controller→service→repository layers,
  tsyringe DI, transactions, APIResponse/error flow. Use when adding endpoints,
  wiring dependencies, or changing request pipelines.
---

# Backend Architecture

## Layered flow

```
HTTP
  → routes (mount + middleware chain)
  → controllers (thin; APIResponse)
  → services (rules; AppError)
  → repositories (TypeORM)
  → PostgreSQL
```

Redis is for JWT blacklist on logout/protect only (not a general cache layer today).

## Middleware order (typical private route)

1. Global rate limit (app-level)
2. `protect` (JWT + blacklist)
3. `authorize([Role...])`
4. `validateRequest(schema)` and/or multer
5. Controller method

## DI (tsyringe)

1. Register in `src/di/registerDependencies.ts`:
   - Repositories as **string tokens** (`REPOSITORY_TOKENS`)
   - Services/controllers as **class tokens**
   - All `registerSingleton`
2. Routes: `container.resolve(XController)` from `src/di/container.ts`
3. Inject: controllers `@inject(Service)`; services `@inject(REPOSITORY_TOKENS.IXxxRepository)`

When adding a domain: create interface + repo + service + controller, register them, then wire routes.

## Errors & responses

- Success/error envelope: `APIResponse` (`src/core/responses/api-response.ts`) — supports `next_cursor` / `has_more` for pagination.
- Domain errors: `AppError` in services; controllers use `getErrorStatusCode`.
- Global `errorHandler` for uncaught errors (opaque 500 for non-operational).

## Transactions

Use `AppDataSource.transaction(...)` for multi-step writes (checkout, payment approval). Checkout example: pessimistic stock locks → create order (`order_number`) → mark cart converted.

## Engagement note

Engagement service may talk to TypeORM directly (no dedicated repository). Prefer full repository + interface when expanding that domain.
