import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { CashRegister } from '@prisma/client';

export interface PaymentMethodSummary {
  payment_method: string;
  total_cents: number;
  count: number;
}

export interface CashRegisterWithSummary extends CashRegister {
  total_sales_cents: number;
  payment_summary: PaymentMethodSummary[];
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
}
