import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLog1792499108872 implements MigrationInterface {
    name = 'CreateAuditLog1792499108872'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATED', 'SUBMITTED', 'ASSIGNED', 'DECISION_RECORDED', 'RISK_PROCESSED')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entityType" character varying(100) NOT NULL, "entityId" uuid NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL, "performedById" uuid, "previousState" jsonb, "newState" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_01993ae76b293d3b866cc3a125" ON "audit_logs"  ("entityType") `);
        await queryRunner.query(`CREATE INDEX "IDX_f23279fad63453147a8efb46cf" ON "audit_logs"  ("entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_371007aca0b12c07d6d2dbdb83" ON "audit_logs"  ("performedById") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_371007aca0b12c07d6d2dbdb83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f23279fad63453147a8efb46cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01993ae76b293d3b866cc3a125"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    }

}
