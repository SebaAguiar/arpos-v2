import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

describe('InventoryController', () => {
  let controller: InventoryController;

  const mockService = {
    listStock: jest.fn(),
    listMovements: jest.fn(),
    createMovement: jest.fn(),
  };

  const mockTenant = {
    getCompanyId: jest.fn().mockReturnValue('company-1'),
    getStoreId: jest.fn().mockReturnValue('store-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: mockService },
        { provide: TenantContextService, useValue: mockTenant },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listStock', () => {
    it('should call service with tenant context', async () => {
      const stock = [{ productId: 'p1', stock_quantity: 10 }];
      mockService.listStock.mockResolvedValue(stock);

      const result = await controller.listStock();
      expect(result).toEqual(stock);
      expect(mockService.listStock).toHaveBeenCalledWith('company-1', 'store-1');
    });
  });

  describe('listMovements', () => {
    it('should call service with query filters', async () => {
      const movements = [{ id: 'm1', type: 'sale' }];
      mockService.listMovements.mockResolvedValue(movements);

      const result = await controller.listMovements({ productId: 'p1', type: 'sale' });
      expect(result).toEqual(movements);
      expect(mockService.listMovements).toHaveBeenCalledWith('company-1', 'store-1', {
        productId: 'p1',
        type: 'sale',
      });
    });
  });

  describe('createMovement', () => {
    it('should call service with input and tenant context', async () => {
      mockService.createMovement.mockResolvedValue(undefined);

      await controller.createMovement({
        productId: 'p1',
        type: 'entry',
        quantity: 10,
        reason: 'Restock',
      });
      expect(mockService.createMovement).toHaveBeenCalledWith(
        { productId: 'p1', type: 'entry', quantity: 10, reason: 'Restock' },
        'company-1',
        'store-1',
      );
    });
  });
});
