import { apiClient } from "./api-client";

export interface ApiProduct {
  id: string;
  companyId: string;
  storeId: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  cost_cents: number | null;
  stock_quantity: number;
  sku: string | null;
  category_id: string | null;
  metadata: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface ApiInventory {
  id: string;
  companyId: string;
  storeId: string;
  productId: string;
  quantity: number;
  min_stock: number;
  max_stock: number | null;
  created_at: number;
  updated_at: number;
}

export interface ApiProductWithInventory extends ApiProduct {
  inventory: ApiInventory[];
}

export const ProductsService = {
  async list(): Promise<ApiProductWithInventory[]> {
    return apiClient.get<ApiProductWithInventory[]>("/products");
  },

  async get(id: string): Promise<ApiProductWithInventory> {
    return apiClient.get<ApiProductWithInventory>(`/products/${id}`);
  },

  async create(input: {
    code: string;
    name: string;
    description?: string;
    price_cents: number;
    cost_cents?: number;
    stock_quantity?: number;
    sku?: string;
    category_id?: string;
  }): Promise<ApiProduct> {
    return apiClient.post<ApiProduct>("/products", input);
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price_cents: number;
      cost_cents: number;
      sku: string;
      category_id: string;
      is_active: boolean;
    }>,
  ): Promise<ApiProduct> {
    return apiClient.patch<ApiProduct>(`/products/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/products/${id}`);
  },
};
