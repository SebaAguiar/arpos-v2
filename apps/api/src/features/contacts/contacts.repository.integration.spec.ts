import { PrismaClient } from '@prisma/client';
import { ContactsRepository } from './contacts.repository';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { setupTestDb, teardownTestDb, clearTestDb } from '../../test-utils/test-db';

describe('ContactsRepository (integration)', () => {
  let prisma: PrismaClient;
  let repo: ContactsRepository;
  let tenantContext: TenantContextService;

  const COMPANY_ID = 'test-company';
  const NOW = Math.floor(Date.now() / 1000);

  async function seedBase() {
    await prisma.company.create({
      data: { id: COMPANY_ID, name: 'Test Company', taxId: '123456789', created_at: NOW, updated_at: NOW },
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

    repo = new ContactsRepository(prisma as never, tenantContext);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('create', () => {
    it('should create a contact with default type', async () => {
      const contact = await repo.create({ name: 'John Doe', type: 'customer' }, COMPANY_ID);

      expect(contact).toBeDefined();
      expect(contact.id).toBeDefined();
      expect(contact.name).toBe('John Doe');
      expect(contact.type).toBe('customer');
      expect(contact.companyId).toBe(COMPANY_ID);
      expect(contact.is_active).toBe(true);
    });

    it('should create a supplier contact', async () => {
      const contact = await repo.create({ name: 'Acme Corp', type: 'supplier' }, COMPANY_ID);
      expect(contact.type).toBe('supplier');
    });

    it('should store optional fields', async () => {
      const contact = await repo.create(
        {
          name: 'Full Contact',
          type: 'customer',
          email: 'test@example.com',
          phone: '+5491155551234',
          address: '123 Main St',
          tax_id: '20-12345678-9',
          notes: 'Important client',
        },
        COMPANY_ID,
      );

      expect(contact.email).toBe('test@example.com');
      expect(contact.phone).toBe('+5491155551234');
      expect(contact.tax_id).toBe('20-12345678-9');
    });
  });

  describe('findAll', () => {
    it('should return contacts for current company', async () => {
      await repo.create({ name: 'John', type: 'customer' }, COMPANY_ID);
      await repo.create({ name: 'Jane', type: 'supplier' }, COMPANY_ID);

      const contacts = await repo.findAll();
      expect(contacts).toHaveLength(2);
    });

    it('should filter by type', async () => {
      await repo.create({ name: 'John', type: 'customer' }, COMPANY_ID);
      await repo.create({ name: 'Acme', type: 'supplier' }, COMPANY_ID);

      const customers = await repo.findAll('customer');
      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe('John');

      const suppliers = await repo.findAll('supplier');
      expect(suppliers).toHaveLength(1);
      expect(suppliers[0].name).toBe('Acme');
    });

    it('should exclude inactive contacts', async () => {
      const contact = await repo.create({ name: 'John', type: 'customer' }, COMPANY_ID);
      expect(await repo.findAll()).toHaveLength(1);

      await repo.softDelete(contact.id);
      expect(await repo.findAll()).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find a contact by id', async () => {
      const created = await repo.create({ name: 'John', type: 'customer' }, COMPANY_ID);
      const found = await repo.findById(created.id);
      expect(found?.name).toBe('John');
    });

    it('should return null for nonexistent id', async () => {
      expect(await repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('update', () => {
    it('should update contact fields', async () => {
      const created = await repo.create({ name: 'John', type: 'customer' }, COMPANY_ID);
      const updated = await repo.update(created.id, { name: 'John Updated' });
      expect(updated.name).toBe('John Updated');
    });
  });

  describe('softDelete', () => {
    it('should set is_active to false', async () => {
      const created = await repo.create({ name: 'John', type: 'customer' }, COMPANY_ID);
      const deleted = await repo.softDelete(created.id);
      expect(deleted.is_active).toBe(false);
    });
  });
});
