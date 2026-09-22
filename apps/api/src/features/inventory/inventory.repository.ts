import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { InventoryMovement } from '@prisma/client';

export interface StockItem {
  productId: string;
  productCode: string;
  productName: string;
  stock_quantity: number;
  cost_cents: number | null;
  min_stock: number | null;
  category_id: string | null;
  last_movement_at: number | null;
}

export interface InventoryMovementData {
  id: string;
  companyId: string;
  storeId: string;
  productId: string;
  userId: string | null;
  type: string;
  quantity: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: number;
  productName?: string;
  productCode?: string;
}

export interface InventoryCategoryGroup {
  category: string | null;
  count: number;
  valueCents: number;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  productCode: string;
  stockQuantity: number;
  costCents: number | null;
  priceCents: number;
}

export interface OutOfStockProduct {
  productId: string;
  productName: string;
  productCode: string;
  costCents: number | null;
  priceCents: number;
}

export interface InventoryReportData {
  totalProducts: number;
  totalStockValueCents: number;
  lowStockCount: number;
  outOfStockCount: number;
  byCategory: InventoryCategoryGroup[];
  lowStockProducts: LowStockProduct[];
  outOfStockProducts: OutOfStockProduct[];
}

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(companyId: string, storeId: string): Promise<StockItem[]> {
    const products = await this.prisma.product.findMany({
      where: { companyId, storeId, is_active: true },
      select: {
        id: true,
        code: true,
        name: true,
        stock_quantity: true,
        cost_cents: true,
        category_id: true,
        variants: {
          where: { is_active: true },
          select: { stock_quantity: true, cost_cents: true },
        },
        inventory: {
          where: { storeId },
          select: { min_stock: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const lastMovements = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: {
        companyId,
        storeId,
        productId: { in: products.map((p) => p.id) },
      },
      _max: { created_at: true },
    });

    const movementMap = new Map<string, number | null>(
      lastMovements.map((m) => [m.productId, m._max.created_at ?? null]),
    );

    return products.map((p) => {
      const hasVariants = p.variants.length > 0;
      const stockQuantity = hasVariants
        ? p.variants.reduce((acc, v) => acc + v.stock_quantity, 0)
        : p.stock_quantity;
      const primaryStock = p.variants.find((v) => v.stock_quantity > 0) ?? p.variants[0];
      const costCents = hasVariants
        ? (primaryStock?.cost_cents ?? p.cost_cents)
        : p.cost_cents;

      return {
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        stock_quantity: stockQuantity,
        cost_cents: costCents,
        min_stock: p.inventory[0]?.min_stock ?? null,
        category_id: p.category_id,
        last_movement_at: movementMap.get(p.id) ?? null,
      };
    });
  }

  async getReport(companyId: string, storeId: string): Promise<InventoryReportData> {
    const products = await this.prisma.product.findMany({
      where: { companyId, storeId, is_active: true },
      select: {
        id: true,
        code: true,
        name: true,
        stock_quantity: true,
        cost_cents: true,
        price_cents: true,
        category_id: true,
        variants: {
          where: { is_active: true },
          select: { stock_quantity: true, cost_cents: true, price_cents: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    let totalStockValueCents = 0;
    const categoryMap = new Map<string | null, { count: number; valueCents: number }>();
    const lowStockProducts: LowStockProduct[] = [];
    const outOfStockProducts: OutOfStockProduct[] = [];

    for (const p of products) {
      const hasVariants = p.variants.length > 0;
      const stockQuantity = hasVariants
        ? p.variants.reduce((acc, v) => acc + v.stock_quantity, 0)
        : p.stock_quantity;
      const primaryStock = p.variants.find((v) => v.stock_quantity > 0) ?? p.variants[0];
      const costCents = hasVariants
        ? (primaryStock?.cost_cents ?? p.cost_cents)
        : p.cost_cents;
      const priceCents = hasVariants
        ? (primaryStock?.price_cents ?? p.price_cents)
        : p.price_cents;

      const stockValue = (costCents ?? 0) * stockQuantity;
      totalStockValueCents += stockValue;

      const cat = p.category_id ?? null;
      const existing = categoryMap.get(cat) ?? { count: 0, valueCents: 0 };
      existing.count += 1;
      existing.valueCents += stockValue;
      categoryMap.set(cat, existing);

      if (stockQuantity <= 0) {
        outOfStockProducts.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          costCents,
          priceCents,
        });
      } else if (stockQuantity <= LOW_STOCK_THRESHOLD) {
        lowStockProducts.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          stockQuantity,
          costCents,
          priceCents,
        });
      }
    }

    const byCategory: InventoryCategoryGroup[] = [];
    for (const [category, data] of categoryMap) {
      byCategory.push({ category, count: data.count, valueCents: data.valueCents });
    }
    byCategory.sort((a, b) => b.valueCents - a.valueCents);

    lowStockProducts.sort((a, b) => a.stockQuantity - b.stockQuantity);
    outOfStockProducts.sort((a, b) => a.productName.localeCompare(b.productName));

    return {
      totalProducts: products.length,
      totalStockValueCents,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      byCategory,
      lowStockProducts,
      outOfStockProducts,
    };
  }

  async getMovements(
    companyId: string,
    storeId: string,
    filters: {
      productId?: string;
      type?: string;
      from?: number;
      to?: number;
    },
  ): Promise<InventoryMovementData[]> {
    const where: Record<string, unknown> = { companyId, storeId };

    if (filters.productId) {
      where.productId = filters.productId;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.from || filters.to) {
      where.created_at = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { code: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return movements.map((m) => ({
      id: m.id,
      companyId: m.companyId,
      storeId: m.storeId,
      productId: m.productId,
      userId: m.userId,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      reference_type: m.reference_type,
      reference_id: m.reference_id,
      created_at: m.created_at,
      productName: m.product.name,
      productCode: m.product.code,
    }));
  }

  async createMovement(data: {
    companyId: string;
    storeId: string;
    productId: string;
    userId?: string;
    type: string;
    quantity: number;
    reason: string;
    reference_type?: string;
    reference_id?: string;
  }): Promise<InventoryMovement> {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.inventoryMovement.create({
      data: {
        companyId: data.companyId,
        storeId: data.storeId,
        productId: data.productId,
        userId: data.userId ?? null,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        reference_type: data.reference_type ?? null,
        reference_id: data.reference_id ?? null,
        created_at: now,
      },
    });
  }

  async adjustStock(productId: string, quantityDelta: number): Promise<void> {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock_quantity: { increment: quantityDelta },
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: {
        variants: {
          where: { is_active: true },
          orderBy: { created_at: 'asc' },
          select: { id: true },
        },
      },
    });

    // The variant owns stock when it exists; keep the primary variant in sync
    // so the report (which aggregates variant stock) reflects the movement.
    const primaryVariant = product.variants[0];
    if (primaryVariant) {
      await this.prisma.productVariant.update({
        where: { id: primaryVariant.id },
        data: { stock_quantity: { increment: quantityDelta } },
      });
    }
  }
}
