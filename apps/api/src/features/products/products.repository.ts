import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { Product } from '@prisma/client';
import { CreateProductInput } from './dto/create-product.schema';
import { UpdateProductInput } from './dto/update-product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async findAll(storeId?: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        companyId: this.getCompanyId(),
        is_active: true,
        ...(storeId ? { storeId } : {}),
      },
      include: { inventory: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { id, companyId: this.getCompanyId() },
      include: { inventory: true },
    });
  }

  async create(data: CreateProductInput, companyId: string, storeId?: string): Promise<Product> {
    const now = Math.floor(Date.now() / 1000);
    const effectiveStoreId = storeId || this.tenantContext.getStoreId();

    let sku = data.sku;
    if (!sku) {
      const lastProduct = await this.prisma.product.findFirst({
        where: { companyId },
        orderBy: { created_at: 'desc' },
      });
      const nextNumber = lastProduct?.sku
        ? parseInt(lastProduct.sku, 10) + 1
        : 1;
      sku = String(nextNumber).padStart(4, '0');
    }

    return this.prisma.product.create({
      data: {
        companyId,
        storeId: effectiveStoreId,
        code: data.code,
        name: data.name,
        description: data.description,
        price_cents: data.price_cents,
        cost_cents: data.cost_cents,
        stock_quantity: data.stock_quantity ?? 0,
        sku,
        category_id: data.category_id,
        created_at: now,
        updated_at: now,
      },
      include: { inventory: true },
    });
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: { inventory: true },
    });
  }

  async softDelete(id: string): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: { inventory: true },
    });
  }
}
