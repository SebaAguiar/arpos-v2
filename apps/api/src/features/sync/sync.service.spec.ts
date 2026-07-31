import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let mockRepo: {
    enqueue: jest.Mock;
    findPending: jest.Mock;
    markSynced: jest.Mock;
    markError: jest.Mock;
    countPending: jest.Mock;
    deleteSynced: jest.Mock;
    deletePending: jest.Mock;
    getStats: jest.Mock;
  };
  let mockPrisma: {
    company: { findFirst: jest.Mock };
    store: { findFirst: jest.Mock };
    syncQueue: { findFirst: jest.Mock };
  };
  let mockTenantContext: {
    getCompanyId: jest.Mock;
    getStoreId: jest.Mock;
    setCompanyId: jest.Mock;
    setStoreId: jest.Mock;
  };
  let mockCloudRelay: {
    pushToCloud: jest.Mock;
    pullFromCloud: jest.Mock;
    isCloudConfigured: jest.Mock;
    registerRemoteChangesHandler: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      enqueue: jest.fn(),
      findPending: jest.fn(),
      markSynced: jest.fn(),
      markError: jest.fn(),
      countPending: jest.fn().mockResolvedValue(0),
      deleteSynced: jest.fn(),
      deletePending: jest.fn(),
      getStats: jest.fn(),
    };

    mockPrisma = {
      company: { findFirst: jest.fn() },
      store: { findFirst: jest.fn() },
      syncQueue: { findFirst: jest.fn() },
    };

    mockTenantContext = {
      getCompanyId: jest.fn().mockReturnValue('comp-1'),
      getStoreId: jest.fn().mockReturnValue('store-1'),
      setCompanyId: jest.fn(),
      setStoreId: jest.fn(),
    };

    mockCloudRelay = {
      pushToCloud: jest.fn(),
      pullFromCloud: jest.fn(),
      isCloudConfigured: jest.fn().mockResolvedValue(false),
      registerRemoteChangesHandler: jest.fn(),
    };

    service = new SyncService(
      mockRepo as never,
      mockPrisma as never,
      mockTenantContext as never,
      mockCloudRelay as never,
    );
  });

  describe('enqueueChange', () => {
    it('should enqueue change in repository with serialized payload', async () => {
      await service.enqueueChange('create', 'sale', 's1', { amount: 500 });

      expect(mockRepo.enqueue).toHaveBeenCalledWith({
        action: 'create',
        entity: 'sale',
        entityId: 's1',
        payload: JSON.stringify({ amount: 500 }),
      });
    });

    it('should throw on invalid action', async () => {
      await expect(
        service.enqueueChange('invalid' as never, 'sale', 's1', {}),
      ).rejects.toThrow('Invalid sync action');
    });

    it('should throw on invalid entity', async () => {
      await expect(
        service.enqueueChange('create', 'invalid' as never, 's1', {}),
      ).rejects.toThrow('Invalid sync entity');
    });

    it('should process oldest batch when queue is at capacity', async () => {
      mockRepo.countPending.mockResolvedValue(10000);
      mockRepo.findPending.mockResolvedValue([]);

      await service.enqueueChange('create', 'sale', 's1', { amount: 500 });

      expect(mockRepo.findPending).toHaveBeenCalled();
    });
  });

  describe('processPending', () => {
    it('should return 0 processed if no pending items', async () => {
      mockRepo.findPending.mockResolvedValue([]);

      const result = await service.processPending();

      expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0 });
    });

    it('should leave items pending when cloud is not configured', async () => {
      const pendingItems = [
        { id: 'sq-1', action: 'create', entity: 'sale', entityId: 's1', payload: '{"total":10}' },
      ];
      mockRepo.findPending.mockResolvedValue(pendingItems);

      const result = await service.processPending();

      expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0 });
      expect(mockRepo.markSynced).not.toHaveBeenCalled();
      expect(mockRepo.markError).not.toHaveBeenCalled();
    });

    it('should process pending items and mark as synced when cloud is configured', async () => {
      mockCloudRelay.isCloudConfigured.mockResolvedValue(true);
      mockCloudRelay.pushToCloud.mockResolvedValue(undefined);

      const pendingItems = [
        { id: 'sq-1', action: 'create', entity: 'sale', entityId: 's1', payload: '{"total":10}' },
      ];
      mockRepo.findPending.mockResolvedValue(pendingItems);
      mockRepo.markSynced.mockResolvedValue(undefined);

      const result = await service.processPending();

      expect(result).toEqual({ processed: 1, succeeded: 1, failed: 0 });
      expect(mockRepo.markSynced).toHaveBeenCalledWith('sq-1');
    });

    it('should mark items as error when push to cloud fails', async () => {
      mockCloudRelay.isCloudConfigured.mockResolvedValue(true);
      mockCloudRelay.pushToCloud.mockRejectedValue(new Error('Network timeout'));

      const pendingItems = [
        { id: 'sq-1', action: 'create', entity: 'sale', entityId: 's1', payload: '{"total":10}' },
      ];
      mockRepo.findPending.mockResolvedValue(pendingItems);
      mockRepo.markError.mockResolvedValue(undefined);

      const result = await service.processPending();

      expect(result).toEqual({ processed: 1, succeeded: 0, failed: 1 });
      expect(mockRepo.markError).toHaveBeenCalledWith('sq-1', 'Network timeout');
    });
  });

  describe('getStats', () => {
    it('should delegate to repository getStats', async () => {
      const stats = { pending: 1, synced: 10, error: 0, lastSyncedAt: 12345 };
      mockRepo.getStats.mockResolvedValue(stats);

      const result = await service.getStats();

      expect(result).toEqual(stats);
      expect(mockRepo.getStats).toHaveBeenCalled();
    });
  });

  describe('cleanupSynced', () => {
    it('should delegate to repository deleteSynced', async () => {
      mockRepo.deleteSynced.mockResolvedValue(5);

      const deleted = await service.cleanupSynced(30);

      expect(deleted).toBe(5);
      expect(mockRepo.deleteSynced).toHaveBeenCalledWith(30);
    });
  });

  describe('cleanupPending', () => {
    it('should delegate to repository deletePending', async () => {
      mockRepo.deletePending.mockResolvedValue(3);

      const deleted = await service.cleanupPending(15);

      expect(deleted).toBe(3);
      expect(mockRepo.deletePending).toHaveBeenCalledWith(15);
    });
  });
});
