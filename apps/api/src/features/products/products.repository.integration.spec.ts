import { PrismaClient } from '@prisma/client';
import { ProductsRepository } from './products.repository';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('ProductsRepository (integration)', () => {
  let prisma: PrismaClient;
  let repo: ProductsRepository;
  let tenantContext: TenantContextService;

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

    tenantContext = new TenantContextService();
    tenantContext.setCompanyId(COMPANY_ID);
    tenantContext.setStoreId(STORE_ID);

    repo = new ProductsRepository(prisma as never, tenantContext);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('create', () => {
    it('should create a product with auto-generated SKU', async () => {
      const product = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500 },
        COMPANY_ID,
      );

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.code).toBe('W001');
      expect(product.name).toBe('Widget');
      expect(product.price_cents).toBe(2500);
      expect(product.stock_quantity).toBe(0);
      expect(product.sku).toBe('0001');
      expect(product.companyId).toBe(COMPANY_ID);
      expect(product.storeId).toBe(STORE_ID);
    });

    it('should auto-increment SKU', async () => {
      await repo.create({ code: 'W001', name: 'Widget 1', price_cents: 1000 }, COMPANY_ID);
      const second = await repo.create({ code: 'W002', name: 'Widget 2', price_cents: 2000 }, COMPANY_ID);

      expect(second.sku).toBe('0002');
    });

    it('should use provided SKU when given', async () => {
      const product = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500, sku: 'CUSTOM-001' },
        COMPANY_ID,
      );

      expect(product.sku).toBe('CUSTOM-001');
    });

    it('should set default stock_quantity to 0', async () => {
      const product = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500 },
        COMPANY_ID,
      );

      expect(product.stock_quantity).toBe(0);
    });

    it('should use provided stock_quantity', async () => {
      const product = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500, stock_quantity: 50 },
        COMPANY_ID,
      );

      expect(product.stock_quantity).toBe(50);
    });
  });

  describe('findAll', () => {
    it('should return products for current company', async () => {
      await repo.create({ code: 'W001', name: 'Widget', price_cents: 2500 }, COMPANY_ID);
      await repo.create({ code: 'G001', name: 'Gadget', price_cents: 5000 }, COMPANY_ID);

      const products = await repo.findAll();
      expect(products).toHaveLength(2);
    });

    it('should filter by storeId', async () => {
      const otherStore = 'other-store';
      await prisma.store.create({
        data: { id: otherStore, companyId: COMPANY_ID, name: 'Other Store', created_at: NOW, updated_at: NOW },
      });

      await repo.create({ code: 'W001', name: 'Widget', price_cents: 2500 }, COMPANY_ID);
      await repo.create({ code: 'G001', name: 'Gadget', price_cents: 5000 }, COMPANY_ID, otherStore);

      const products = await repo.findAll(STORE_ID);
      expect(products).toHaveLength(1);
      expect(products[0].code).toBe('W001');
    });

    it('should exclude inactive products', async () => {
      await repo.create({ code: 'W001', name: 'Widget', price_cents: 2500 }, COMPANY_ID);
      const products = await repo.findAll();
      expect(products).toHaveLength(1);

      await repo.softDelete(products[0].id);
      const activeProducts = await repo.findAll();
      expect(activeProducts).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find a product by id', async () => {
      const created = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500 },
        COMPANY_ID,
      );

      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.code).toBe('W001');
    });

    it('should return null for nonexistent id', async () => {
      const found = await repo.findById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const created = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500 },
        COMPANY_ID,
      );

      const updated = await repo.update(created.id, { name: 'Widget Pro', price_cents: 3500 });
      expect(updated.name).toBe('Widget Pro');
      expect(updated.price_cents).toBe(3500);
    });
  });

  describe('softDelete', () => {
    it('should set is_active to false', async () => {
      const created = await repo.create(
        { code: 'W001', name: 'Widget', price_cents: 2500 },
        COMPANY_ID,
      );

      const deleted = await repo.softDelete(created.id);
      expect(deleted.is_active).toBe(false);
    });
  });
});
