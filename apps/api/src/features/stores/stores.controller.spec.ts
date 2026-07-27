import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

describe('StoresController', () => {
  let controller: StoresController;
  let service: StoresService;

  const mockStore = {
    id: 's1',
    companyId: 'c1',
    name: 'Main Store',
    address: '123 Main St',
    phone: '555-0100',
    is_active: true,
    created_at: 1000,
    updated_at: 1000,
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue([mockStore]),
    count: jest.fn().mockResolvedValue(1),
    findOne: jest.fn().mockResolvedValue(mockStore),
    create: jest.fn().mockResolvedValue(mockStore),
    update: jest.fn().mockResolvedValue({ ...mockStore, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue({ ...mockStore, is_active: false }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [{ provide: StoresService, useValue: mockService }],
    }).compile();

    controller = module.get(StoresController);
    service = module.get(StoresService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockStore]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return store count', async () => {
      const result = await controller.count();
      expect(result).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      const result = await controller.findOne('s1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('create', () => {
    it('should create a store', async () => {
      const result = await controller.create({ name: 'Main Store' });
      expect(result).toEqual(mockStore);
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const result = await controller.update('s1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft-delete a store', async () => {
      mockService.remove.mockResolvedValue(undefined);
      const result = await controller.remove('s1');
      expect(result).toBeUndefined();
    });
  });
});
