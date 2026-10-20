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
  RiskStatus,
  UserRole,
} from '../common/enums/domain.enums';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(MerchantApplication)
    private readonly applicationRepository: Repository<MerchantApplication>,
  ) {}

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

    if (saved.taxId) {
      saved.taxId = `***-**-${saved.taxId.slice(-4)}`;
    }

    return saved;
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

    const sanitizedData = data.map((app) => {
      if (app.taxId) {
        app.taxId = `***-**-${app.taxId.slice(-4)}`;
      }
      return app;
    });

    return {
      data: sanitizedData,
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
    //  SALES useer cannot view applications created by others
    if (user.role === UserRole.SALES && application.createdById !== user.id) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to view this application',
      );
    }
    if (application.taxId) {
      application.taxId = `***-**-${application.taxId.slice(-4)}`;
    }
    return application;
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
    if (updated.taxId) {
      updated.taxId = `***-**-${updated.taxId.slice(-4)}`;
    }
    return updated;
  }
}
