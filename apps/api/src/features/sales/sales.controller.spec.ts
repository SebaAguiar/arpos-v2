import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController', () => {
  let controller: SalesController;
  let service: SalesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    getStats: jest.fn(),
    getSalesByPaymentMethod: jest.fn(),
    getTopProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [{ provide: SalesService, useValue: mockService }],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const sales = [{ id: '1', total_cents: 1000 }];
      mockService.findAll.mockResolvedValue(sales);

      const result = await controller.findAll({} as never);
      expect(result).toEqual(sales);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const sale = { id: 'sale-1', total_cents: 2000 };
      mockService.findOne.mockResolvedValue(sale);

      const result = await controller.findOne('sale-1');
      expect(result).toEqual(sale);
      expect(service.findOne).toHaveBeenCalledWith('sale-1');
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const input = {
        items: [{ productId: 'p1', quantity: 1, unit_price_cents: 1000 }],
        total_cents: 1000,
        payment_method: 'cash',
      };
      const sale = { id: 'sale-1', ...input };
      mockService.create.mockResolvedValue(sale);

      const result = await controller.create(input as never);
      expect(result).toEqual(sale);
    });
  });

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      const stats = { totalSales: 10, totalRevenue: 50000, averageTicket: 5000 };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats({ from: 100, to: 200 } as never);
      expect(result).toEqual(stats);
      expect(service.getStats).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('getByPaymentMethod', () => {
    it('should call service.getSalesByPaymentMethod', async () => {
      const grouped = [{ payment_method: 'cash', total_cents: 3000, count: 3 }];
      mockService.getSalesByPaymentMethod.mockResolvedValue(grouped);

      const result = await controller.getByPaymentMethod({} as never);
      expect(result).toEqual(grouped);
    });
  });

  describe('getTopProducts', () => {
    it('should call service.getTopProducts with filters', async () => {
      const topProducts = [
        { productId: 'p1', productName: 'Product A', total_cents: 5000, quantity: 10 },
      ];
      mockService.getTopProducts.mockResolvedValue(topProducts);

      const result = await controller.getTopProducts({ from: 100, to: 200, limit: 5 } as never);
      expect(result).toEqual(topProducts);
      expect(service.getTopProducts).toHaveBeenCalledWith(100, 200, 5);
    });

    it('should call service.getTopProducts without filters', async () => {
      mockService.getTopProducts.mockResolvedValue([]);

      await controller.getTopProducts({} as never);
      expect(service.getTopProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });
});
