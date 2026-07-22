import { apiClient } from "./api-client";

export interface ApiPaymentSummary {
  payment_method: string;
  total_cents: number;
  count: number;
}

export interface ApiCashRegister {
  id: string;
  companyId: string;
  storeId: string;
  name: string;
  status: string;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: number | null;
  closed_at: number | null;
  created_at: number;
  updated_at: number;
  total_sales_cents?: number;
  payment_summary?: ApiPaymentSummary[];
}

export const CashRegisterService = {
  async list(): Promise<ApiCashRegister[]> {
    return apiClient.get<ApiCashRegister[]>("/cash-registers");
  },

  async getCurrent(): Promise<ApiCashRegister | null> {
    try {
      return await apiClient.get<ApiCashRegister>("/cash-registers/current");
    } catch {
      return null;
    }
  },

  async get(id: string): Promise<ApiCashRegister> {
    return apiClient.get<ApiCashRegister>(`/cash-registers/${id}`);
  },

  async open(input: { name: string; opening_amount: number }): Promise<ApiCashRegister> {
    return apiClient.post<ApiCashRegister>("/cash-registers", input);
  },

  async close(id: string, closing_amount: number): Promise<ApiCashRegister> {
    return apiClient.post<ApiCashRegister>(`/cash-registers/${id}/close`, {
      closing_amount,
    });
  },
};
