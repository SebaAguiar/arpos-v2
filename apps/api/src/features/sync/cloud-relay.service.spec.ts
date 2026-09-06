import { CloudRelayService } from './cloud-relay.service';

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    on: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  })),
}));

const companyWithConfig = (config: string | null) => {
  const company = {
    findUnique: jest.fn().mockResolvedValue({ config }),
    update: jest.fn().mockResolvedValue({}),
  };
  return company;
};

const mockProduct = {
  findUnique: jest.fn().mockResolvedValue(null),
  findMany: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue(null),
};

const mockContact = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

const mockInventory = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

const mockSale = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

const mockSaleItem = {
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn().mockResolvedValue({}),
};

const mockUser = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

const mockWalletTx = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
};

const mockCashRegister = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

const mockCashMovement = {
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
};

describe('CloudRelayService', () => {
  let service: CloudRelayService;
  let mockConfig: { get: jest.Mock };
  let mockTenant: { getCompanyId: jest.Mock; getStoreId: jest.Mock };
  let mockPrisma: {
    company: ReturnType<typeof companyWithConfig>;
    product: typeof mockProduct;
    contact: typeof mockContact;
    inventory: typeof mockInventory;
    sale: typeof mockSale;
    saleItem: typeof mockSaleItem;
    user: typeof mockUser;
    walletTransaction: typeof mockWalletTx;
    cashRegister: typeof mockCashRegister;
    cashMovement: typeof mockCashMovement;
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    mockConfig = { get: jest.fn().mockReturnValue(undefined) };
    mockTenant = {
      getCompanyId: jest.fn().mockReturnValue('comp-1'),
      getStoreId: jest.fn().mockReturnValue('store-1'),
    };
    mockPrisma = {
      company: companyWithConfig(
        JSON.stringify({
          cloud: { url: 'https://cloud.example.com', jwt: 'token-123' },
          subscription: { status: 'active', tier: 'pro' },
        }),
      ),
      product: mockProduct,
      contact: mockContact,
      inventory: mockInventory,
      sale: mockSale,
      saleItem: mockSaleItem,
      user: mockUser,
      walletTransaction: mockWalletTx,
      cashRegister: mockCashRegister,
      cashMovement: mockCashMovement,
      $transaction: jest.fn((cb: (tx: unknown) => Promise<boolean>) => cb(mockPrisma)),
    };

    service = new CloudRelayService(
      mockConfig as never,
      mockPrisma as never,
      mockTenant as never,
    );
  });

  describe('getCloudConfig', () => {
    it('should read cloud config from company config (DB)', async () => {
      const config = await service.getCloudConfig();
      expect(config).toEqual({ url: 'https://cloud.example.com', jwt: 'token-123' });
    });

    it('should fall back to env vars when company config has no cloud', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        config: JSON.stringify({ subscription: { status: 'active' } }),
      });
      mockConfig.get.mockImplementation((key: string) =>
        key === 'CLOUD_URL' ? 'https://env.example.com' : 'env-jwt',
      );

      const config = await service.getCloudConfig();
      expect(config).toEqual({ url: 'https://env.example.com', jwt: 'env-jwt' });
    });

    it('should return empty when nothing is configured', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ config: null });

      const config = await service.getCloudConfig();
      expect(config).toEqual({ url: undefined, jwt: undefined });
    });
  });

  describe('isCloudConfigured', () => {
    it('should return true when cloud url and jwt are present', async () => {
      await expect(service.isCloudConfigured()).resolves.toBe(true);
    });

    it('should return false when not configured', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ config: null });
      await expect(service.isCloudConfigured()).resolves.toBe(false);
    });
  });

  describe('pushToCloud', () => {
    it('should throw when cloud is not configured', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ config: null });

      await expect(
        service.pushToCloud({ action: 'create', entity: 'sale', entityId: 's1', payload: '{}' }),
      ).rejects.toThrow('Cloud not configured');
    });

    it('should POST to the cloud apply endpoint with auth', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock as never;

      await service.pushToCloud({
        action: 'create',
        entity: 'sale',
        entityId: 's1',
        payload: JSON.stringify({ total_cents: 1000 }),
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://cloud.example.com/api/sync/apply',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            action: 'create',
            entity: 'sale',
            entityId: 's1',
            payload: { total_cents: 1000 },
          }),
        }),
      );
    });
  });

  describe('pullFromCloud', () => {
    it('should return empty result when there are no changes', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result).toEqual({ pulled: 0, applied: 0, skipped: 0, errors: [] });
    });

    it('should apply product create and report it as applied', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'create',
            entity: 'product',
            entityId: 'p-1',
            updatedAt: 1000,
            payload: { code: 'P1', name: 'Remera', price_cents: 5000 },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.applied).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 'p-1', name: 'Remera', code: 'P1' }),
        }),
      );
    });

    it('should skip outdated changes (last-write-wins)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ updated_at: 2000 });
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'update',
            entity: 'product',
            entityId: 'p-1',
            updatedAt: 1000,
            payload: { name: 'Old name' },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.applied).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should report errors for changes that cannot be applied', async () => {
      mockPrisma.product.findUnique.mockRejectedValue(new Error('DB locked'));
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'create',
            entity: 'product',
            entityId: 'p-1',
            updatedAt: 1000,
            payload: { name: 'Remera' },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.applied).toBe(0);
      expect(result.errors).toEqual(['DB locked']);
    });
  });

  describe('applyRemoteChange — sale', () => {
    it('should create the sale with items and decrement stock', async () => {
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: typeof mockPrisma) => Promise<boolean>) => cb(mockPrisma),
      );
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1' });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'p-1', stock_quantity: 10 },
      ]);
      mockPrisma.saleItem.count.mockResolvedValue(0);

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'create',
            entity: 'sale',
            entityId: 's-1',
            updatedAt: 5000,
            payload: {
              user_id: 'u-1',
              total_cents: 6000,
              payment_method: 'cash',
              status: 'completed',
              items: [
                {
                  productId: 'p-1',
                  quantity: 2,
                  unit_price_cents: 3000,
                  total_cents: 6000,
                },
              ],
            },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.applied).toBe(1);
      expect(mockPrisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 's-1', user_id: 'u-1' }),
        }),
      );
      expect(mockPrisma.saleItem.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p-1' },
          data: expect.objectContaining({ stock_quantity: { decrement: 2 } }),
        }),
      );
    });

    it('should create a placeholder user when the sale user does not exist', async () => {
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: typeof mockPrisma) => Promise<boolean>) => cb(mockPrisma),
      );
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.saleItem.count.mockResolvedValue(0);

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'create',
            entity: 'sale',
            entityId: 's-2',
            updatedAt: 5000,
            payload: {
              user_id: 'remote-user-1',
              total_cents: 1000,
              payment_method: 'cash',
              status: 'completed',
              items: [],
            },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.applied).toBe(1);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'remote-user-1',
            email: 'sync-remote-user-1@local.arcom',
            is_active: false,
          }),
        }),
      );
    });
  });

  describe('applyRemoteChange — wallet_transaction', () => {
    it('should fail when the contact does not exist locally', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(null);
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'create',
            entity: 'wallet_transaction',
            entityId: 'w-1',
            updatedAt: 5000,
            payload: { contactId: 'c-999', type: 'credit', amount_cents: 500 },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('c-999');
      expect(mockPrisma.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('should create the transaction and update the contact balance', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue({
        id: 'c-1',
        balance_cents: 1000,
      });
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: typeof mockPrisma) => Promise<boolean>) => cb(mockPrisma),
      );
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            action: 'create',
            entity: 'wallet_transaction',
            entityId: 'w-1',
            updatedAt: 5000,
            payload: { contactId: 'c-1', type: 'debit', amount_cents: 300 },
          },
        ],
      });
      global.fetch = fetchMock as never;

      const result = await service.pullFromCloud(null);

      expect(result.applied).toBe(1);
      expect(mockPrisma.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'w-1',
            balance_before: 1000,
            balance_after: 700,
          }),
        }),
      );
      expect(mockPrisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ balance_cents: 700 }),
        }),
      );
    });
  });

  describe('saveCloudConfig / clearCloudConfig', () => {
    it('should persist cloud config and keep the existing subscription', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        config: JSON.stringify({ subscription: { status: 'active', tier: 'pro' } }),
      });

      await service.saveCloudConfig('https://new.cloud.com', 'new-jwt');

      const updateData = mockPrisma.company.update.mock.calls[0][0].data;
      expect(JSON.parse(updateData.config)).toEqual({
        subscription: { status: 'active', tier: 'pro' },
        cloud: { url: 'https://new.cloud.com', jwt: 'new-jwt' },
      });
    });

    it('should clear cloud config on disconnect', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        config: JSON.stringify({
          cloud: { url: 'https://x.com', jwt: 'j' },
          subscription: { status: 'active' },
        }),
      });

      await service.clearCloudConfig();

      const updateData = mockPrisma.company.update.mock.calls[0][0].data;
      expect(JSON.parse(updateData.config)).toEqual({
        subscription: { status: 'active' },
      });
    });
  });

  describe('getConfigInfo', () => {
    it('should report cloud and subscription status', async () => {
      const info = await service.getConfigInfo();

      expect(info.cloud_configured).toBe(true);
      expect(info.cloud_url).toBe('https://cloud.example.com');
      expect(info.subscription).toEqual({
        status: 'active',
        tier: 'pro',
        expiresAt: undefined,
      });
    });

    it('should report inactive when nothing is configured', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ config: null });

      const info = await service.getConfigInfo();

      expect(info.cloud_configured).toBe(false);
      expect(info.cloud_url).toBeNull();
      expect(info.subscription).toBeNull();
    });
  });
});
