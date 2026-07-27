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
    getMovementSummary: jest.Mock;
    createMovement: jest.Mock;
    getMovements: jest.Mock;
  };
  let mockSync: {
    enqueueChange: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findOpen: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      close: jest.fn(),
      buildSummary: jest.fn(),
      getMovementSummary: jest.fn(),
      createMovement: jest.fn(),
      getMovements: jest.fn(),
    };
    mockSync = {
      enqueueChange: jest.fn().mockResolvedValue(undefined),
    };
    service = new CashRegisterService(mockRepo as never, mockSync as never);
  });

  describe('findCurrent', () => {
    it('should return open register with summary and movements', async () => {
      const register = { id: 'cr1', status: 'open', opened_at: 1000 };
      const summary = { total_sales_cents: 5000, payment_summary: [] };
      const movementSummary = { income_cents: 2000, expense_cents: 500, count: 3 };
      mockRepo.findOpen.mockResolvedValue(register);
      mockRepo.buildSummary.mockResolvedValue(summary);
      mockRepo.getMovementSummary.mockResolvedValue(movementSummary);

      const result = await service.findCurrent('c1', 's1');
      expect(result).toEqual({ ...register, ...summary, income_cents: 2000, expense_cents: 500, movement_count: 3 });
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
    it('should return all registers with summary data', async () => {
      const registers = [{ id: 'cr1', opened_at: 1000 }, { id: 'cr2', opened_at: 2000 }];
      mockRepo.findAll.mockResolvedValue(registers);
      mockRepo.buildSummary.mockResolvedValue({ total_sales_cents: 5000, payment_summary: [] });
      mockRepo.getMovementSummary.mockResolvedValue({ income_cents: 2000, expense_cents: 500, count: 3 });

      const result = await service.findAll('c1', 's1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...registers[0],
        total_sales_cents: 5000,
        payment_summary: [],
        income_cents: 2000,
        expense_cents: 500,
        movement_count: 3,
      });
      expect(mockRepo.buildSummary).toHaveBeenCalledTimes(2);
      expect(mockRepo.getMovementSummary).toHaveBeenCalledTimes(2);
    });
  });

  describe('createMovement', () => {
    it('should create a movement on an open register', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cr1', status: 'open' });
      const movement = { id: 'm1', type: 'income', amount_cents: 1000, description: 'Cambio' };
      mockRepo.createMovement.mockResolvedValue(movement);

      const result = await service.createMovement(
        'cr1',
        { type: 'income', amount_cents: 1000, description: 'Cambio' },
        'c1',
        's1',
      );
      expect(result).toEqual(movement);
    });

    it('should throw NotFoundException when register not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        service.createMovement('nonexistent', { type: 'income', amount_cents: 1000, description: 'Test' }, 'c1', 's1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when register is closed', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cr1', status: 'closed' });
      await expect(
        service.createMovement('cr1', { type: 'income', amount_cents: 1000, description: 'Test' }, 'c1', 's1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getMovements', () => {
    it('should return movements for a register', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cr1' });
      const movements = [{ id: 'm1', type: 'income', amount_cents: 1000 }];
      mockRepo.getMovements.mockResolvedValue(movements);

      const result = await service.getMovements('cr1');
      expect(result).toEqual(movements);
    });

    it('should throw NotFoundException when register not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getMovements('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
