import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepo: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let mockSync: {
    enqueueChange: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    mockSync = {
      enqueueChange: jest.fn().mockResolvedValue(undefined),
    };
    service = new ProductsService(mockRepo as never, mockSync as never);
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [{ id: 'p1', name: 'Product 1' }];
      mockRepo.findAll.mockResolvedValue(products);

      const result = await service.findAll();
      expect(result).toEqual(products);
    });

    it('should pass storeId to repository', async () => {
      mockRepo.findAll.mockResolvedValue([]);
      await service.findAll('store-1');
      expect(mockRepo.findAll).toHaveBeenCalledWith('store-1');
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const product = { id: 'p1', name: 'Widget' };
      mockRepo.findById.mockResolvedValue(product);

      const result = await service.findOne('p1');
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const input = { code: 'W001', name: 'Widget', price_cents: 2500 };
      const product = { id: 'p1', ...input };
      mockRepo.create.mockResolvedValue(product);

      const result = await service.create(input, 'company-1', 'store-1');
      expect(result).toEqual(product);
      expect(mockRepo.create).toHaveBeenCalledWith(input, 'company-1', 'store-1');
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      const existing = { id: 'p1', name: 'Old Name' };
      const updated = { id: 'p1', name: 'New Name' };
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('p1', { name: 'New Name' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when updating nonexistent product', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an existing product', async () => {
      const existing = { id: 'p1', name: 'Widget', code: 'W001' };
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.softDelete.mockResolvedValue(undefined);

      const result = await service.remove('p1');
      expect(result).toBeUndefined();
      expect(mockSync.enqueueChange).toHaveBeenCalledWith('delete', 'product', 'p1', {
        code: 'W001',
        name: 'Widget',
      });
    });

    it('should throw NotFoundException when deleting nonexistent product', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
