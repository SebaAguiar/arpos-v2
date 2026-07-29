import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { SyncService } from '../sync/sync.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { CreditWalletInput, DebitWalletInput } from './dto/create-transaction.schema';
import { WalletTransaction } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger('WalletService');

  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly syncService: SyncService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async credit(contactId: string, input: CreditWalletInput) {
    const contact = await this.walletRepo.getContact(contactId);
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }

    const userId = this.tenantContext.getUserId();

    const result = await this.walletRepo.credit(
      contactId,
      input.amount_cents,
      input.notes,
      'manual',
      undefined,
      userId,
    );

    await this.syncService.enqueueChange('create', 'wallet_transaction', result.transaction.id, {
      contactId,
      type: 'credit',
      amount_cents: input.amount_cents,
    });

    this.logger.log(`Credited ${input.amount_cents} cents to wallet of contact ${contactId}`);

    return {
      transaction: this.mapTransaction(result.transaction),
      balance_cents: result.balance,
    };
  }

  async debit(contactId: string, input: DebitWalletInput) {
    const contact = await this.walletRepo.getContact(contactId);
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }

    const balance = await this.walletRepo.getBalance(contactId);
    if (balance !== null && balance < input.amount_cents) {
      throw new BadRequestException('Insufficient balance');
    }

    const userId = this.tenantContext.getUserId();

    const result = await this.walletRepo.debit(
      contactId,
      input.amount_cents,
      input.notes,
      'manual',
      undefined,
      userId,
    );

    await this.syncService.enqueueChange('create', 'wallet_transaction', result.transaction.id, {
      contactId,
      type: 'debit',
      amount_cents: input.amount_cents,
    });

    this.logger.log(`Debited ${input.amount_cents} cents from wallet of contact ${contactId}`);

    return {
      transaction: this.mapTransaction(result.transaction),
      balance_cents: result.balance,
    };
  }

  async getBalance(contactId: string) {
    const contact = await this.walletRepo.getContact(contactId);
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }

    const balance = await this.walletRepo.getBalance(contactId);

    return { contactId, balance_cents: balance ?? 0 };
  }

  async getTransactions(contactId: string, limit?: number, offset?: number) {
    const contact = await this.walletRepo.getContact(contactId);
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }

    const transactions = await this.walletRepo.getTransactions(contactId, limit, offset);

    return transactions.map((t) => this.mapTransaction(t));
  }

  async internalDebit(
    contactId: string,
    amountCents: number,
    reference: string,
    referenceId: string,
    notes?: string,
  ): Promise<{ transaction: WalletTransaction; balance: number }> {
    const userId = this.tenantContext.getUserId();

    return this.walletRepo.debit(contactId, amountCents, notes, reference, referenceId, userId);
  }

  async internalCredit(
    contactId: string,
    amountCents: number,
    reference: string,
    referenceId: string,
    notes?: string,
  ): Promise<{ transaction: WalletTransaction; balance: number }> {
    const userId = this.tenantContext.getUserId();

    return this.walletRepo.credit(contactId, amountCents, notes, reference, referenceId, userId);
  }

  private mapTransaction(t: WalletTransaction) {
    return {
      id: t.id,
      contactId: t.contactId,
      type: t.type,
      amount_cents: t.amount_cents,
      balance_before: t.balance_before,
      balance_after: t.balance_after,
      reference: t.reference,
      reference_id: t.reference_id,
      notes: t.notes,
      created_by: t.created_by,
      created_at: t.created_at,
    };
  }
}
