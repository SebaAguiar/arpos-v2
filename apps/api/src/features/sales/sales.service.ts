import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unit_price_cents: number;
  discount_cents?: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  total_cents: number;
  discount_cents?: number;
  tax_cents?: number;
  payment_method: string;
  payment_details?: string;
  contact_id?: string;
  notes?: string;
  cash_register_id?: string;
}

export interface SaleFilters {
  from?: number;
  to?: number;
  status?: string;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll(filters?: SaleFilters) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();

    const where: Record<string, unknown> = {
      companyId,
      storeId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.from || filters?.to) {
      where.created_at = {};
      if (filters.from) {
        (where.created_at as Record<string, number>).gte = filters.from;
      }
      if (filters.to) {
        (where.created_at as Record<string, number>).lte = filters.to;
      }
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const companyId = this.tenantContext.getCompanyId();

    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async create(input: CreateSaleInput) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    const userId = this.tenantContext.getUserId() || 'system';

    const now = Math.floor(Date.now() / 1000);

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          companyId,
          storeId,
          user_id: userId,
          contact_id: input.contact_id,
          cash_register_id: input.cash_register_id,
          total_cents: input.total_cents,
          discount_cents: input.discount_cents ?? 0,
          tax_cents: input.tax_cents ?? 0,
          status: 'completed',
          payment_method: input.payment_method,
          payment_details: input.payment_details,
          notes: input.notes,
          created_at: now,
          updated_at: now,
        },
      });

      for (const item of input.items) {
        const itemTotalCents = item.unit_price_cents * item.quantity;
        const itemDiscountCents = item.discount_cents ?? 0;

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            total_cents: itemTotalCents,
            discount_cents: itemDiscountCents,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
            updated_at: now,
          },
        });
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: true,
        },
      });
    });
  }

  async getStats(from?: number, to?: number): Promise<SaleStats> {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();

    const where: Record<string, unknown> = {
      companyId,
      storeId,
      status: 'completed',
    };

    if (from || to) {
      where.created_at = {};
      if (from) {
        (where.created_at as Record<string, number>).gte = from;
      }
      if (to) {
        (where.created_at as Record<string, number>).lte = to;
      }
    }

    const result = await this.prisma.sale.aggregate({
      where,
      _count: {
        id: true,
      },
      _sum: {
        total_cents: true,
      },
      _avg: {
        total_cents: true,
      },
    });

    return {
      totalSales: result._count.id,
      totalRevenue: result._sum.total_cents ?? 0,
      averageTicket: Math.round(result._avg.total_cents ?? 0),
    };
  }
}
