import { SyncRepository } from './sync.repository';

describe('SyncRepository', () => {
  let repository: SyncRepository;
  let mockPrisma: {
    syncQueue: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };
  let mockTenantContext: {
    getCompanyId: jest.Mock;
    getStoreId: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      syncQueue: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    mockTenantContext = {
      getCompanyId: jest.fn().mockReturnValue('comp-1'),
      getStoreId: jest.fn().mockReturnValue('store-1'),
    };

    repository = new SyncRepository(mockPrisma as never, mockTenantContext as never);
  });

  describe('enqueue', () => {
    it('should create a sync queue record with tenant context', async () => {
      const item = {
        action: 'create' as const,
        entity: 'sale' as const,
        entityId: 'sale-1',
        payload: JSON.stringify({ total_cents: 1000 }),
      };

      const expectedCreated = {
        id: 'sq-1',
        companyId: 'comp-1',
        storeId: 'store-1',
        ...item,
        status: 'pending',
        created_at: 1700000000,
      };
      mockPrisma.syncQueue.create.mockResolvedValue(expectedCreated);

      const result = await repository.enqueue(item);

      expect(result).toEqual(expectedCreated);
      expect(mockPrisma.syncQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'comp-1',
          storeId: 'store-1',
          action: 'create',
          entity: 'sale',
          entityId: 'sale-1',
          payload: JSON.stringify({ total_cents: 1000 }),
          status: 'pending',
        }),
      });
    });
  });

  describe('findPending', () => {
    it('should fetch pending items filtered by tenant', async () => {
      const pendingList = [{ id: 'sq-1', status: 'pending' }];
      mockPrisma.syncQueue.findMany.mockResolvedValue(pendingList);

      const result = await repository.findPending(50);

      expect(result).toEqual(pendingList);
      expect(mockPrisma.syncQueue.findMany).toHaveBeenCalledWith({
        where: { companyId: 'comp-1', storeId: 'store-1', status: 'pending' },
        orderBy: { created_at: 'asc' },
        take: 50,
      });
    });
  });

  describe('markSynced', () => {
    it('should update status to synced and clear error message', async () => {
      mockPrisma.syncQueue.update.mockResolvedValue({ id: 'sq-1', status: 'synced' });

      await repository.markSynced('sq-1');

      expect(mockPrisma.syncQueue.update).toHaveBeenCalledWith({
        where: { id: 'sq-1' },
        data: expect.objectContaining({
          status: 'synced',
          error_message: null,
        }),
      });
    });
  });

  describe('markError', () => {
    it('should update status to error and save error message', async () => {
      mockPrisma.syncQueue.update.mockResolvedValue({ id: 'sq-1', status: 'error' });

      await repository.markError('sq-1', 'Network failure');

      expect(mockPrisma.syncQueue.update).toHaveBeenCalledWith({
        where: { id: 'sq-1' },
        data: {
          status: 'error',
          error_message: 'Network failure',
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return aggregated sync statistics', async () => {
      mockPrisma.syncQueue.count
        .mockResolvedValueOnce(5)   // pending
        .mockResolvedValueOnce(20)  // synced
        .mockResolvedValueOnce(1);  // error

      mockPrisma.syncQueue.findFirst.mockResolvedValue({ synced_at: 1700000000 });

      const stats = await repository.getStats();

      expect(stats).toEqual({
        pending: 5,
        synced: 20,
        error: 1,
        lastSyncedAt: 1700000000,
      });
    });
  });
});
