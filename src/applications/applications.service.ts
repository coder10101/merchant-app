import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantApplication } from '../database/entities/merchant-application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ApplicationStatus, RiskStatus } from '../common/enums/domain.enums';

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
}
