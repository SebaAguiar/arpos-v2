import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: {
    findActiveByEmail: jest.Mock;
    findById: jest.Mock;
  };
  let mockJwt: {
    sign: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findActiveByEmail: jest.fn(),
      findById: jest.fn(),
    };
    mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };
    service = new AuthService(mockRepo as never, mockJwt as never);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user payload when credentials are valid', async () => {
      const user = {
        id: 'u1',
        email: 'admin@arcom.com',
        name: 'Admin',
        role: 'admin',
        companyId: 'c1',
        password: '$2a$10$hashedpassword',
        is_active: true,
      };
      mockRepo.findActiveByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin@arcom.com', 'password123');
      expect(result).toEqual({
        id: 'u1',
        email: 'admin@arcom.com',
        name: 'Admin',
        role: 'admin',
        companyId: 'c1',
      });
    });

    it('should return null when user not found', async () => {
      mockRepo.findActiveByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nobody@arcom.com', 'pass');
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const user = {
        id: 'u1',
        email: 'admin@arcom.com',
        password: '$2a$10$hashedpassword',
        is_active: true,
      };
      mockRepo.findActiveByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin@arcom.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = {
        id: 'u1',
        email: 'admin@arcom.com',
        name: 'Admin',
        role: 'admin',
        companyId: 'c1',
      };

      const result = await service.login(user);
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        id: 'u1',
        email: 'admin@arcom.com',
        name: 'Admin',
        role: 'admin',
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({ sub: 'u1', companyId: 'c1' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = { id: 'u1', email: 'admin@arcom.com', name: 'Admin', role: 'admin', companyId: 'c1' };
      mockRepo.findById.mockResolvedValue(user);

      const result = await service.getProfile('u1');
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
