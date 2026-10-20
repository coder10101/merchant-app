import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantApplication } from '../database/entities/merchant-application.entity';
import { RiskAssessment } from '../database/entities/risk-assessment.entity';
import {
  ApplicationStatus,
  RiskStatus,
  RiskTier,
} from '../common/enums/domain.enums';
import { RISK_QUEUE_NAME } from './risk.constant';

@Processor(RISK_QUEUE_NAME)
export class RiskProcessor extends WorkerHost {
  private readonly logger = new Logger(RiskProcessor.name);

  constructor(
    @InjectRepository(MerchantApplication)
    private readonly applicationRepository: Repository<MerchantApplication>,
    @InjectRepository(RiskAssessment)
    private readonly riskAssessmentRepository: Repository<RiskAssessment>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { applicationId, monthlyVolume } = job.data;
    this.logger.log(
      `[BullMQ Worker] Starting risk evaluation for application: ${applicationId}`,
    );

    // check if already evaluated
    const existingAssessment = await this.riskAssessmentRepository.findOne({
      where: { applicationId },
    });

    if (existingAssessment) {
      this.logger.warn(
        `[BullMQ Worker] Idempotency hit: Application ${applicationId} already evaluated. Skipping.`,
      );
      return { skipped: true, assessmentId: existingAssessment.id };
    }

    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      this.logger.error(
        `[BullMQ Worker] Application ${applicationId} not found in database.`,
      );
      return;
    }

    // 3rd-party KYB network call (1.5 seconds latency)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // risk evaluation logic
    const isHighVolume = monthlyVolume && monthlyVolume > 100000;
    const score = isHighVolume ? 62 : 88;
    const riskTier = isHighVolume ? RiskTier.MEDIUM : RiskTier.LOW;
    const flags = isHighVolume ? ['HIGH_MONTHLY_VOLUME_REVIEW_REQUIRED'] : [];
    const providerReference = `KYB-MOCK-${Date.now().toString(36).toUpperCase()}`;

    // persist RiskAssessment entity in PostgreSQL
    const assessment = this.riskAssessmentRepository.create({
      applicationId: application.id,
      score,
      riskTier,
      providerReference,
      flags,
      rawPayload: {
        provider: 'MockKYBProvider_v2',
        checkedAt: new Date().toISOString(),
        score,
        tier: riskTier,
        riskFactors: flags,
        businessVerified: true,
      },
    });
    await this.riskAssessmentRepository.save(assessment);

    // update the app
    application.riskStatus = isHighVolume
      ? RiskStatus.FLAGGED
      : RiskStatus.PASSED;
    application.status = ApplicationStatus.UNDER_REVIEW;
    await this.applicationRepository.save(application);

    this.logger.log(
      `[BullMQ Worker] Risk evaluation completed: Score=${score}, Tier=${riskTier}, New Status=${application.status}`,
    );

    return { score, riskTier, flags };
  }
}
