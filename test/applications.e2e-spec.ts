import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BusinessType } from '../src/common/enums/domain.enums';

describe('Merchant Applications (E2E Integration & Security)', () => {
  let app: INestApplication;
  let sales1Token: string;
  let sales2Token: string;
  let createdAppId: string;
  let reviewerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // sales 1
    const resSales1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'sales1@platform.test', password: 'Password123!' });
    sales1Token = resSales1.body.accessToken;

    // sales 2
    const resSales2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'sales2@platform.test', password: 'Password123!' });
    sales2Token = resSales2.body.accessToken;

    // log in as Reviewer
    const resReviewer = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'reviewer@platform.test', password: 'Password123!' });
    reviewerToken = resReviewer.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Sales 1 user should create a new application draft', async () => {
    const payload = {
      businessName: 'Apex E2E Roasters',
      legalBusinessName: 'Apex E2E Roasters LLC',
      businessType: BusinessType.LLC,
      taxId: '12-3456789',
      ownerInfo: {
        fullName: 'Jane Doe',
        email: 'jane@apexe2e.test',
        phone: '+1-555-0100',
        address: {
          street: '123 Market St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
        },
      },
      requestedProcessingInfo: {
        estimatedMonthlyVolume: 50000,
        averageTicketSize: 120,
        currency: 'USD',
      },
    };

    const res = await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${sales1Token}`)
      .send(payload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.taxId).toBe('***-**-6789');

    createdAppId = res.body.id;
  });

  // Proves Sales 2 cannot read Sales 1 user's application!
  it('Sales 2 user must get 403 Forbidden trying to view Sales 1 application', async () => {
    await request(app.getHttpServer())
      .get(`/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${sales2Token}`)
      .expect(403);
  });

  // Proves Sales 2 user cannot modify Sales 1 user's application!
  it('Sales 2 must get 403 Forbidden trying to modify Sales 1 users application', async () => {
    await request(app.getHttpServer())
      .patch(`/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${sales2Token}`)
      .send({ businessName: 'Random Name' })
      .expect(403);
  });

  // Sales 1 user can view their own application
  it('Sales 1 user can view their own application details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${sales1Token}`)
      .expect(200);
    expect(res.body.id).toBe(createdAppId);
    expect(res.body.businessName).toBe('Apex E2E Roasters');
  });

  // Submitted application cannot be modified

  it('Once submitted, application cannot be modified', async () => {
    await request(app.getHttpServer())
      .post(`/applications/${createdAppId}/submit`)
      .set('Authorization', `Bearer ${sales1Token}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${sales1Token}`)
      .send({ businessName: 'Illegal Update' })
      .expect(400);
  });

  it('Unassigned Reviewer must get 403 Forbidden from deciding an application', async () => {
    await request(app.getHttpServer())
      .post(`/applications/${createdAppId}/decision`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ decision: 'APPROVE' })
      .expect(403);
  });
});
