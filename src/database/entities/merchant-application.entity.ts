import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  VersionColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import {
  ApplicationStatus,
  RiskStatus,
  BusinessType,
} from '../../common/enums/domain.enums';

export interface OwnerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface RequestedProcessingInfo {
  estimatedMonthlyVolume: number;
  averageTicketSize: number;
  currency: string;
}

@Entity('merchant_applications')
export class MerchantApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @Column({ type: 'varchar', length: 255 })
  legalBusinessName: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
  })
  businessType: BusinessType;

  
  @Column({ type: 'varchar', length: 64 })
  taxId: string;

  @Column({ type: 'jsonb' })
  ownerInfo: OwnerInfo;

  @Column({ type: 'jsonb' })
  requestedProcessingInfo: RequestedProcessingInfo;

  @Index()
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Index()
  @Column({
    type: 'enum',
    enum: RiskStatus,
    default: RiskStatus.NOT_STARTED,
  })
  riskStatus: RiskStatus;

  // Sales Representative who created this application
  @Index()
  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  // The Reviewer assigned to evaluate this application
  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedReviewerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedReviewerId' })
  assignedReviewer: User | null;

  // Version column
  @VersionColumn()
  version: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
