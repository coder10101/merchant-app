import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { MerchantApplication } from '../database/entities/merchant-application.entity';
import { User } from '../database/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { RISK_QUEUE_NAME } from '../risk/risk.constant';
import { ApplicationStatus, UserRole } from '../common/enums/domain.enums';

describe('ApplicationsService (Unit Tests)', () => {
  let service: ApplicationsService;
  let mockAppRepo: any;
  let mockUserRepo: any;
  let mockQueue: any;
  let mockAuditService: any;

  const mockSalesUser1 = {
    id: 'sales-1',
    email: 'sales1@platform.test',
    role: UserRole.SALES,
  };
  const mockSalesUser2 = {
    id: 'sales-2',
    email: 'sales2@platform.test',
    role: UserRole.SALES,
  };

  beforeEach(async () => {
    mockAppRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((app) => Promise.resolve(app)),
      merge: jest
        .fn()
        .mockImplementation((app, dto) => Object.assign(app, dto)),
      create: jest.fn().mockImplementation((dto) => dto),
    };
    mockUserRepo = { findOne: jest.fn() };
    mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    mockAuditService = { log: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(MerchantApplication),
          useValue: mockAppRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getQueueToken(RISK_QUEUE_NAME), useValue: mockQueue },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('Application is viewed and edited by the sales owner', () => {
    it('should allow Sales 1 to view their own application with masked taxId', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app-1',
        businessName: 'Acme Coffee',
        createdById: mockSalesUser1.id,
        taxId: '12-3456789',
        status: ApplicationStatus.DRAFT,
      });

      const result = await service.findOne('app-1', mockSalesUser1);
      expect(result).toBeDefined();
      expect(result.taxId).toBe('***-**-6789');
    });

    it('should THROW ForbiddenException when Sales 2 tries to view Sales 1 application', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app-1',
        createdById: mockSalesUser1.id,
        status: ApplicationStatus.DRAFT,
      });

      await expect(service.findOne('app-1', mockSalesUser2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should THROW ForbiddenException when Sales 2 tries to edit Sales 1 application', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app-1',
        createdById: mockSalesUser1.id,
        status: ApplicationStatus.DRAFT,
      });

      await expect(
        service.update(
          'app-1',
          { businessName: 'Random Name' },
          mockSalesUser2,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // User can only edit the application if it is in DRAFT or REJECTED state. If the application is SUBMITTED or APPROVED, editing should not be allowed.
  describe('Application cannot be updated in SUBMITTED or APPROVED state', () => {
    it('should THROW BadRequestException when updating an application that is already SUBMITTED', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app-1',
        createdById: mockSalesUser1.id,
        status: ApplicationStatus.SUBMITTED,
      });

      await expect(
        service.update('app-1', { businessName: 'New Name' }, mockSalesUser1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should THROW BadRequestException when updating an application that is already APPROVED', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app-1',
        createdById: mockSalesUser1.id,
        status: ApplicationStatus.APPROVED,
      });

      await expect(
        service.update('app-1', { businessName: 'New Name' }, mockSalesUser1),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
