import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuspiciousUserReports1720800000000 implements MigrationInterface {
  name = 'SuspiciousUserReports1720800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suspicious_user_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "category" varchar(32) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'open',
        "signals" jsonb NOT NULL DEFAULT '{}',
        "summary" text NOT NULL,
        "last_detected_at" TIMESTAMP NOT NULL,
        "reviewed_by_admin_id" uuid,
        "reviewed_at" TIMESTAMP,
        "admin_note" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suspicious_user_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_suspicious_user_reports_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_suspicious_user_reports_admin" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_suspicious_user_reports_user_id"
      ON "suspicious_user_reports" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_suspicious_user_reports_status"
      ON "suspicious_user_reports" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_suspicious_user_reports_last_detected"
      ON "suspicious_user_reports" ("last_detected_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "suspicious_user_reports"`);
  }
}
