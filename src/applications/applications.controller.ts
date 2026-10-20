import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
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
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

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

  @Get()
  @Roles(UserRole.SALES, UserRole.REVIEWER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List applications with pagination and status filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of applications returned',
  })
  async findAll(
    @Query() query: QueryApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.findAll(query, user);
  }

  @Get(':id')
  @Roles(UserRole.SALES, UserRole.REVIEWER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get application details by ID (enforces object-level isolation for Sales)',
  })
  @ApiResponse({ status: 200, description: 'Application details returned' })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden: Sales user attempting to access another user's application",
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SALES, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Update application draft (Sales or Admin only, editable states only)',
  })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Application is not in an editable status',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Cannot edit application owned by another user',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.update(id, updateDto, user);
  }
}
