import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import type { WalletTransaction } from '@prisma/client';

function buildTransaction(overrides: Partial<WalletTransaction> = {}): WalletTransaction {
  return {
    id: 'tx-1',
    contactId: 'contact-1',
    type: 'credit',
    amount_cents: 5000,
    balance_before: 1000,
    balance_after: 6000,
    reference: 'manual',
    reference_id: null,
    notes: 'Pago inicial',
    created_by: 'user-1',
    created_at: 1750000000,
    ...overrides,
  } as WalletTransaction;
}

describe('WalletService', () => {
  let service: WalletService;
  let mockWalletRepo: Record<string, jest.Mock>;
  let mockSync: Record<string, jest.Mock>;
  let mockTenant: { getUserId: jest.Mock };

  beforeEach(() => {
    mockWalletRepo = {
      getContact: jest.fn(),
      getBalance: jest.fn(),
      getTransactions: jest.fn(),
      credit: jest.fn(),
      debit: jest.fn(),
    };
    mockSync = { enqueueChange: jest.fn() };
    mockTenant = { getUserId: jest.fn().mockReturnValue('user-1') };

    service = new WalletService(
      mockWalletRepo as never,
      mockSync as never,
      mockTenant as never,
    );
  });

  describe('credit', () => {
    it('throws NotFoundException when the contact is missing', async () => {
      mockWalletRepo.getContact.mockResolvedValue(null);

      await expect(
        service.credit('contact-1', { amount_cents: 1000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('persists the credit and enqueues a wallet_transaction sync change', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.credit.mockResolvedValue({
        transaction: buildTransaction(),
        balance: 6000,
      });

      const result = await service.credit('contact-1', {
        amount_cents: 5000,
        notes: 'Pago inicial',
      });

      expect(mockWalletRepo.credit).toHaveBeenCalledWith(
        'contact-1',
        5000,
        'Pago inicial',
        'manual',
        undefined,
        'user-1',
      );
      expect(mockSync.enqueueChange).toHaveBeenCalledWith(
        'create',
        'wallet_transaction',
        'tx-1',
        { contactId: 'contact-1', type: 'credit', amount_cents: 5000 },
      );
      expect(result).toEqual({
        transaction: expect.objectContaining({
          id: 'tx-1',
          type: 'credit',
          amount_cents: 5000,
          balance_before: 1000,
          balance_after: 6000,
        }),
        balance_cents: 6000,
      });
    });
  });

  describe('debit', () => {
    it('throws NotFoundException when the contact is missing', async () => {
      mockWalletRepo.getContact.mockResolvedValue(null);

      await expect(
        service.debit('contact-1', { amount_cents: 1000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects debit beyond the available balance', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.getBalance.mockResolvedValue(1000);

      await expect(
        service.debit('contact-1', { amount_cents: 1001 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows a debit that uses the whole balance', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.getBalance.mockResolvedValue(1000);
      mockWalletRepo.debit.mockResolvedValue({
        transaction: buildTransaction({ type: 'debit', amount_cents: 1000 }),
        balance: 0,
      });

      const result = await service.debit('contact-1', { amount_cents: 1000 });

      expect(result.balance_cents).toBe(0);
      expect(mockWalletRepo.debit).toHaveBeenCalled();
    });

    it('enqueues the sync change with type debit', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.getBalance.mockResolvedValue(5000);
      mockWalletRepo.debit.mockResolvedValue({
        transaction: buildTransaction({ type: 'debit', amount_cents: 2000 }),
        balance: 3000,
      });

      await service.debit('contact-1', { amount_cents: 2000 });

      expect(mockSync.enqueueChange).toHaveBeenCalledWith(
        'create',
        'wallet_transaction',
        'tx-1',
        { contactId: 'contact-1', type: 'debit', amount_cents: 2000 },
      );
    });
  });

  describe('getBalance', () => {
    it('throws NotFoundException when the contact is missing', async () => {
      mockWalletRepo.getContact.mockResolvedValue(null);

      await expect(service.getBalance('contact-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('normalizes a null balance to 0', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.getBalance.mockResolvedValue(null);

      await expect(service.getBalance('contact-1')).resolves.toEqual({
        contactId: 'contact-1',
        balance_cents: 0,
      });
    });

    it('returns the stored balance', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.getBalance.mockResolvedValue(4500);

      await expect(service.getBalance('contact-1')).resolves.toEqual({
        contactId: 'contact-1',
        balance_cents: 4500,
      });
    });
  });

  describe('getTransactions', () => {
    it('throws NotFoundException when the contact is missing', async () => {
      mockWalletRepo.getContact.mockResolvedValue(null);

      await expect(service.getTransactions('contact-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('maps the raw transactions and forwards pagination', async () => {
      mockWalletRepo.getContact.mockResolvedValue({ id: 'contact-1' });
      mockWalletRepo.getTransactions.mockResolvedValue([
        buildTransaction(),
        buildTransaction({ id: 'tx-2', amount_cents: 750 }),
      ]);

      const result = await service.getTransactions('contact-1', 10, 5);

      expect(mockWalletRepo.getTransactions).toHaveBeenCalledWith(
        'contact-1',
        10,
        5,
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'tx-1',
          contactId: 'contact-1',
          type: 'credit',
          amount_cents: 5000,
          balance_before: 1000,
          balance_after: 6000,
        }),
      );
      expect(result[1]).toEqual(expect.objectContaining({ id: 'tx-2' }));
    });
  });

  describe('internal credit/debit', () => {
    it('debits straight through with reference + userId, skipping contact checks', async () => {
      mockWalletRepo.debit.mockResolvedValue({
        transaction: buildTransaction({ type: 'debit' }),
        balance: 0,
      });

      const result = await service.internalDebit(
        'contact-1',
        500,
        'sale',
        'sale-9',
        'Venta #9',
      );

      expect(mockWalletRepo.getContact).not.toHaveBeenCalled();
      expect(mockWalletRepo.debit).toHaveBeenCalledWith(
        'contact-1',
        500,
        'Venta #9',
        'sale',
        'sale-9',
        'user-1',
      );
      expect(result.balance).toBe(0);
    });

    it('credits straight through with reference + userId', async () => {
      mockWalletRepo.credit.mockResolvedValue({
        transaction: buildTransaction(),
        balance: 3000,
      });

      const result = await service.internalCredit(
        'contact-1',
        2500,
        'refund',
        'refund-3',
        'Reembolso',
      );

      expect(mockWalletRepo.credit).toHaveBeenCalledWith(
        'contact-1',
        2500,
        'Reembolso',
        'refund',
        'refund-3',
        'user-1',
      );
      expect(result.transaction.type).toBe('credit');
    });
  });
});