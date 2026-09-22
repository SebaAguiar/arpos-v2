import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ProductVariant } from '@prisma/client';
import { CreateVariantInput } from './dto/create-variant.schema';
import { UpdateVariantInput } from './dto/update-variant.schema';

@Injectable()
export class VariantsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async findByProduct(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({
      where: {
        productId,
        companyId: this.getCompanyId(),
      },
      include: { inventory: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async findById(id: string): Promise<ProductVariant | null> {
    return this.prisma.productVariant.findFirst({
      where: { id, companyId: this.getCompanyId() },
      include: { inventory: true },
    });
  }

  async create(data: CreateVariantInput): Promise<ProductVariant> {
    const companyId = this.getCompanyId();
    const now = Math.floor(Date.now() / 1000);

    return this.prisma.productVariant.create({
      data: {
        companyId,
        productId: data.productId,
        size: data.size,
        color: data.color,
        barcode: data.barcode,
        sku: data.sku,
        price_cents: data.price_cents ?? 0,
        cost_cents: data.cost_cents,
        stock_quantity: data.stock_quantity ?? 0,
        created_at: now,
        updated_at: now,
      },
      include: { inventory: true },
    });
  }

  async update(id: string, data: UpdateVariantInput): Promise<ProductVariant> {
    return this.prisma.productVariant.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: { inventory: true },
    });
  }

  async remove(id: string): Promise<ProductVariant> {
    return this.prisma.productVariant.update({
      where: { id },
      data: { is_active: false, updated_at: Math.floor(Date.now() / 1000) },
      include: { inventory: true },
    });
  }

  async countByProduct(productId: string): Promise<number> {
    return this.prisma.productVariant.count({
      where: {
        productId,
        companyId: this.getCompanyId(),
        is_active: true,
      },
    });
  }
}
