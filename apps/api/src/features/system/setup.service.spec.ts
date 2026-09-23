import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { SetupService } from './setup.service';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('SetupService (integration)', () => {
  let prisma: PrismaClient;
  let service: SetupService;
  let config: ConfigService;

  const DTO = {
    companyName: 'Test Shop',
    taxId: '20-12345678-9',
    adminEmail: 'admin@test.com',
    adminPassword: 'secret123',
  };

  const ACCOUNT = {
    sub: 'client_123',
    email: 'owner@acme.com',
    name: 'Juan Perez',
    planSlug: 'pro',
    planName: 'Pro',
    maxStores: 2,
    features: { cloudSync: true, multiStore: true },
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2027-01-01T00:00:00.000Z',
  };

  beforeAll(async () => {
    prisma = await setupTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    config = new ConfigService();
    service = new SetupService(prisma as never, config);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('getSetupStatus', () => {
    it('returns isInitialized=false when no company exists', async () => {
      await expect(service.getSetupStatus()).resolves.toEqual({ isInitialized: false });
    });

    it('returns isInitialized=true after initialization', async () => {
      await service.initCompany(DTO);
      await expect(service.getSetupStatus()).resolves.toEqual({ isInitialized: true });
    });
  });

  describe('initCompany', () => {
    it('creates company, store and admin atomically', async () => {
      const result = await service.initCompany(DTO);

      expect(result.companyId).toBeDefined();
      expect(result.storeId).toBeDefined();
      expect(result.userId).toBeDefined();

      const company = await prisma.company.findUnique({ where: { id: result.companyId } });
      const store = await prisma.store.findUnique({ where: { id: result.storeId } });
      const user = await prisma.user.findUnique({ where: { id: result.userId } });

      expect(company?.name).toBe('Test Shop');
      expect(company?.taxId).toBe(DTO.taxId);
      expect(store?.companyId).toBe(result.companyId);
      expect(store?.name).toBe('Sucursal Principal');
      expect(user?.email).toBe(DTO.adminEmail);
      expect(user?.role).toBe('admin');

      await expect(prisma.company.count()).resolves.toBe(1);
      await expect(prisma.store.count()).resolves.toBe(1);
      await expect(prisma.user.count()).resolves.toBe(1);

      expect(config.get('LOCAL_COMPANY_ID')).toBe(result.companyId);
      expect(config.get('LOCAL_STORE_ID')).toBe(result.storeId);
    });

    it('persists linked account on the company when provided', async () => {
      const result = await service.initCompany({ ...DTO, account: ACCOUNT });

      const company = await prisma.company.findUnique({ where: { id: result.companyId } });

      expect(company?.email).toBe(ACCOUNT.email);

      const config = JSON.parse(company?.config ?? 'null') as
        | { license?: unknown }
        | null;
      expect(config?.license).toEqual(ACCOUNT);
    });

    it('creates a company without account fields when not linked', async () => {
      const result = await service.initCompany(DTO);

      const company = await prisma.company.findUnique({ where: { id: result.companyId } });

      expect(company?.email).toBeNull();
      expect(company?.config).toBeNull();
    });

    it('rejects re-initialization with ConflictException', async () => {
      await service.initCompany(DTO);

      await expect(
        service.initCompany({ ...DTO, adminEmail: 'other@test.com' }),
      ).rejects.toThrow(ConflictException);

      await expect(prisma.company.count()).resolves.toBe(1);
    });

    it('rolls back all rows when a step fails mid-transaction', async () => {
      const failingPrisma = prisma.$extends({
        query: {
          user: {
            async create() {
              throw new Error('simulated user creation failure');
            },
          },
        },
      });

      const failingService = new SetupService(failingPrisma as never, config);

      await expect(failingService.initCompany(DTO)).rejects.toThrow(
        'simulated user creation failure',
      );

      await expect(prisma.company.count()).resolves.toBe(0);
      await expect(prisma.store.count()).resolves.toBe(0);
      await expect(prisma.user.count()).resolves.toBe(0);

      const retry = await service.initCompany(DTO);
      expect(retry.companyId).toBeDefined();
      await expect(prisma.company.count()).resolves.toBe(1);
    });
  });
});
