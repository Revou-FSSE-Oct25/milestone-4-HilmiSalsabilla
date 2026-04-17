import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests require a live database.
 * Set TEST_DATABASE_URL in your environment before running these.
 *
 * Run: npm run test:e2e
 */
describe('RevoBank API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let accountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const testUser = {
      email: `e2e-${Date.now()}@test.com`,
      password: 'Password123!',
      firstName: 'E2E',
      lastName: 'Test',
    };

    it('POST /auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          authToken = res.body.access_token;
        });
    });

    it('POST /auth/register - should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /auth/login - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('POST /auth/login - should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass123!' })
        .expect(401);
    });
  });

  describe('Accounts', () => {
    it('POST /accounts - should create a savings account', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'SAVINGS' })
        .expect(201)
        .expect((res) => {
          expect(res.body.account.type).toBe('SAVINGS');
          accountId = res.body.account.id;
        });
    });

    it('GET /accounts - should list user accounts', () => {
      return request(app.getHttpServer())
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.accounts).toBeInstanceOf(Array);
        });
    });

    it('GET /accounts - should require authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/accounts').expect(401);
    });
  });

  describe('Transactions', () => {
    it('POST /transactions/deposit - should deposit funds', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountId, amount: 1000, description: 'E2E deposit' })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Deposit successful');
        });
    });

    it('POST /transactions/withdraw - should withdraw funds', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountId, amount: 200, description: 'E2E withdrawal' })
        .expect(201);
    });

    it('POST /transactions/withdraw - should reject insufficient balance', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountId, amount: 999999 })
        .expect(400);
    });

    it('GET /transactions - should list user transactions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.transactions).toBeInstanceOf(Array);
          expect(res.body.transactions.length).toBeGreaterThan(0);
        });
    });
  });
});
