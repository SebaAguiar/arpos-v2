import { apiClient } from "./api-client";

export interface ApiStockItem {
  productId: string;
  productCode: string;
  productName: string;
  stock_quantity: number;
  cost_cents: number | null;
}

export interface ApiInventoryMovement {
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

export const InventoryService = {
  async getStock(): Promise<ApiStockItem[]> {
    return apiClient.get<ApiStockItem[]>("/inventory");
  },

  async getMovements(filters?: {
    productId?: string;
    type?: string;
    from?: number;
    to?: number;
  }): Promise<ApiInventoryMovement[]> {
    const params = new URLSearchParams();
    if (filters?.productId) params.set("productId", filters.productId);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.from) params.set("from", String(filters.from));
    if (filters?.to) params.set("to", String(filters.to));
    const qs = params.toString();
    return apiClient.get<ApiInventoryMovement[]>(`/inventory/movements${qs ? `?${qs}` : ""}`);
  },

  async createMovement(input: {
    productId: string;
    type: string;
    quantity: number;
    reason: string;
  }): Promise<void> {
    return apiClient.post<void>("/inventory/movements", input);
  },
};
