import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';

interface CreateProductData {
  code: string;
  name: string;
  description?: string;
  price_cents: number;
  cost_cents?: number;
  stock_quantity?: number;
  sku?: string;
  category_id?: string;
  storeId: string;
}

interface UpdateProductData {
  name?: string;
  description?: string;
  price_cents?: number;
  cost_cents?: number;
  sku?: string;
  category_id?: string;
  is_active?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, storeId?: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        is_active: true,
        ...(storeId ? { storeId } : {}),
      },
      include: {
        inventory: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { inventory: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async create(data: CreateProductData, companyId: string) {
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
        storeId: data.storeId,
        code: data.code,
        name: data.name,
        description: data.description,
        price_cents: data.price_cents,
        cost_cents: data.cost_cents,
        stock_quantity: data.stock_quantity ?? 0,
        sku,
        category_id: data.category_id,
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: { inventory: true },
    });
  }

  async update(id: string, data: UpdateProductData) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: { inventory: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

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
