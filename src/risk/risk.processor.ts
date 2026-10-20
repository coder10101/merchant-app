import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RISK_QUEUE_NAME } from './risk.module';
import { MerchantApplication } from '../database/entities/merchant-application.entity';
import { RiskAssessment } from '../database/entities/risk-assessment.entity';

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
    this.logger.log(
      `[BullMQ Worker] Picked up job ID: ${job.id} for application: ${job.data.applicationId}`,
    );
    return {};
  }
}
