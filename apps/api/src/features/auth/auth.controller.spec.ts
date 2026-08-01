import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return token when credentials are valid', async () => {
      const user = { id: 'u1', email: 'admin@arcon.com', name: 'Admin', role: 'admin', companyId: 'c1' };
      mockService.validateUser.mockResolvedValue(user);
      mockService.login.mockResolvedValue({ access_token: 'token-123', user });

      const result = await controller.login({ email: 'admin@arcon.com', password: 'pass' });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should return error message when credentials are invalid', async () => {
      mockService.validateUser.mockResolvedValue(null);

      const result = await controller.login({ email: 'wrong@arcon.com', password: 'wrong' });
      expect(result).toEqual({ message: 'Invalid credentials', statusCode: 401 });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = { id: 'u1', email: 'admin@arcon.com', name: 'Admin', role: 'admin' };
      mockService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile({ user: { id: 'u1' } });
      expect(result).toEqual(profile);
      expect(service.getProfile).toHaveBeenCalledWith('u1');
    });
  });
});
