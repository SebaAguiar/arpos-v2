import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockRepo: {
    getStock: jest.Mock;
    getMovements: jest.Mock;
    createMovement: jest.Mock;
    adjustStock: jest.Mock;
  };
  let mockSync: {
    enqueueChange: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      getStock: jest.fn(),
      getMovements: jest.fn(),
      createMovement: jest.fn(),
      adjustStock: jest.fn(),
    };
    mockSync = {
      enqueueChange: jest.fn().mockResolvedValue(undefined),
    };
    service = new InventoryService(mockRepo as never, mockSync as never);
  });

  describe('listStock', () => {
    it('should return stock for all active products', async () => {
      const stock = [
        { productId: 'p1', productCode: 'A001', productName: 'Product A', stock_quantity: 10, cost_cents: 500 },
      ];
      mockRepo.getStock.mockResolvedValue(stock);

      const result = await service.listStock('c1', 's1');
      expect(result).toEqual(stock);
      expect(mockRepo.getStock).toHaveBeenCalledWith('c1', 's1');
    });
  });

  describe('listMovements', () => {
    it('should return movements with filters', async () => {
      const movements = [{ id: 'm1', type: 'sale', quantity: -2 }];
      mockRepo.getMovements.mockResolvedValue(movements);

      const result = await service.listMovements('c1', 's1', { productId: 'p1', type: 'sale' });
      expect(result).toEqual(movements);
    });
  });

  describe('createMovement', () => {
    it('should create an entry movement and increment stock', async () => {
      mockRepo.createMovement.mockResolvedValue({ id: 'm1' });
      mockRepo.adjustStock.mockResolvedValue(undefined);

      await service.createMovement(
        { productId: 'p1', type: 'entry', quantity: 10, reason: 'Purchase order' },
        'c1',
        's1',
      );

      expect(mockRepo.createMovement).toHaveBeenCalledWith({
        companyId: 'c1',
        storeId: 's1',
        productId: 'p1',
        userId: undefined,
        type: 'entry',
        quantity: 10,
        reason: 'Purchase order',
      });
      expect(mockRepo.adjustStock).toHaveBeenCalledWith('p1', 10);
    });

    it('should create an exit movement and decrement stock', async () => {
      mockRepo.getStock.mockResolvedValue([
        { productId: 'p1', productName: 'Product A', stock_quantity: 10 },
      ]);
      mockRepo.createMovement.mockResolvedValue({ id: 'm1' });
      mockRepo.adjustStock.mockResolvedValue(undefined);

      await service.createMovement(
        { productId: 'p1', type: 'exit', quantity: 3, reason: 'Damaged goods' },
        'c1',
        's1',
      );

      expect(mockRepo.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'exit', quantity: -3 }),
      );
      expect(mockRepo.adjustStock).toHaveBeenCalledWith('p1', -3);
    });

    it('should throw BadRequestException when exit exceeds stock', async () => {
      mockRepo.getStock.mockResolvedValue([
        { productId: 'p1', productName: 'Product A', stock_quantity: 2 },
      ]);

      await expect(
        service.createMovement(
          { productId: 'p1', type: 'exit', quantity: 5, reason: 'Too many' },
          'c1',
          's1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when product not found for exit', async () => {
      mockRepo.getStock.mockResolvedValue([]);

      await expect(
        service.createMovement(
          { productId: 'nonexistent', type: 'exit', quantity: 1, reason: 'Test' },
          'c1',
          's1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not check stock for entry movements', async () => {
      mockRepo.createMovement.mockResolvedValue({ id: 'm1' });
      mockRepo.adjustStock.mockResolvedValue(undefined);

      await service.createMovement(
        { productId: 'p1', type: 'entry', quantity: 100, reason: 'Restock' },
        'c1',
        's1',
      );

      expect(mockRepo.getStock).not.toHaveBeenCalled();
      expect(mockRepo.adjustStock).toHaveBeenCalledWith('p1', 100);
    });

    it('should handle adjustment with positive quantity', async () => {
      mockRepo.getStock.mockResolvedValue([
        { productId: 'p1', productName: 'Product A', stock_quantity: 5 },
      ]);
      mockRepo.createMovement.mockResolvedValue({ id: 'm1' });
      mockRepo.adjustStock.mockResolvedValue(undefined);

      await service.createMovement(
        { productId: 'p1', type: 'adjustment', quantity: 3, reason: 'Found extra units' },
        'c1',
        's1',
      );

      expect(mockRepo.adjustStock).toHaveBeenCalledWith('p1', 3);
    });

    it('should handle adjustment with negative quantity', async () => {
      mockRepo.getStock.mockResolvedValue([
        { productId: 'p1', productName: 'Product A', stock_quantity: 5 },
      ]);
      mockRepo.createMovement.mockResolvedValue({ id: 'm1' });
      mockRepo.adjustStock.mockResolvedValue(undefined);

      await service.createMovement(
        { productId: 'p1', type: 'adjustment', quantity: -2, reason: 'Count correction' },
        'c1',
        's1',
      );

      expect(mockRepo.adjustStock).toHaveBeenCalledWith('p1', -2);
    });

    it('should throw BadRequestException when adjustment makes stock negative', async () => {
      mockRepo.getStock.mockResolvedValue([
        { productId: 'p1', productName: 'Product A', stock_quantity: 2 },
      ]);

      await expect(
        service.createMovement(
          { productId: 'p1', type: 'adjustment', quantity: -5, reason: 'Over-counted' },
          'c1',
          's1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
