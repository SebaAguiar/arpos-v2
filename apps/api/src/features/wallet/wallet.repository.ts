import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { Contact, WalletTransaction } from '@prisma/client';

@Injectable()
export class WalletRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async getContact(contactId: string): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: {
        id: contactId,
        companyId: this.getCompanyId(),
        is_active: true,
      },
    });
  }

  async credit(
    contactId: string,
    amountCents: number,
    notes?: string,
    reference?: string,
    referenceId?: string,
    userId?: string,
  ): Promise<{ transaction: WalletTransaction; balance: number }> {
    const now = Math.floor(Date.now() / 1000);

    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.contact.findFirst({
        where: { id: contactId, companyId: this.getCompanyId() },
        select: { balance_cents: true },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      const balanceBefore = contact.balance_cents;
      const balanceAfter = balanceBefore + amountCents;

      await tx.contact.update({
        where: { id: contactId },
        data: { balance_cents: balanceAfter, updated_at: now },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          companyId: this.getCompanyId(),
          contactId,
          type: 'credit',
          amount_cents: amountCents,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference,
          reference_id: referenceId,
          notes,
          created_by: userId,
          created_at: now,
        },
      });

      return { transaction, balance: balanceAfter };
    });
  }

  async debit(
    contactId: string,
    amountCents: number,
    notes?: string,
    reference?: string,
    referenceId?: string,
    userId?: string,
  ): Promise<{ transaction: WalletTransaction; balance: number }> {
    const now = Math.floor(Date.now() / 1000);

    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.contact.findFirst({
        where: { id: contactId, companyId: this.getCompanyId() },
        select: { balance_cents: true },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      if (contact.balance_cents < amountCents) {
        throw new Error('Insufficient balance');
      }

      const balanceBefore = contact.balance_cents;
      const balanceAfter = balanceBefore - amountCents;

      await tx.contact.update({
        where: { id: contactId },
        data: { balance_cents: balanceAfter, updated_at: now },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          companyId: this.getCompanyId(),
          contactId,
          type: 'debit',
          amount_cents: amountCents,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference,
          reference_id: referenceId,
          notes,
          created_by: userId,
          created_at: now,
        },
      });

      return { transaction, balance: balanceAfter };
    });
  }

  async getBalance(contactId: string): Promise<number | null> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        companyId: this.getCompanyId(),
        is_active: true,
      },
      select: { balance_cents: true },
    });

    return contact?.balance_cents ?? null;
  }

  async getTransactions(
    contactId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<WalletTransaction[]> {
    return this.prisma.walletTransaction.findMany({
      where: {
        contactId,
        companyId: this.getCompanyId(),
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
