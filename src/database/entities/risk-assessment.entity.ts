import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MerchantApplication } from './merchant-application.entity';
import { RiskTier } from '../../common/enums/domain.enums';

@Entity('risk_assessments')
export class RiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => MerchantApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: MerchantApplication;

  @Column({ type: 'int' })
  score: number; // 0 to 100

  @Column({
    type: 'enum',
    enum: RiskTier,
  })
  riskTier: RiskTier;

  @Column({ type: 'varchar', length: 100 })
  providerReference: string;

  @Column({ type: 'text', array: true, default: '{}' })
  flags: string[];

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
