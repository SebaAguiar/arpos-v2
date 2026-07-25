import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository, SafeUser } from './users.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser: SafeUser = {
    id: 'u1',
    companyId: 'c1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
    is_active: true,
    created_at: 1000,
    updated_at: 1000,
  };

  const mockCashier: SafeUser = {
    id: 'u2',
    companyId: 'c1',
    email: 'cashier@test.com',
    name: 'Cashier',
    role: 'cashier',
    is_active: true,
    created_at: 1000,
    updated_at: 1000,
  };

  const mockRepo = {
    findAll: jest.fn().mockResolvedValue([mockUser, mockCashier]),
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(id === 'u1' ? mockUser : id === 'u2' ? mockCashier : null),
    ),
    findByEmail: jest.fn().mockImplementation((email: string) =>
      Promise.resolve(email === 'admin@test.com' ? { ...mockUser, password: 'hashed' } : null),
    ),
    create: jest.fn().mockResolvedValue(mockCashier),
    update: jest.fn().mockResolvedValue({ ...mockUser, name: 'Updated' }),
    softDelete: jest.fn().mockResolvedValue({ ...mockCashier, is_active: false }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('should pass filters to repository', async () => {
      await service.findAll({ role: 'admin' });
      expect(mockRepo.findAll).toHaveBeenCalledWith({ role: 'admin' });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = await service.findOne('u1');
      expect(result.id).toBe('u1');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input = { email: 'new@test.com', password: 'pass123', name: 'New', role: 'cashier' as const };
      const result = await service.create(input);
      expect(result).toEqual(mockCashier);
      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });

    it('should throw ConflictException for duplicate email', async () => {
      const input = { email: 'admin@test.com', password: 'pass123', name: 'Dup', role: 'cashier' as const };
      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const result = await service.update('u1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.update('unknown', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate email', async () => {
      await expect(service.update('u2', { email: 'admin@test.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a non-admin user', async () => {
      const result = await service.remove('u2');
      expect(result.is_active).toBe(false);
    });

    it('should throw ConflictException when deleting admin', async () => {
      await expect(service.remove('u1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.remove('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
