import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRiskAssessment1792493616625 implements MigrationInterface {
    name = 'CreateRiskAssessment1792493616625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."risk_assessments_risktier_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`CREATE TABLE "risk_assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid NOT NULL, "score" integer NOT NULL, "riskTier" "public"."risk_assessments_risktier_enum" NOT NULL, "providerReference" character varying(100) NOT NULL, "flags" text array NOT NULL DEFAULT '{}', "rawPayload" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2717ff3f294d30390a712653d63" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a4b8d556307e9f80a05bb73614" ON "risk_assessments"  ("applicationId") `);
        await queryRunner.query(`ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_a4b8d556307e9f80a05bb73614e" FOREIGN KEY ("applicationId") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_a4b8d556307e9f80a05bb73614e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4b8d556307e9f80a05bb73614"`);
        await queryRunner.query(`DROP TABLE "risk_assessments"`);
        await queryRunner.query(`DROP TYPE "public"."risk_assessments_risktier_enum"`);
    }

}
