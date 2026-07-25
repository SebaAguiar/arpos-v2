import { NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;
  let mockRepo: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    getStats: jest.Mock;
    getSalesByPaymentMethod: jest.Mock;
    getTopProducts: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      getStats: jest.fn(),
      getSalesByPaymentMethod: jest.fn(),
      getTopProducts: jest.fn(),
    };
    service = new SalesService(mockRepo as never);
  });

  describe('findAll', () => {
    it('should return all sales', async () => {
      const sales = [{ id: '1', total_cents: 1000 }];
      mockRepo.findAll.mockResolvedValue(sales);

      const result = await service.findAll();
      expect(result).toEqual(sales);
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to repository', async () => {
      mockRepo.findAll.mockResolvedValue([]);
      await service.findAll({ from: 100, to: 200, status: 'completed' });
      expect(mockRepo.findAll).toHaveBeenCalledWith({ from: 100, to: 200, status: 'completed' });
    });
  });

  describe('findOne', () => {
    it('should return a sale by id', async () => {
      const sale = { id: 'sale-1', total_cents: 2000 };
      mockRepo.findById.mockResolvedValue(sale);

      const result = await service.findOne('sale-1');
      expect(result).toEqual(sale);
    });

    it('should throw NotFoundException when sale not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a sale', async () => {
      const input = {
        items: [{ productId: 'p1', quantity: 1, unit_price_cents: 1000 }],
        total_cents: 1000,
        payment_method: 'cash',
      };
      const sale = { id: 'sale-1', ...input };
      mockRepo.create.mockResolvedValue(sale);

      const result = await service.create(input);
      expect(result).toEqual(sale);
      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });
  });

  describe('getStats', () => {
    it('should return stats from repository', async () => {
      const stats = { totalSales: 10, totalRevenue: 50000, averageTicket: 5000 };
      mockRepo.getStats.mockResolvedValue(stats);

      const result = await service.getStats(100, 200);
      expect(result).toEqual(stats);
      expect(mockRepo.getStats).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('getSalesByPaymentMethod', () => {
    it('should return grouped sales', async () => {
      const grouped = [{ payment_method: 'cash', total_cents: 3000, count: 3 }];
      mockRepo.getSalesByPaymentMethod.mockResolvedValue(grouped);

      const result = await service.getSalesByPaymentMethod();
      expect(result).toEqual(grouped);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products from repository', async () => {
      const topProducts = [
        { productId: 'p1', productName: 'Product A', total_cents: 5000, quantity: 10 },
      ];
      mockRepo.getTopProducts.mockResolvedValue(topProducts);

      const result = await service.getTopProducts(100, 200, 5);
      expect(result).toEqual(topProducts);
      expect(mockRepo.getTopProducts).toHaveBeenCalledWith(100, 200, 5);
    });

    it('should use default limit of 10', async () => {
      mockRepo.getTopProducts.mockResolvedValue([]);

      await service.getTopProducts();
      expect(mockRepo.getTopProducts).toHaveBeenCalledWith(undefined, undefined, 10);
    });
  });
});
