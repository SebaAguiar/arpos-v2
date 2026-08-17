import { PrismaClient } from '@prisma/client';
import { SalesRepository } from './sales.repository';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('SalesRepository (integration)', () => {
  let prisma: PrismaClient;
  let repo: SalesRepository;
  let tenantContext: TenantContextService;

  const COMPANY_ID = 'test-company';
  const STORE_ID = 'test-store';
  const USER_ID = 'test-user';
  const NOW = Math.floor(Date.now() / 1000);

  async function seedBase() {
    await prisma.company.create({
      data: { id: COMPANY_ID, name: 'Test Company', taxId: '123456789', created_at: NOW, updated_at: NOW },
    });
    await prisma.store.create({
      data: { id: STORE_ID, companyId: COMPANY_ID, name: 'Test Store', created_at: NOW, updated_at: NOW },
    });
    await prisma.user.create({
      data: {
        id: USER_ID,
        companyId: COMPANY_ID,
        email: 'test@arcom.com',
        password: 'hashed',
        name: 'Test User',
        role: 'admin',
        created_at: NOW,
        updated_at: NOW,
      },
    });
    await prisma.product.create({
      data: {
        id: 'prod-1',
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        code: 'W001',
        name: 'Widget',
        price_cents: 2500,
        stock_quantity: 100,
        created_at: NOW,
        updated_at: NOW,
      },
    });
    await prisma.product.create({
      data: {
        id: 'prod-2',
        companyId: COMPANY_ID,
        storeId: STORE_ID,
        code: 'G001',
        name: 'Gadget',
        price_cents: 5000,
        stock_quantity: 50,
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

    tenantContext = new TenantContextService();
    tenantContext.setCompanyId(COMPANY_ID);
    tenantContext.setStoreId(STORE_ID);
    tenantContext.setUserId(USER_ID);

    repo = new SalesRepository(prisma as never, tenantContext);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('create', () => {
    it('should create a sale with items', async () => {
      const sale = await repo.create({
        items: [{ productId: 'prod-1', quantity: 2, unit_price_cents: 2500 }],
        total_cents: 5000,
        payment_method: 'cash',
      });

      expect(sale).toBeDefined();
      expect(sale.id).toBeDefined();
      expect(sale.total_cents).toBe(5000);
      expect(sale.payment_method).toBe('cash');
      expect(sale.status).toBe('completed');
      expect(sale.companyId).toBe(COMPANY_ID);
      expect(sale.storeId).toBe(STORE_ID);
      expect(sale.user_id).toBe(USER_ID);
    });

    it('should decrement stock after sale', async () => {
      await repo.create({
        items: [{ productId: 'prod-1', quantity: 3, unit_price_cents: 2500 }],
        total_cents: 7500,
        payment_method: 'cash',
      });

      const product = await prisma.product.findUnique({ where: { id: 'prod-1' } });
      expect(product?.stock_quantity).toBe(97);
    });

    it('should throw when product not found', async () => {
      await expect(
        repo.create({
          items: [{ productId: 'nonexistent', quantity: 1, unit_price_cents: 1000 }],
          total_cents: 1000,
          payment_method: 'cash',
        }),
      ).rejects.toThrow('Product nonexistent not found');
    });

    it('should throw when insufficient stock', async () => {
      await expect(
        repo.create({
          items: [{ productId: 'prod-1', quantity: 200, unit_price_cents: 2500 }],
          total_cents: 500000,
          payment_method: 'cash',
        }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should create multiple items in one sale', async () => {
      const sale = await repo.create({
        items: [
          { productId: 'prod-1', quantity: 1, unit_price_cents: 2500 },
          { productId: 'prod-2', quantity: 2, unit_price_cents: 5000 },
        ],
        total_cents: 12500,
        payment_method: 'debit',
      });

      const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
      expect(items).toHaveLength(2);
    });

    it('should handle discount_cents and tax_cents', async () => {
      const sale = await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2000,
        discount_cents: 500,
        tax_cents: 375,
        payment_method: 'credit',
      });

      expect(sale.discount_cents).toBe(500);
      expect(sale.tax_cents).toBe(375);
    });
  });

  describe('findAll', () => {
    it('should return sales for current tenant', async () => {
      await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2500,
        payment_method: 'cash',
      });

      const sales = await repo.findAll();
      expect(sales).toHaveLength(1);
      expect(sales[0].total_cents).toBe(2500);
    });

    it('should filter by status', async () => {
      await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2500,
        payment_method: 'cash',
      });

      const completed = await repo.findAll({ status: 'completed' });
      expect(completed).toHaveLength(1);

      const cancelled = await repo.findAll({ status: 'cancelled' });
      expect(cancelled).toHaveLength(0);
    });

    it('should filter by date range', async () => {
      await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2500,
        payment_method: 'cash',
      });

      const now = Math.floor(Date.now() / 1000);
      const sales = await repo.findAll({ from: now - 10, to: now + 10 });
      expect(sales).toHaveLength(1);

      const old = await repo.findAll({ from: now + 100 });
      expect(old).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2500,
        payment_method: 'cash',
      });

      await repo.create({
        items: [{ productId: 'prod-2', quantity: 1, unit_price_cents: 5000 }],
        total_cents: 5000,
        payment_method: 'debit',
      });

      const stats = await repo.getStats();
      expect(stats.totalSales).toBe(2);
      expect(stats.totalRevenue).toBe(7500);
      expect(stats.averageTicket).toBe(3750);
    });
  });

  describe('getSalesByPaymentMethod', () => {
    it('should group sales by payment method', async () => {
      await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2500,
        payment_method: 'cash',
      });

      await repo.create({
        items: [{ productId: 'prod-2', quantity: 1, unit_price_cents: 5000 }],
        total_cents: 5000,
        payment_method: 'debit',
      });

      await repo.create({
        items: [{ productId: 'prod-1', quantity: 1, unit_price_cents: 2500 }],
        total_cents: 2500,
        payment_method: 'cash',
      });

      const grouped = await repo.getSalesByPaymentMethod();
      expect(grouped).toHaveLength(2);

      const cash = grouped.find((g: { payment_method: string }) => g.payment_method === 'cash');
      expect(cash?.count).toBe(2);
      expect(cash?.total_cents).toBe(5000);

      const debit = grouped.find((g: { payment_method: string }) => g.payment_method === 'debit');
      expect(debit?.count).toBe(1);
      expect(debit?.total_cents).toBe(5000);
    });
  });
});
