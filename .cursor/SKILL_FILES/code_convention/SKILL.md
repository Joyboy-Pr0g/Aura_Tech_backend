---
name: aura-backend-code-convention
description: >-
  AURA TECH backend coding conventions: domain folders, snake_case DB/API,
  tsyringe injectables, APIResponse/AppError, Joi validators. Use when adding
  controllers, services, repositories, or routes.
---

# Backend Code Convention

## Naming

| Area | Convention |
|------|------------|
| Classes / entity files | PascalCase — `AuthService.ts`, `Order.ts` |
| Routes / validators | `auth.routes.ts`, `auth.validator.ts` |
| DB columns / JSON fields | **snake_case** — `full_name`, `customer_id` |
| Tables | plural snake — `order_items`, `customer_addresses` |
| Interfaces | `IAuthRepository`, DTOs like `CreateUserDto` |
| DI tokens | string matching interface — `'IAuthRepository'` |
| Env | `SCREAMING_SNAKE` |

## Domain module shape

```
routes/{domain}.routes.ts
controllers/{domain}/{Domain}Controller.ts
services/{domain}/{Domain}Service.ts
repositories/{domain}/{Domain}Repository.ts
interfaces/repositories/I{Domain}Repository.ts
validators/{domain}.validator.ts
models/{Entity}.ts
```

## Patterns

- Controllers: thin — try/catch, call service, return `APIResponse`.
- Services: business rules; throw `AppError(statusCode, message)`.
- Repositories: TypeORM via `AppDataSource.getRepository`; expose interface + impl.
- Validation: Joi with `abortEarly: false`, `stripUnknown: true` → `req.validatedData`.
- Soft deletes: `@DeleteDateColumn` / `deleted_at` where used.
- Cloudinary folders: `aura-tech/products/{slug}`, `aura-tech/receipts/{orderId}`.

## TypeScript

- Decorators enabled for TypeORM + tsyringe.
- `strict: true`; `strictPropertyInitialization: false` for entities.
- Do not introduce a second response format — keep `{ success, message, data?, error? }`.

## Do not

- Put business logic in controllers or routes.
- Use `synchronize: true` or edit production schema without migrations.
- Commit real secrets; use `.env` locally and placeholders in `.env.example`.
