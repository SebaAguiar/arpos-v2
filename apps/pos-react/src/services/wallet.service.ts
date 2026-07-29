import { apiClient } from "./api-client";
import type { CreditDebitInput } from "@/lib/types";

export interface ApiWalletTransaction {
  id: string;
  contactId: string;
  type: string;
  amount_cents: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: number;
}

export interface ApiWalletBalance {
  contactId: string;
  balance_cents: number;
}

export const WalletService = {
  async getBalance(contactId: string): Promise<ApiWalletBalance> {
    return apiClient.get<ApiWalletBalance>(`/wallet/${contactId}`);
  },

  async getTransactions(
    contactId: string,
    limit?: number,
    offset?: number,
  ): Promise<ApiWalletTransaction[]> {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const qs = params.toString();
    return apiClient.get<ApiWalletTransaction[]>(
      `/wallet/${contactId}/transactions${qs ? `?${qs}` : ""}`,
    );
  },

  async credit(contactId: string, input: CreditDebitInput) {
    return apiClient.post<{
      transaction: ApiWalletTransaction;
      balance_cents: number;
    }>(`/wallet/${contactId}/credit`, input);
  },

  async debit(contactId: string, input: CreditDebitInput) {
    return apiClient.post<{
      transaction: ApiWalletTransaction;
      balance_cents: number;
    }>(`/wallet/${contactId}/debit`, input);
  },
};
