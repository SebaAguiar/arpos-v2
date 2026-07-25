import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { CashRegister, CashMovement } from '@prisma/client';

export interface PaymentMethodSummary {
  payment_method: string;
  total_cents: number;
  count: number;
}

export interface CashRegisterWithSummary extends CashRegister {
  total_sales_cents: number;
  payment_summary: PaymentMethodSummary[];
  income_cents: number;
  expense_cents: number;
  movement_count: number;
}

export interface CashMovementSummary {
  income_cents: number;
  expense_cents: number;
  count: number;
}

@Injectable()
export class CashRegisterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOpen(companyId: string, storeId: string): Promise<CashRegister | null> {
    return this.prisma.cashRegister.findFirst({
      where: { companyId, storeId, status: 'open' },
      orderBy: { opened_at: 'desc' },
    });
  }

  async findAll(companyId: string, storeId: string): Promise<CashRegister[]> {
    return this.prisma.cashRegister.findMany({
      where: { companyId, storeId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string): Promise<CashRegister | null> {
    return this.prisma.cashRegister.findUnique({ where: { id } });
  }

  async create(data: {
    companyId: string;
    storeId: string;
    name: string;
    opening_amount: number;
  }): Promise<CashRegister> {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.cashRegister.create({
      data: {
        companyId: data.companyId,
        storeId: data.storeId,
        name: data.name,
        status: 'open',
        opening_amount: data.opening_amount,
        opened_at: now,
        created_at: now,
        updated_at: now,
      },
    });
  }

  async close(id: string, closing_amount: number): Promise<CashRegister> {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'closed',
        closing_amount,
        closed_at: now,
        updated_at: now,
      },
    });
  }

  async getSalesSince(
    companyId: string,
    storeId: string,
    openedAt: number,
  ): Promise<{ payment_method: string; total_cents: number }[]> {
    return this.prisma.sale.findMany({
      where: {
        companyId,
        storeId,
        status: 'completed',
        created_at: { gte: openedAt },
      },
      select: { payment_method: true, total_cents: true },
    });
  }

  async buildSummary(
    companyId: string,
    storeId: string,
    openedAt: number,
  ): Promise<{ total_sales_cents: number; payment_summary: PaymentMethodSummary[] }> {
    const sales = await this.getSalesSince(companyId, storeId, openedAt);

    const total_sales_cents = sales.reduce((sum, s) => sum + s.total_cents, 0);

    const grouped = new Map<string, { total_cents: number; count: number }>();
    for (const sale of sales) {
      const existing = grouped.get(sale.payment_method) ?? { total_cents: 0, count: 0 };
      grouped.set(sale.payment_method, {
        total_cents: existing.total_cents + sale.total_cents,
        count: existing.count + 1,
      });
    }

    const payment_summary: PaymentMethodSummary[] = Array.from(grouped.entries()).map(
      ([payment_method, data]) => ({ payment_method, ...data }),
    );

    return { total_sales_cents, payment_summary };
  }

  async createMovement(data: {
    cashRegisterId: string;
    companyId: string;
    storeId: string;
    type: string;
    amount_cents: number;
    description: string;
  }): Promise<CashMovement> {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.cashMovement.create({
      data: {
        cashRegisterId: data.cashRegisterId,
        companyId: data.companyId,
        storeId: data.storeId,
        type: data.type,
        amount_cents: data.amount_cents,
        description: data.description,
        created_at: now,
      },
    });
  }

  async getMovements(cashRegisterId: string): Promise<CashMovement[]> {
    return this.prisma.cashMovement.findMany({
      where: { cashRegisterId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getMovementSummary(cashRegisterId: string): Promise<CashMovementSummary> {
    const movements = await this.prisma.cashMovement.findMany({
      where: { cashRegisterId },
      select: { type: true, amount_cents: true },
    });

    let income_cents = 0;
    let expense_cents = 0;
    for (const m of movements) {
      if (m.type === 'income') income_cents += m.amount_cents;
      else expense_cents += m.amount_cents;
    }

    return { income_cents, expense_cents, count: movements.length };
  }
}
