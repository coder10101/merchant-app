import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/domain.enums';

@ApiTags('Merchant Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.SALES, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new merchant application draft (Sales or Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Application draft created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Reviewers cannot create applications',
  })
  async create(
    @Body() createDto: CreateApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.create(createDto, user);
  }
}
