---
name: aura-tech-backend
description: >-
  Index of AURA TECH Express backend project skills. Use when working on the
  Node API, TypeORM models, auth, DI, routes, security, IDs, or database.
  Read the matching topic skill before changing code.
---

# AURA TECH Backend — Skill Index

E-commerce API for AURA TECH (Yemen): catalog, cart, orders, bank-transfer payments, addresses, engagement. **Express + TypeScript + TypeORM (PostgreSQL) + Redis + tsyringe**.

Before implementing or reviewing backend work, open the topic skill that matches the task:

| Skill | Path | Use when |
|-------|------|----------|
| Overview | [overview/SKILL.md](overview/SKILL.md) | Onboarding, stack, folders, entry points |
| Code convention | [code_convention/SKILL.md](code_convention/SKILL.md) | Naming, module layout, responses, validators |
| Security | [security/SKILL.md](security/SKILL.md) | JWT, RBAC, rate limits, validation, uploads |
| Architecture | [architecture/SKILL.md](architecture/SKILL.md) | Layers, DI, request flow |
| ID | [id/SKILL.md](id/SKILL.md) | UUIDs, order numbers, slugs |
| DB | [db/SKILL.md](db/SKILL.md) | TypeORM, migrations, entities, seeds |

## Quick rules

1. Flow: route → middleware → controller → service → repository → PostgreSQL.
2. Register new deps in `src/di/registerDependencies.ts`; resolve controllers from the container in routes.
3. Use `APIResponse` / `AppError`; validate with Joi → `req.validatedData`.
4. UUID PKs; never invent Mongo-style ObjectIds or integer PKs.
5. `synchronize: false` — schema changes go through migrations.
6. no comments left after editing

Frontend skills live in the sibling repo: `Aura_Tech/.cursor/SKILL_FILES/`.
