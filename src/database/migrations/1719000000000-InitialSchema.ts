import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1719000000000 implements MigrationInterface {
  name = 'InitialSchema1719000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Enums ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('admin', 'sub_admin', 'customer')
    `);

    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM ('active', 'blocked')
    `);

    // ─── Users ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
        "email"         VARCHAR      NOT NULL,
        "password_hash" VARCHAR      NOT NULL,
        "phone"         VARCHAR,
        "role"          "users_role_enum"   NOT NULL DEFAULT 'customer',
        "status"        "users_status_enum" NOT NULL DEFAULT 'active',
        "deleted_at"    TIMESTAMP,
        "created_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email"  UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone"  UNIQUE ("phone"),
        CONSTRAINT "PK_users"        PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_users_email"  ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone"  ON "users" ("phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role"   ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);

    // ─── Admin Action Logs ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "admin_action_logs" (
        "id"           UUID      NOT NULL DEFAULT gen_random_uuid(),
        "admin_id"     UUID      NOT NULL,
        "action"       VARCHAR   NOT NULL,
        "entity_type"  VARCHAR   NOT NULL,
        "entity_id"    UUID      NOT NULL,
        "changes_json" JSONB,
        "reason"       TEXT,
        "ip_address"   VARCHAR,
        "user_agent"   TEXT,
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_action_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admin_action_logs_admin"
          FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_aal_admin_id"   ON "admin_action_logs" ("admin_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_aal_action"      ON "admin_action_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_aal_entity_id"   ON "admin_action_logs" ("entity_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_aal_created_at"  ON "admin_action_logs" ("created_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_action_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
