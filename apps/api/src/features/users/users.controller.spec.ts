import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsers = [
    {
      id: 'u1',
      companyId: 'c1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      is_active: true,
      created_at: 1000,
      updated_at: 1000,
    },
    {
      id: 'u2',
      companyId: 'c1',
      email: 'cashier@test.com',
      name: 'Cashier',
      role: 'cashier',
      is_active: true,
      created_at: 1000,
      updated_at: 1000,
    },
  ];

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockUsers),
    findOne: jest.fn().mockResolvedValue(mockUsers[0]),
    create: jest.fn().mockResolvedValue(mockUsers[1]),
    update: jest.fn().mockResolvedValue({ ...mockUsers[0], name: 'Updated' }),
    remove: jest.fn().mockResolvedValue({ ...mockUsers[0], is_active: false }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const result = await controller.findAll({} as never);
      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = await controller.findOne('u1');
      expect(result).toEqual(mockUsers[0]);
      expect(service.findOne).toHaveBeenCalledWith('u1');
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const input = { email: 'new@test.com', password: 'pass123', name: 'New', role: 'cashier' as const };
      const result = await controller.create(input);
      expect(result).toEqual(mockUsers[1]);
      expect(service.create).toHaveBeenCalledWith(input);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const result = await controller.update('u1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(service.update).toHaveBeenCalledWith('u1', { name: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should soft-delete a user', async () => {
      const result = await controller.remove('u1');
      expect(result.is_active).toBe(false);
      expect(service.remove).toHaveBeenCalledWith('u1');
    });
  });
});
