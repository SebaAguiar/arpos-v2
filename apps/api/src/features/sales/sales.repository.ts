import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { Sale, Prisma } from '@prisma/client';
import { CreateSaleInput } from './dto/create-sale.schema';

@Injectable()
export class SalesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  private getStoreId(): string {
    return this.tenantContext.getStoreId();
  }

  async findAll(filters?: { from?: number; to?: number; status?: string }): Promise<Sale[]> {
    const where: Prisma.SaleWhereInput = {
      companyId: this.getCompanyId(),
      storeId: this.getStoreId(),
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.from || filters?.to) {
      where.created_at = {};
      if (filters.from) {
        where.created_at.gte = filters.from;
      }
      if (filters.to) {
        where.created_at.lte = filters.to;
      }
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string): Promise<Sale | null> {
    return this.prisma.sale.findFirst({
      where: { id, companyId: this.getCompanyId() },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(input: CreateSaleInput): Promise<Sale> {
    const companyId = this.getCompanyId();
    const storeId = this.getStoreId();
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
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock_quantity: true, name: true },
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}": has ${product.stock_quantity}, needs ${item.quantity}`,
          );
        }

        const itemTotalCents = item.unit_price_cents * item.quantity;

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            total_cents: itemTotalCents,
            discount_cents: item.discount_cents ?? 0,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock_quantity: { decrement: item.quantity },
            updated_at: now,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            storeId,
            productId: item.productId,
            userId,
            type: 'sale',
            quantity: -item.quantity,
            reason: `Venta #${sale.id}`,
            reference_type: 'sale',
            reference_id: sale.id,
            created_at: now,
          },
        });
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: { items: true },
      }) as Promise<Sale>;
    });
  }

  async getStats(from?: number, to?: number) {
    const where: Prisma.SaleWhereInput = {
      companyId: this.getCompanyId(),
      storeId: this.getStoreId(),
      status: 'completed',
    };

    if (from || to) {
      where.created_at = {};
      if (from) {
        where.created_at.gte = from;
      }
      if (to) {
        where.created_at.lte = to;
      }
    }

    const result = await this.prisma.sale.aggregate({
      where,
      _count: { id: true },
      _sum: { total_cents: true },
      _avg: { total_cents: true },
    });

    return {
      totalSales: result._count.id,
      totalRevenue: result._sum.total_cents ?? 0,
      averageTicket: Math.round(result._avg.total_cents ?? 0),
    };
  }

  async getSalesByPaymentMethod(from?: number, to?: number) {
    const where: Prisma.SaleWhereInput = {
      companyId: this.getCompanyId(),
      storeId: this.getStoreId(),
      status: 'completed',
    };

    if (from || to) {
      where.created_at = {};
      if (from) {
        where.created_at.gte = from;
      }
      if (to) {
        where.created_at.lte = to;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where,
      select: { payment_method: true, total_cents: true },
    });

    const grouped = new Map<string, { total_cents: number; count: number }>();
    for (const sale of sales) {
      const existing = grouped.get(sale.payment_method) ?? { total_cents: 0, count: 0 };
      grouped.set(sale.payment_method, {
        total_cents: existing.total_cents + sale.total_cents,
        count: existing.count + 1,
      });
    }

    return Array.from(grouped.entries()).map(([method, data]) => ({
      payment_method: method,
      ...data,
    }));
  }

  async getTopProducts(from?: number, to?: number, limit = 10) {
    const where: Prisma.SaleWhereInput = {
      companyId: this.getCompanyId(),
      storeId: this.getStoreId(),
      status: 'completed',
    };

    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = from;
      if (to) where.created_at.lte = to;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      select: {
        items: {
          select: {
            productId: true,
            quantity: true,
            total_cents: true,
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const productMap = new Map<string, { name: string; code: string; total_cents: number; quantity: number }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId) ?? {
          name: item.product.name,
          code: item.product.code,
          total_cents: 0,
          quantity: 0,
        };
        existing.total_cents += item.total_cents;
        existing.quantity += item.quantity;
        productMap.set(item.productId, existing);
      }
    }

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        productCode: data.code,
        total_cents: data.total_cents,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.total_cents - a.total_cents)
      .slice(0, limit);
  }
}
