import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { StoresRepository } from './stores.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('StoresService', () => {
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

  const mockRepo = {
    findAll: jest.fn().mockResolvedValue([mockStore]),
    count: jest.fn().mockResolvedValue(1),
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(id === 's1' ? mockStore : null),
    ),
    create: jest.fn().mockResolvedValue(mockStore),
    update: jest.fn().mockResolvedValue({ ...mockStore, name: 'Updated' }),
    softDelete: jest.fn().mockResolvedValue({ ...mockStore, is_active: false }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        { provide: StoresRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(StoresService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('should return store count', async () => {
      const result = await service.count();
      expect(result).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      const result = await service.findOne('s1');
      expect(result.id).toBe('s1');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a store when count is 0', async () => {
      mockRepo.count.mockResolvedValueOnce(0);
      const result = await service.create({ name: 'New Store' });
      expect(result).toEqual(mockStore);
    });

    it('should throw ConflictException when store limit reached', async () => {
      mockRepo.count.mockResolvedValueOnce(1);
      await expect(service.create({ name: 'Second Store' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const result = await service.update('s1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.update('unknown', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete when multiple stores exist', async () => {
      mockRepo.count.mockResolvedValueOnce(2);
      const result = await service.remove('s1');
      expect(result.is_active).toBe(false);
    });

    it('should throw ConflictException when removing last store', async () => {
      mockRepo.count.mockResolvedValueOnce(1);
      await expect(service.remove('s1')).rejects.toThrow(ConflictException);
    });
  });
});
