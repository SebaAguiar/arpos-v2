import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';

export interface PaymentMethodSummary {
  payment_method: string;
  total_cents: number;
  count: number;
}

export interface CashRegisterWithSummary {
  id: string;
  companyId: string;
  storeId: string;
  name: string;
  status: string;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: number | null;
  closed_at: number | null;
  created_at: number;
  updated_at: number;
  total_sales_cents: number;
  payment_summary: PaymentMethodSummary[];
}

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildSummary(
    companyId: string,
    storeId: string,
    openedAt: number,
  ): Promise<{ total_sales_cents: number; payment_summary: PaymentMethodSummary[] }> {
    const sales = await this.prisma.sale.findMany({
      where: {
        companyId,
        storeId,
        status: 'completed',
        created_at: { gte: openedAt },
      },
      select: {
        payment_method: true,
        total_cents: true,
      },
    });

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
      ([payment_method, data]) => ({
        payment_method,
        ...data,
      }),
    );

    return { total_sales_cents, payment_summary };
  }

  async findCurrent(companyId: string, storeId: string): Promise<CashRegisterWithSummary> {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        companyId,
        storeId,
        status: 'open',
      },
      orderBy: { opened_at: 'desc' },
    });

    if (!register) {
      throw new NotFoundException('No open cash register found');
    }

    const { total_sales_cents, payment_summary } = await this.buildSummary(
      companyId,
      storeId,
      register.opened_at ?? 0,
    );

    return { ...register, total_sales_cents, payment_summary };
  }

  async findAll(companyId: string, storeId: string) {
    return this.prisma.cashRegister.findMany({
      where: { companyId, storeId },
      orderBy: { created_at: 'desc' },
    });
  }

  async open(
    data: { name: string; opening_amount: number },
    companyId: string,
    storeId: string,
  ) {
    const existingOpen = await this.prisma.cashRegister.findFirst({
      where: {
        companyId,
        storeId,
        status: 'open',
      },
    });

    if (existingOpen) {
      throw new ConflictException(
        'A cash register is already open. Close it before opening a new one.',
      );
    }

    const now = Math.floor(Date.now() / 1000);

    return this.prisma.cashRegister.create({
      data: {
        companyId,
        storeId,
        name: data.name,
        status: 'open',
        opening_amount: data.opening_amount,
        opened_at: now,
        created_at: now,
        updated_at: now,
      },
    });
  }

  async close(id: string, closing_amount: number) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
    });

    if (!register) {
      throw new NotFoundException(`Cash register with id ${id} not found`);
    }

    if (register.status === 'closed') {
      throw new ConflictException('Cash register is already closed');
    }

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

  async findOne(id: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
    });

    if (!register) {
      throw new NotFoundException(`Cash register with id ${id} not found`);
    }

    return register;
  }
}
