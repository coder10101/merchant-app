import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditAction } from '../common/enums/domain.enums';
import { maskTaxId } from '../common/utils/sanitizer.util';

export interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedById?: string | null;
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  private sanitizePayload(payload: Record<string, any>): Record<string, any> {
    const copy = JSON.parse(JSON.stringify(payload));

    const secretKeys = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'secret',
    ];
    for (const key of secretKeys) {
      if (key in copy) {
        delete copy[key];
      }
    }

    if (copy.taxId && typeof copy.taxId === 'string') {
      copy.taxId = maskTaxId(copy.taxId);
    }

    return copy;
  }

  async log(params: AuditLogParams): Promise<AuditLog> {
    // sanitize previous and new states to remove secrets and mask tax IDs
    const sanitizedPrevious = params.previousState
      ? this.sanitizePayload(params.previousState)
      : null;

    const sanitizedNew = params.newState
      ? this.sanitizePayload(params.newState)
      : null;

    // create the immutable audit log record
    const auditEntry = this.auditLogRepository.create({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      performedById: params.performedById ?? null,
      previousState: sanitizedPrevious,
      newState: sanitizedNew,
      metadata: params.metadata ?? null,
    });

    const saved = await this.auditLogRepository.save(auditEntry);
    this.logger.log(
      `[Audit Trail] Action=${params.action} Entity=${params.entityType}:${params.entityId} PerformedBy=${params.performedById ?? 'SYSTEM'}`,
    );

    return saved;
  }
}
