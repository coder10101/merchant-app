import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RiskProcessor } from './risk.processor';
import { MerchantApplication } from '../database/entities/merchant-application.entity';
import { RiskAssessment } from '../database/entities/risk-assessment.entity';

export const RISK_QUEUE_NAME = 'risk-evaluation';

@Module({
  imports: [
    // Connect BullMQ to Redis
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    // Register the specific queue for risk evaluations
    BullModule.registerQueue({
      name: RISK_QUEUE_NAME,
    }),
    TypeOrmModule.forFeature([MerchantApplication, RiskAssessment]),
  ],
  providers: [RiskProcessor],
  exports: [BullModule],
})
export class RiskModule {}
