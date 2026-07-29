import { PurchasesService } from "../services/purchases.service";
import type { PurchaseOrder } from "@/lib/types";

function mapOrder(order: any): PurchaseOrder {
  return {
    id: order.id,
    companyId: order.companyId,
    storeId: order.storeId,
    supplierId: order.supplierId,
    status: order.status,
    expected_date: order.expected_date ?? undefined,
    notes: order.notes ?? undefined,
    total_cents: order.total_cents,
    created_by: order.created_by,
    created_at: order.created_at,
    updated_at: order.updated_at,
    supplier: order.supplier,
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      quantity_ordered: item.quantity_ordered,
      quantity_received: item.quantity_received,
      unit_cost_cents: item.unit_cost_cents,
      total_cents: item.total_cents,
      product: item.product,
      variant: item.variant ?? undefined,
    })),
    receipts: order.receipts
      ? order.receipts.map((r: any) => ({
          id: r.id,
          receipt_number: r.receipt_number ?? undefined,
          notes: r.notes ?? undefined,
          created_at: r.created_at,
          creator: r.creator,
        }))
      : undefined,
  };
}

export const PurchasesRepository = {
  async getAll(status?: string): Promise<PurchaseOrder[]> {
    const orders = await PurchasesService.list(status);
    return orders.map(mapOrder);
  },

  async getById(id: string): Promise<PurchaseOrder> {
    const order = await PurchasesService.get(id);
    return mapOrder(order);
  },

  async create(input: {
    supplierId: string;
    expected_date?: number;
    notes?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity_ordered: number;
      unit_cost_cents: number;
    }>;
  }): Promise<PurchaseOrder> {
    const created = await PurchasesService.create(input);
    return mapOrder(created);
  },

  async update(
    id: string,
    input: {
      supplierId?: string;
      status?: string;
      expected_date?: number;
      notes?: string;
      items?: Array<{
        productId: string;
        variantId?: string;
        quantity_ordered: number;
        unit_cost_cents: number;
      }>;
    },
  ): Promise<PurchaseOrder> {
    const updated = await PurchasesService.update(id, input);
    return mapOrder(updated);
  },

  async remove(id: string): Promise<void> {
    await PurchasesService.remove(id);
  },

  async receive(input: {
    orderId: string;
    receipt_number?: string;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity_received: number;
    }>;
  }): Promise<PurchaseOrder> {
    const result = await PurchasesService.receive(input);
    return mapOrder(result);
  },
};
