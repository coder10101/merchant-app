import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RISK_QUEUE_NAME } from './risk.module';

@Processor(RISK_QUEUE_NAME)
export class RiskProcessor extends WorkerHost {
  private readonly logger = new Logger(RiskProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[BullMQ Worker] Picked up job ID: ${job.id} for application: ${job.data.applicationId}`,
    );
    return {};
  }
}
