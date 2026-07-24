import { PrismaClient } from '@prisma/client';
import { CashRegisterRepository } from './cash-register.repository';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('CashRegisterRepository (integration)', () => {
  let prisma: PrismaClient;
  let repo: CashRegisterRepository;

  const COMPANY_ID = 'test-company';
  const STORE_ID = 'test-store';
  const NOW = Math.floor(Date.now() / 1000);

  async function seedBase() {
    await prisma.company.create({
      data: { id: COMPANY_ID, name: 'Test Company', taxId: '123456789', created_at: NOW, updated_at: NOW },
    });
    await prisma.store.create({
      data: { id: STORE_ID, companyId: COMPANY_ID, name: 'Test Store', created_at: NOW, updated_at: NOW },
    });
  }

  beforeAll(async () => {
    prisma = await setupTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await seedBase();
    repo = new CashRegisterRepository(prisma as never);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('create', () => {
    it('should create an open cash register', async () => {
      const register = await repo.create({
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        name: 'Main',
        opening_amount: 10000,
      });

      expect(register).toBeDefined();
      expect(register.id).toBeDefined();
      expect(register.name).toBe('Main');
      expect(register.status).toBe('open');
      expect(register.opening_amount).toBe(10000);
      expect(register.opened_at).toBeDefined();
    });
  });

  describe('findOpen', () => {
    it('should find the open register', async () => {
      await repo.create({ companyId: COMPANY_ID, storeId: STORE_ID, name: 'Main', opening_amount: 10000 });

      const found = await repo.findOpen(COMPANY_ID, STORE_ID);
      expect(found).not.toBeNull();
      expect(found?.status).toBe('open');
    });

    it('should return null when no open register', async () => {
      const found = await repo.findOpen(COMPANY_ID, STORE_ID);
      expect(found).toBeNull();
    });

    it('should return null after register is closed', async () => {
      const register = await repo.create({
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        name: 'Main',
        opening_amount: 10000,
      });

      await repo.close(register.id, 15000);
      const found = await repo.findOpen(COMPANY_ID, STORE_ID);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all registers for company/store', async () => {
      await repo.create({ companyId: COMPANY_ID, storeId: STORE_ID, name: 'Main', opening_amount: 10000 });
      await repo.create({ companyId: COMPANY_ID, storeId: STORE_ID, name: 'Express', opening_amount: 5000 });

      const registers = await repo.findAll(COMPANY_ID, STORE_ID);
      expect(registers).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should find a register by id', async () => {
      const created = await repo.create({
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        name: 'Main',
        opening_amount: 10000,
      });

      const found = await repo.findById(created.id);
      expect(found?.name).toBe('Main');
    });

    it('should return null for nonexistent id', async () => {
      expect(await repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('close', () => {
    it('should close an open register', async () => {
      const created = await repo.create({
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        name: 'Main',
        opening_amount: 10000,
      });

      const closed = await repo.close(created.id, 15000);
      expect(closed.status).toBe('closed');
      expect(closed.closing_amount).toBe(15000);
      expect(closed.closed_at).toBeDefined();
    });
  });

  describe('buildSummary', () => {
    it('should aggregate sales since register opened', async () => {
      const register = await repo.create({
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        name: 'Main',
        opening_amount: 10000,
      });

      // Create sales after register opened
      await prisma.user.create({
        data: { id: 'user-1', companyId: COMPANY_ID, email: 'test@test.com', password: 'hash', name: 'Test', created_at: NOW, updated_at: NOW },
      });

      await prisma.product.create({
        data: { id: 'prod-1', companyId: COMPANY_ID, storeId: STORE_ID, code: 'W001', name: 'Widget', price_cents: 2500, stock_quantity: 100, created_at: NOW, updated_at: NOW },
      });

      await prisma.sale.create({
        data: {
          companyId: COMPANY_ID,
          storeId: STORE_ID,
          user_id: 'user-1',
          total_cents: 2500,
          payment_method: 'cash',
          status: 'completed',
          created_at: register.opened_at! + 10,
          updated_at: NOW,
        },
      });

      await prisma.sale.create({
        data: {
          companyId: COMPANY_ID,
          storeId: STORE_ID,
          user_id: 'user-1',
          total_cents: 5000,
          payment_method: 'debit',
          status: 'completed',
          created_at: register.opened_at! + 20,
          updated_at: NOW,
        },
      });

      const summary = await repo.buildSummary(COMPANY_ID, STORE_ID, register.opened_at!);
      expect(summary.total_sales_cents).toBe(7500);
      expect(summary.payment_summary).toHaveLength(2);

      const cash = summary.payment_summary.find((s) => s.payment_method === 'cash');
      expect(cash?.total_cents).toBe(2500);
      expect(cash?.count).toBe(1);

      const debit = summary.payment_summary.find((s) => s.payment_method === 'debit');
      expect(debit?.total_cents).toBe(5000);
      expect(debit?.count).toBe(1);
    });

    it('should return zero totals when no sales', async () => {
      const summary = await repo.buildSummary(COMPANY_ID, STORE_ID, 0);
      expect(summary.total_sales_cents).toBe(0);
      expect(summary.payment_summary).toHaveLength(0);
    });
  });
});
