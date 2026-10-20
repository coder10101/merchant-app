import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '../../common/enums/domain.enums';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Index()
  @Column({ type: 'uuid' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  performedById: string | null;

  @Column({ type: 'jsonb', nullable: true })
  previousState: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newState: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
