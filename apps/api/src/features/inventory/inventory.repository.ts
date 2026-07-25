import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { InventoryMovement } from '@prisma/client';

export interface StockItem {
  productId: string;
  productCode: string;
  productName: string;
  stock_quantity: number;
  cost_cents: number | null;
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
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      productId: p.id,
      productCode: p.code,
      productName: p.name,
      stock_quantity: p.stock_quantity,
      cost_cents: p.cost_cents,
    }));
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
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock_quantity: { increment: quantityDelta },
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }
}
