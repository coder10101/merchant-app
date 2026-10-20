import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndApplications1792483272718 implements MigrationInterface {
    name = 'CreateUsersAndApplications1792483272718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'REVIEWER', 'SALES')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "fullName" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'SALES', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."merchant_applications_businesstype_enum" AS ENUM('SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC', 'CORPORATION')`);
        await queryRunner.query(`CREATE TYPE "public"."merchant_applications_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."merchant_applications_riskstatus_enum" AS ENUM('NOT_STARTED', 'PENDING', 'PASSED', 'FLAGGED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "merchant_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessName" character varying(255) NOT NULL, "legalBusinessName" character varying(255) NOT NULL, "businessType" "public"."merchant_applications_businesstype_enum" NOT NULL, "taxId" character varying(64) NOT NULL, "ownerInfo" jsonb NOT NULL, "requestedProcessingInfo" jsonb NOT NULL, "status" "public"."merchant_applications_status_enum" NOT NULL DEFAULT 'DRAFT', "riskStatus" "public"."merchant_applications_riskstatus_enum" NOT NULL DEFAULT 'NOT_STARTED', "createdById" uuid NOT NULL, "assignedReviewerId" uuid, "version" integer NOT NULL, "submittedAt" TIMESTAMP WITH TIME ZONE, "reviewedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09b9df0877db73b8a232c8c7ed4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f9b444dd14c28c317a317eddac" ON "merchant_applications"  ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_7eaffe0b47c39ed3fd0f17aa66" ON "merchant_applications"  ("riskStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_524da5b7f60bec9e2c86797f58" ON "merchant_applications"  ("createdById") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cebc08ee446c36158cbd584a0" ON "merchant_applications"  ("assignedReviewerId") `);
        await queryRunner.query(`ALTER TABLE "merchant_applications" ADD CONSTRAINT "FK_524da5b7f60bec9e2c86797f58c" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "merchant_applications" ADD CONSTRAINT "FK_7cebc08ee446c36158cbd584a0a" FOREIGN KEY ("assignedReviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "merchant_applications" DROP CONSTRAINT "FK_7cebc08ee446c36158cbd584a0a"`);
        await queryRunner.query(`ALTER TABLE "merchant_applications" DROP CONSTRAINT "FK_524da5b7f60bec9e2c86797f58c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cebc08ee446c36158cbd584a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_524da5b7f60bec9e2c86797f58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7eaffe0b47c39ed3fd0f17aa66"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f9b444dd14c28c317a317eddac"`);
        await queryRunner.query(`DROP TABLE "merchant_applications"`);
        await queryRunner.query(`DROP TYPE "public"."merchant_applications_riskstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."merchant_applications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."merchant_applications_businesstype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
