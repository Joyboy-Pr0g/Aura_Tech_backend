-- =============================================================================
-- AURA TECH — PostgreSQL bootstrap (runs once on first volume init)
-- =============================================================================
-- Schema/tables are created by TypeORM migrations when the backend starts.
-- This file only prepares extensions and baseline settings.
-- =============================================================================

-- Useful extensions for UUIDs and crypto helpers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional baseline — migrations create all tables/indexes on backend boot
-- SET timezone handled by PostgreSQL default UTC in Alpine image

-- ─── Tables ─────────────────────────────────────────────────────────────────
-- Managed by TypeORM migrations in src/database/migrations/
-- Backend runs: AppDataSource.runMigrations() on startup (see database.ts)

-- ─── Indexes ────────────────────────────────────────────────────────────────
-- Created by migrations — do not duplicate here to avoid drift.

-- ─── Seeds ──────────────────────────────────────────────────────────────────
-- Run manually after deploy if needed:
--   docker compose exec backend npm run seed
