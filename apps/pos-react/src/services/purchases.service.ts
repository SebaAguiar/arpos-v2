import { apiClient } from "./api-client";
import type { PurchaseOrder } from "@/lib/types";

export const PurchasesService = {
  async list(status?: string): Promise<PurchaseOrder[]> {
    const params = status ? `?status=${status}` : "";
    return apiClient.get<PurchaseOrder[]>(`/purchases${params}`);
  },

  async get(id: string): Promise<PurchaseOrder> {
    return apiClient.get<PurchaseOrder>(`/purchases/${id}`);
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
  }) {
    return apiClient.post<PurchaseOrder>("/purchases", input);
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
  ) {
    return apiClient.patch<PurchaseOrder>(`/purchases/${id}`, input);
  },

  async remove(id: string): Promise<unknown> {
    return apiClient.delete<unknown>(`/purchases/${id}`);
  },

  async receive(input: {
    orderId: string;
    receipt_number?: string;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity_received: number;
    }>;
  }) {
    return apiClient.post<PurchaseOrder>("/purchases/receive", input);
  },
};
