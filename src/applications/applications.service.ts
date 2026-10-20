import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantApplication } from '../database/entities/merchant-application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  ApplicationStatus,
  ReviewDecision,
  RiskStatus,
  UserRole,
} from '../common/enums/domain.enums';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { User } from '../database/entities/user.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { RISK_QUEUE_NAME } from '../risk/risk.module';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(MerchantApplication)
    private readonly applicationRepository: Repository<MerchantApplication>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue(RISK_QUEUE_NAME)
    private readonly riskQueue: Queue,
  ) {}

  private maskSensitiveFields(
    application: MerchantApplication,
  ): MerchantApplication {
    if (application.taxId) {
      application.taxId = `***-**-${application.taxId.slice(-4)}`;
    }
    return application;
  }

  async create(
    createDto: CreateApplicationDto,
    user: AuthenticatedUser,
  ): Promise<MerchantApplication> {
    const application = this.applicationRepository.create({
      ...createDto,
      status: ApplicationStatus.DRAFT,
      riskStatus: RiskStatus.NOT_STARTED,
      createdById: user.id,
    });

    const saved = await this.applicationRepository.save(application);
    return this.maskSensitiveFields(saved);
  }

  async findAll(query: QueryApplicationDto, user: AuthenticatedUser) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.createdBy', 'createdBy')
      .leftJoinAndSelect('app.assignedReviewer', 'assignedReviewer')
      .skip(skip)
      .take(limit)
      .orderBy('app.createdAt', 'DESC');

    // SALES users only see their own applications
    if (user.role === UserRole.SALES) {
      queryBuilder.andWhere('app.createdById = :userId', { userId: user.id });
    }

    //filter by status
    if (query.status) {
      queryBuilder.andWhere('app.status = :status', { status: query.status });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((app) => this.maskSensitiveFields(app)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: {
        createdBy: true,
        assignedReviewer: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // SALES useer cannot view applications created by others
    if (user.role === UserRole.SALES && application.createdById !== user.id) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to view this application',
      );
    }

    return this.maskSensitiveFields(application);
  }

  async update(
    id: string,
    updateDto: UpdateApplicationDto,
    user: AuthenticatedUser,
  ): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // SALES user cannot modify applications created by others
    if (user.role === UserRole.SALES && application.createdById !== user.id) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to modify this application',
      );
    }

    // Edits only allowed in DRAFT or ACTION_REQUIRED
    const editableStatuses = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.ACTION_REQUIRED,
    ];
    if (!editableStatuses.includes(application.status)) {
      throw new BadRequestException(
        `Application cannot be modified in status "${application.status}". Edits are only permitted in DRAFT or ACTION_REQUIRED.`,
      );
    }

    this.applicationRepository.merge(application, updateDto);
    const updated = await this.applicationRepository.save(application);
    return this.maskSensitiveFields(updated);
  }

  async submit(
    id: string,
    user: AuthenticatedUser,
  ): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    // only creator can submit
    if (user.role === UserRole.SALES && application.createdById !== user.id) {
      throw new ForbiddenException(
        'Access denied: You can only submit your own applications',
      );
    }
    const submittableStatuses = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.ACTION_REQUIRED,
    ];
    if (!submittableStatuses.includes(application.status)) {
      throw new BadRequestException(
        `Cannot submit application in status "${application.status}". Application must be DRAFT or ACTION_REQUIRED.`,
      );
    }
    application.status = ApplicationStatus.SUBMITTED;
    application.riskStatus = RiskStatus.PENDING;
    application.submittedAt = new Date();
    const saved = await this.applicationRepository.save(application);

    // bg job to evaluate risk asynchronously using BullMQ
    await this.riskQueue.add(
      'evaluate-merchant',
      {
        applicationId: saved.id,
        businessName: saved.businessName,
        taxId: saved.taxId,
        monthlyVolume: saved.requestedProcessingInfo?.estimatedMonthlyVolume,
      },
      {
        jobId: `risk-eval:${saved.id}:${saved.version}`, // Idempotency key
        attempts: 3, // Retries
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    );

    return this.maskSensitiveFields(saved);
  }

  async assignReviewer(
    id: string,
    reviewerId: string,
    user: AuthenticatedUser,
  ): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    // Check the target user is actually a REVIEWER
    const reviewer = await this.userRepository.findOne({
      where: { id: reviewerId },
    });
    if (!reviewer || reviewer.role !== UserRole.REVIEWER) {
      throw new BadRequestException(
        `Target user with ID ${reviewerId} is not a valid REVIEWER`,
      );
    }
    application.assignedReviewerId = reviewer.id;
    // Update to UNDER_REVIEW if currently SUBMITTED
    if (application.status === ApplicationStatus.SUBMITTED) {
      application.status = ApplicationStatus.UNDER_REVIEW;
    }
    const saved = await this.applicationRepository.save(application);
    return this.maskSensitiveFields(saved);
  }

  async recordDecision(
    id: string,
    decisionDto: ReviewDecisionDto,
    user: AuthenticatedUser,
  ): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    // Only the assigned reviewer  can decide
    if (
      user.role === UserRole.REVIEWER &&
      application.assignedReviewerId !== user.id
    ) {
      throw new ForbiddenException(
        'Access denied: Only the assigned reviewer can record a decision on this application',
      );
    }
    // must be UNDER_REVIEW to decide
    if (application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Cannot record decision on application in status "${application.status}". Application must be UNDER_REVIEW.`,
      );
    }
    switch (decisionDto.decision) {
      case ReviewDecision.APPROVE:
        application.status = ApplicationStatus.APPROVED;
        application.reviewedAt = new Date();
        break;
      case ReviewDecision.REJECT:
        application.status = ApplicationStatus.REJECTED;
        application.reviewedAt = new Date();
        break;
      case ReviewDecision.REQUEST_INFO:
        application.status = ApplicationStatus.ACTION_REQUIRED;
        break;
    }
    const saved = await this.applicationRepository.save(application);
    return this.maskSensitiveFields(saved);
  }
}
