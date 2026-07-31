import { PrismaClient } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { ImportV1Schema } from './dto/import-v1.schema';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('MigrationService', () => {
  let prisma: PrismaClient;
  let service: MigrationService;

  beforeAll(async () => {
    prisma = await setupTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    service = new MigrationService(prisma as never);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('importFromV1', () => {
    it('rejects the import when a company already exists', async () => {
      await prisma.company.create({
        data: {
          id: '1',
          name: 'Existing Shop',
          taxId: '20-12345678-9',
          created_at: 1,
          updated_at: 1,
        },
      });

      await expect(
        service.importFromV1({
          databaseUrl: 'postgresql://user:pass@example.com/db',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(prisma.company.count()).resolves.toBe(1);
    });
  });
});

describe('ImportV1Schema', () => {
  it('rejects invalid database URLs', () => {
    const result = ImportV1Schema.safeParse({ databaseUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid URL without primaryStoreId', () => {
    const result = ImportV1Schema.safeParse({
      databaseUrl: 'postgresql://user:pass@example.com/db',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid URL with primaryStoreId', () => {
    const result = ImportV1Schema.safeParse({
      databaseUrl: 'postgresql://user:pass@example.com/db',
      primaryStoreId: '4',
    });
    expect(result.success).toBe(true);
  });
});
