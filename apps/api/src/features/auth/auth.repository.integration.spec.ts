import { PrismaClient } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('AuthRepository (integration)', () => {
  let prisma: PrismaClient;
  let repo: AuthRepository;

  const COMPANY_ID = 'test-company';
  const NOW = Math.floor(Date.now() / 1000);

  async function seedBase() {
    await prisma.company.create({
      data: { id: COMPANY_ID, name: 'Test Company', taxId: '123456789', created_at: NOW, updated_at: NOW },
    });
  }

  async function seedUser(overrides: { email?: string; password?: string; is_active?: boolean } = {}) {
    return prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        companyId: COMPANY_ID,
        email: overrides.email ?? 'admin@arcon.com',
        password: overrides.password ?? '$2a$10$hashedpassword',
        name: 'Admin User',
        role: 'admin',
        is_active: overrides.is_active ?? true,
        created_at: NOW,
        updated_at: NOW,
      },
    });
  }

  beforeAll(async () => {
    prisma = await setupTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await seedBase();
    repo = new AuthRepository(prisma as never);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('findActiveByEmail', () => {
    it('should find an active user by email', async () => {
      await seedUser({ email: 'admin@arcon.com' });

      const user = await repo.findActiveByEmail('admin@arcon.com');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('admin@arcon.com');
      expect(user?.role).toBe('admin');
    });

    it('should return null for nonexistent email', async () => {
      const user = await repo.findActiveByEmail('nobody@arcon.com');
      expect(user).toBeNull();
    });

    it('should return null for inactive user', async () => {
      await seedUser({ email: 'inactive@arcon.com', is_active: false });

      const user = await repo.findActiveByEmail('inactive@arcon.com');
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by id with selected fields', async () => {
      const created = await seedUser();

      const user = await repo.findById(created.id);
      expect(user).not.toBeNull();
      expect(user?.email).toBe('admin@arcon.com');
      expect(user?.role).toBe('admin');
      expect(user?.companyId).toBe(COMPANY_ID);
    });

    it('should return null for nonexistent id', async () => {
      const user = await repo.findById('nonexistent');
      expect(user).toBeNull();
    });

    it('should not include password in result', async () => {
      const created = await seedUser();

      const user = await repo.findById(created.id);
      expect(user).not.toHaveProperty('password');
    });
  });
});
