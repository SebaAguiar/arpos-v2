import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Injectable()
export class PurchasesRepository {
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

  async findAll(status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        ...(status ? { status } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
            variant: { select: { id: true, size: true, color: true, sku: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, tax_id: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
            variant: { select: { id: true, size: true, color: true, sku: true } },
          },
        },
        receipts: {
          include: {
            creator: { select: { id: true, name: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async create(data: {
    supplierId: string;
    expected_date?: number | null;
    notes?: string | null;
    total_cents: number;
    created_by: string;
    items: Array<{
      productId: string;
      variantId?: string | null;
      quantity_ordered: number;
      unit_cost_cents: number;
      total_cents: number;
    }>;
  }) {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.purchaseOrder.create({
      data: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        supplierId: data.supplierId,
        expected_date: data.expected_date ?? undefined,
        notes: data.notes ?? undefined,
        total_cents: data.total_cents,
        created_by: data.created_by,
        created_at: now,
        updated_at: now,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            quantity_ordered: item.quantity_ordered,
            unit_cost_cents: item.unit_cost_cents,
            total_cents: item.total_cents,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      supplierId?: string;
      status?: string;
      expected_date?: number | null;
      notes?: string | null;
      total_cents?: number;
    },
  ) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
            variant: { select: { id: true, size: true, color: true, sku: true } },
          },
        },
        receipts: {
          include: { creator: { select: { id: true, name: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async replaceItems(
    orderId: string,
    items: Array<{
      productId: string;
      variantId?: string | null;
      quantity_ordered: number;
      unit_cost_cents: number;
      total_cents: number;
    }>,
  ) {
    await this.prisma.purchaseOrderItem.deleteMany({ where: { orderId } });
    return this.prisma.purchaseOrderItem.createMany({
      data: items.map((item) => ({
        ...item,
        variantId: item.variantId ?? undefined,
        orderId,
      })),
    });
  }

  async createReceipt(data: {
    orderId: string;
    supplierId: string;
    receipt_number?: string | null;
    notes?: string | null;
    created_by: string;
  }) {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.purchaseReceipt.create({
      data: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        orderId: data.orderId,
        supplierId: data.supplierId,
        receipt_number: data.receipt_number ?? undefined,
        notes: data.notes ?? undefined,
        created_by: data.created_by,
        created_at: now,
      },
    });
  }

  async updateItemReceived(itemId: string, quantity_received: number) {
    return this.prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: { quantity_received },
    });
  }

  async createInventoryMovement(data: {
    productId: string;
    variantId?: string | null;
    type: string;
    quantity: number;
    reference_type: string;
    reference_id: string;
    reason: string;
    userId: string;
  }) {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.inventoryMovement.create({
      data: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        productId: data.productId,
        variantId: data.variantId ?? undefined,
        type: data.type,
        quantity: data.quantity,
        reference_type: data.reference_type,
        reference_id: data.reference_id,
        reason: data.reason,
        userId: data.userId,
        created_at: now,
      },
    });
  }

  async updateInventoryQuantity(
    productId: string,
    variantId: string | null,
    quantityDelta: number,
  ) {
    const vId = variantId ?? '';

    const existing = await this.prisma.inventory.findFirst({
      where: {
        storeId: this.getStoreId(),
        productId,
        variantId: vId,
      },
    });

    if (existing) {
      return this.prisma.inventory.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantityDelta },
      });
    }

    const now = Math.floor(Date.now() / 1000);
    return this.prisma.inventory.create({
      data: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        productId,
        variantId: vId,
        quantity: quantityDelta,
        created_at: now,
        updated_at: now,
      },
    });
  }
}
