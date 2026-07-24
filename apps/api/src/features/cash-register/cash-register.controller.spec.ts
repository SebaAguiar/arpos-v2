import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

describe('CashRegisterController', () => {
  let controller: CashRegisterController;
  let service: CashRegisterService;

  const mockService = {
    findAll: jest.fn(),
    findCurrent: jest.fn(),
    findOne: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
  };

  const mockTenant = {
    getCompanyId: jest.fn().mockReturnValue('company-1'),
    getStoreId: jest.fn().mockReturnValue('store-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashRegisterController],
      providers: [
        { provide: CashRegisterService, useValue: mockService },
        { provide: TenantContextService, useValue: mockTenant },
      ],
    }).compile();

    controller = module.get<CashRegisterController>(CashRegisterController);
    service = module.get<CashRegisterService>(CashRegisterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with companyId and storeId', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith('company-1', 'store-1');
    });
  });

  describe('findCurrent', () => {
    it('should call service.findCurrent with companyId and storeId', async () => {
      const register = { id: 'cr1', status: 'open' };
      mockService.findCurrent.mockResolvedValue(register);

      const result = await controller.findCurrent();
      expect(result).toEqual(register);
      expect(service.findCurrent).toHaveBeenCalledWith('company-1', 'store-1');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const register = { id: 'cr1', status: 'open' };
      mockService.findOne.mockResolvedValue(register);

      const result = await controller.findOne('cr1');
      expect(result).toEqual(register);
    });
  });

  describe('open', () => {
    it('should call service.open with input, companyId, storeId', async () => {
      const input = { name: 'Main', opening_amount: 10000 };
      const register = { id: 'cr1', ...input };
      mockService.open.mockResolvedValue(register);

      const result = await controller.open(input as never);
      expect(result).toEqual(register);
      expect(service.open).toHaveBeenCalledWith(input, 'company-1', 'store-1');
    });
  });

  describe('close', () => {
    it('should call service.close with id and closing_amount', async () => {
      const closed = { id: 'cr1', status: 'closed', closing_amount: 15000 };
      mockService.close.mockResolvedValue(closed);

      const result = await controller.close('cr1', { closing_amount: 15000 } as never);
      expect(result).toEqual(closed);
      expect(service.close).toHaveBeenCalledWith('cr1', 15000);
    });
  });
});
