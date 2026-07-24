import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTenant = {
    getCompanyId: jest.fn().mockReturnValue('company-1'),
    getStoreId: jest.fn().mockReturnValue('store-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
        { provide: TenantContextService, useValue: mockTenant },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with storeId from tenant', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(mockTenant.getStoreId).toHaveBeenCalled();
      expect(mockService.findAll).toHaveBeenCalledWith('store-1');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const product = { id: 'p1', name: 'Widget' };
      mockService.findOne.mockResolvedValue(product);

      const result = await controller.findOne('p1');
      expect(result).toEqual(product);
    });
  });

  describe('create', () => {
    it('should call service.create with tenant companyId and storeId', async () => {
      const input = { code: 'W001', name: 'Widget', price_cents: 2500 };
      const product = { id: 'p1', ...input };
      mockService.create.mockResolvedValue(product);

      const result = await controller.create(input as never);
      expect(result).toEqual(product);
      expect(mockService.create).toHaveBeenCalledWith(input, 'company-1', 'store-1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const updated = { id: 'p1', name: 'New Name' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('p1', { name: 'New Name' } as never);
      expect(result).toEqual(updated);
      expect(mockService.update).toHaveBeenCalledWith('p1', { name: 'New Name' });
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockService.remove.mockResolvedValue({ id: 'p1', is_active: false });

      const result = await controller.remove('p1');
      expect(result).toEqual({ id: 'p1', is_active: false });
    });
  });
});
