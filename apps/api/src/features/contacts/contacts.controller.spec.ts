import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTenant = {
    getCompanyId: jest.fn().mockReturnValue('company-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        { provide: ContactsService, useValue: mockService },
        { provide: TenantContextService, useValue: mockTenant },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass type query param', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll('supplier');
      expect(service.findAll).toHaveBeenCalledWith('supplier');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const contact = { id: 'c1', name: 'John' };
      mockService.findOne.mockResolvedValue(contact);

      const result = await controller.findOne('c1');
      expect(result).toEqual(contact);
    });
  });

  describe('create', () => {
    it('should call service.create with companyId from tenant', async () => {
      const input = { name: 'John Doe' };
      const contact = { id: 'c1', ...input };
      mockService.create.mockResolvedValue(contact);

      const result = await controller.create(input as never);
      expect(result).toEqual(contact);
      expect(service.create).toHaveBeenCalledWith(input, 'company-1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const updated = { id: 'c1', name: 'Jane Doe' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('c1', { name: 'Jane Doe' } as never);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockService.remove.mockResolvedValue({ id: 'c1', is_active: false });

      const result = await controller.remove('c1');
      expect(result).toEqual({ id: 'c1', is_active: false });
    });
  });
});
