import { apiClient } from "./api-client";

export const PurchasesService = {
  async list(status?: string) {
    const params = status ? `?status=${status}` : "";
    return apiClient.get<any[]>(`/purchases${params}`);
  },

  async get(id: string) {
    return apiClient.get<any>(`/purchases/${id}`);
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
    return apiClient.post<any>("/purchases", input);
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
    return apiClient.patch<any>(`/purchases/${id}`, input);
  },

  async remove(id: string) {
    return apiClient.delete(`/purchases/${id}`);
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
    return apiClient.post<any>("/purchases/receive", input);
  },
};
