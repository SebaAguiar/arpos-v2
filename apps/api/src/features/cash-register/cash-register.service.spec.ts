import { NotFoundException, ConflictException } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';

describe('CashRegisterService', () => {
  let service: CashRegisterService;
  let mockRepo: {
    findOpen: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    close: jest.Mock;
    buildSummary: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findOpen: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      close: jest.fn(),
      buildSummary: jest.fn(),
    };
    service = new CashRegisterService(mockRepo as never);
  });

  describe('findCurrent', () => {
    it('should return open register with summary', async () => {
      const register = { id: 'cr1', status: 'open', opened_at: 1000 };
      const summary = { total_sales_cents: 5000, payment_summary: [] };
      mockRepo.findOpen.mockResolvedValue(register);
      mockRepo.buildSummary.mockResolvedValue(summary);

      const result = await service.findCurrent('c1', 's1');
      expect(result).toEqual({ ...register, ...summary });
    });

    it('should throw NotFoundException when no open register', async () => {
      mockRepo.findOpen.mockResolvedValue(null);
      await expect(service.findCurrent('c1', 's1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('open', () => {
    it('should open a new register when none exists', async () => {
      mockRepo.findOpen.mockResolvedValue(null);
      const created = { id: 'cr1', name: 'Main', status: 'open' };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.open({ name: 'Main', opening_amount: 10000 }, 'c1', 's1');
      expect(result).toEqual(created);
    });

    it('should throw ConflictException when register already open', async () => {
      mockRepo.findOpen.mockResolvedValue({ id: 'cr-existing', status: 'open' });
      await expect(
        service.open({ name: 'Main', opening_amount: 10000 }, 'c1', 's1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('close', () => {
    it('should close an open register', async () => {
      const register = { id: 'cr1', status: 'open' };
      const closed = { id: 'cr1', status: 'closed', closing_amount: 15000 };
      mockRepo.findById.mockResolvedValue(register);
      mockRepo.close.mockResolvedValue(closed);

      const result = await service.close('cr1', 15000);
      expect(result).toEqual(closed);
    });

    it('should throw NotFoundException when register not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.close('nonexistent', 0)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when register already closed', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cr1', status: 'closed' });
      await expect(service.close('cr1', 15000)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all registers for company/store', async () => {
      const registers = [{ id: 'cr1' }, { id: 'cr2' }];
      mockRepo.findAll.mockResolvedValue(registers);

      const result = await service.findAll('c1', 's1');
      expect(result).toEqual(registers);
    });
  });
});
