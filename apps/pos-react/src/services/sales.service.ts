import { apiClient } from "./api-client";

export interface ApiSaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  discount_cents: number;
  product?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ApiSale {
  id: string;
  companyId: string;
  storeId: string;
  cash_register_id: string | null;
  user_id: string;
  contact_id: string | null;
  ticket_number: number;
  total_cents: number;
  discount_cents: number;
  tax_cents: number;
  status: string;
  payment_method: string;
  payment_details: string | null;
  notes: string | null;
  synced_at: number | null;
  created_at: number;
  updated_at: number;
  items?: ApiSaleItem[];
  user?: { id: string; name: string; email: string };
}

export interface ApiSaleStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
}

export interface ApiPaymentMethodBreakdown {
  payment_method: string;
  total_cents: number;
  count: number;
}

export interface ApiTopProduct {
  productId: string;
  productName: string;
  productCode: string;
  total_cents: number;
  quantity: number;
}

export const SalesService = {
  async list(filters?: {
    from?: number;
    to?: number;
    status?: string;
  }): Promise<ApiSale[]> {
    const params = new URLSearchParams();
    if (filters?.from) params.set("from", String(filters.from));
    if (filters?.to) params.set("to", String(filters.to));
    if (filters?.status) params.set("status", filters.status);
    const query = params.toString();
    return apiClient.get<ApiSale[]>(`/sales${query ? `?${query}` : ""}`);
  },

  async getStats(filters?: {
    from?: number;
    to?: number;
  }): Promise<ApiSaleStats> {
    const params = new URLSearchParams();
    if (filters?.from) params.set("from", String(filters.from));
    if (filters?.to) params.set("to", String(filters.to));
    const query = params.toString();
    return apiClient.get<ApiSaleStats>(`/sales/stats${query ? `?${query}` : ""}`);
  },

  async getByPaymentMethod(filters?: {
    from?: number;
    to?: number;
  }): Promise<ApiPaymentMethodBreakdown[]> {
    const params = new URLSearchParams();
    if (filters?.from) params.set("from", String(filters.from));
    if (filters?.to) params.set("to", String(filters.to));
    const query = params.toString();
    return apiClient.get<ApiPaymentMethodBreakdown[]>(`/sales/by-payment-method${query ? `?${query}` : ""}`);
  },

  async get(id: string): Promise<ApiSale> {
    return apiClient.get<ApiSale>(`/sales/${id}`);
  },

  async getTopProducts(filters?: {
    from?: number;
    to?: number;
    limit?: number;
  }): Promise<ApiTopProduct[]> {
    const params = new URLSearchParams();
    if (filters?.from) params.set("from", String(filters.from));
    if (filters?.to) params.set("to", String(filters.to));
    if (filters?.limit) params.set("limit", String(filters.limit));
    const query = params.toString();
    return apiClient.get<ApiTopProduct[]>(`/sales/top-products${query ? `?${query}` : ""}`);
  },

  async create(input: {
    items: Array<{
      productId: string;
      quantity: number;
      unit_price_cents: number;
    }>;
    total_cents: number;
    discount_cents?: number;
    tax_cents?: number;
    payment_method: string;
    payment_details?: string;
    contact_id?: string;
    notes?: string;
    cash_register_id?: string;
  }): Promise<ApiSale> {
    return apiClient.post<ApiSale>("/sales", input);
  },
};
