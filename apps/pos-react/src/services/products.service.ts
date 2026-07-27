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
  variantId: string | null;
  quantity: number;
  min_stock: number;
  max_stock: number | null;
  created_at: number;
  updated_at: number;
}

export interface ApiProductVariant {
  id: string;
  companyId: string;
  productId: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  sku: string | null;
  price_cents: number;
  cost_cents: number | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  inventory: ApiInventory[];
}

export interface ApiProductWithInventory extends ApiProduct {
  inventory: ApiInventory[];
  variants: ApiProductVariant[];
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

export const VariantsService = {
  async listByProduct(productId: string): Promise<ApiProductVariant[]> {
    return apiClient.get<ApiProductVariant[]>(`/variants?productId=${productId}`);
  },

  async create(input: {
    productId: string;
    size?: string;
    color?: string;
    barcode?: string;
    sku?: string;
    price_cents?: number;
    cost_cents?: number;
  }): Promise<ApiProductVariant> {
    return apiClient.post<ApiProductVariant>("/variants", input);
  },

  async update(
    id: string,
    data: Partial<{
      size: string;
      color: string;
      barcode: string;
      sku: string;
      price_cents: number;
      cost_cents: number;
      is_active: boolean;
    }>,
  ): Promise<ApiProductVariant> {
    return apiClient.patch<ApiProductVariant>(`/variants/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/variants/${id}`);
  },
};
