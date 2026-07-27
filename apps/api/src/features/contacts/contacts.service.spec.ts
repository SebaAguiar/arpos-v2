import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let mockRepo: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let mockSync: {
    enqueueChange: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    mockSync = {
      enqueueChange: jest.fn().mockResolvedValue(undefined),
    };
    service = new ContactsService(mockRepo as never, mockSync as never);
  });

  describe('findAll', () => {
    it('should return all contacts', async () => {
      mockRepo.findAll.mockResolvedValue([{ id: 'c1', name: 'John' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass type filter', async () => {
      mockRepo.findAll.mockResolvedValue([]);
      await service.findAll('supplier');
      expect(mockRepo.findAll).toHaveBeenCalledWith('supplier');
    });
  });

  describe('findOne', () => {
    it('should return a contact', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'c1', name: 'John' });
      const result = await service.findOne('c1');
      expect(result).toEqual({ id: 'c1', name: 'John' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a contact', async () => {
      const data = { name: 'John' };
      const created = { id: 'c1', ...data };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(data as never, 'company-1');
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update an existing contact', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'c1', name: 'Old' });
      mockRepo.update.mockResolvedValue({ id: 'c1', name: 'New' });

      const result = await service.update('c1', { name: 'New' } as never);
      expect(result).toEqual({ id: 'c1', name: 'New' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'X' } as never))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an existing contact', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'c1', name: 'John', type: 'customer' });
      mockRepo.softDelete.mockResolvedValue(undefined);

      const result = await service.remove('c1');
      expect(result).toBeUndefined();
      expect(mockSync.enqueueChange).toHaveBeenCalledWith('delete', 'contact', 'c1', {
        name: 'John',
        type: 'customer',
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
