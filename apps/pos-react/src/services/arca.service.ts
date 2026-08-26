import { apiClient } from "./api-client";

export interface ArcaConfigData {
  id: string;
  cuit: number;
  point_of_sale: number;
  environment: string;
  responsabilidad_iva: string;
  active: boolean;
  created_at: number;
  updated_at: number;
}

export interface SaveArcaConfigInput {
  cuit: number;
  certificate: string;
  privateKey: string;
  point_of_sale: number;
  environment: string;
  responsabilidad_iva: string;
}

export interface ApiInvoice {
  id: string;
  companyId: string;
  saleId: string;
  arcaConfigId: string | null;
  type: string;
  document_type: string;
  number: string | null;
  point_of_sale: number | null;
  status: string;
  customer_name: string;
  customer_tax_id: string;
  customer_address: string | null;
  customer_email: string | null;
  total_cents: number;
  net_amount_cents: number;
  tax_amount_cents: number;
  cae: string | null;
  cae_expiration: string | null;
  qr_data: string | null;
  arca_response: string | null;
  error_message: string | null;
  retry_count: number;
  issued_at: number | null;
  created_at: number;
  sale?: {
    id: string;
    ticket_number: number;
    total_cents: number;
    payment_method: string;
    created_at: number;
  };
  arcaConfig?: {
    id: string;
    cuit: number;
    point_of_sale: number;
    environment: string;
  };
}

export interface EmitInvoiceResult {
  invoiceId: string;
  success: boolean;
  cae?: string;
  caeExpiration?: string;
  error?: string;
  isBusinessError?: boolean;
}

export interface EmitBatchResult {
  total: number;
  issued: number;
  failed: number;
  results: EmitInvoiceResult[];
}

export interface InvoiceStats {
  total: number;
  issued: number;
  pending: number;
  error: number;
  totalAmountCents: number;
  issuedAmountCents: number;
}

export interface DailyReport {
  date: string;
  count: number;
  totalCents: number;
}

export interface MonthlyReport {
  month: string;
  count: number;
  totalCents: number;
}

export interface CreateCreditNoteInput {
  invoiceId: string;
  reason: string;
  amountCents?: number;
}

export interface CreateDebitNoteInput {
  invoiceId: string;
  reason: string;
  amountCents: number;
}

export interface RetryFailedResult {
  total: number;
  issued: number;
  failed: number;
}

export const ArcaService = {
  async getConfig(): Promise<ArcaConfigData | null> {
    return apiClient.get<ArcaConfigData | null>("/arca/config");
  },

  async saveConfig(input: SaveArcaConfigInput): Promise<ArcaConfigData> {
    return apiClient.post<ArcaConfigData>("/arca/config", input);
  },

  async deleteConfig(): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>("/arca/config");
  },

  async listInvoices(filters?: {
    status?: string;
    document_type?: string;
    from?: number;
    to?: number;
  }): Promise<ApiInvoice[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.document_type) params.set("document_type", filters.document_type);
    if (filters?.from) params.set("from", String(filters.from));
    if (filters?.to) params.set("to", String(filters.to));
    const query = params.toString();
    return apiClient.get<ApiInvoice[]>(`/invoices${query ? `?${query}` : ""}`);
  },

  async getInvoice(id: string): Promise<ApiInvoice> {
    return apiClient.get<ApiInvoice>(`/invoices/${id}`);
  },

  async createInvoice(input: {
    saleId: string;
    arcaConfigId?: string;
  }): Promise<ApiInvoice> {
    return apiClient.post<ApiInvoice>("/invoices", input);
  },

  async createCreditNote(input: CreateCreditNoteInput): Promise<ApiInvoice> {
    return apiClient.post<ApiInvoice>("/invoices/credit-note", input);
  },

  async createDebitNote(input: CreateDebitNoteInput): Promise<ApiInvoice> {
    return apiClient.post<ApiInvoice>("/invoices/debit-note", input);
  },

  async emitInvoice(id: string): Promise<EmitInvoiceResult> {
    return apiClient.post<EmitInvoiceResult>(`/invoices/${id}/emit`);
  },

  async emitBatch(): Promise<EmitBatchResult> {
    return apiClient.post<EmitBatchResult>("/invoices/emit-batch");
  },

  async retryFailed(): Promise<RetryFailedResult> {
    return apiClient.post<RetryFailedResult>("/invoices/retry-failed");
  },

  async getStats(): Promise<InvoiceStats> {
    return apiClient.get<InvoiceStats>("/invoices/stats");
  },

  async getDailyReport(from: number, to: number): Promise<DailyReport[]> {
    const params = new URLSearchParams({ from: String(from), to: String(to) });
    return apiClient.get<DailyReport[]>(`/invoices/reports/daily?${params}`);
  },

  async getMonthlyReport(year: number): Promise<MonthlyReport[]> {
    const params = new URLSearchParams({ year: String(year) });
    return apiClient.get<MonthlyReport[]>(`/invoices/reports/monthly?${params}`);
  },

  async getServerStatus(): Promise<unknown> {
    return apiClient.get<unknown>("/arca/server-status");
  },

  async getSalesPoints(): Promise<unknown> {
    return apiClient.get<unknown>("/arca/sales-points");
  },

  async getVoucherTypes(): Promise<unknown> {
    return apiClient.get<unknown>("/arca/voucher-types");
  },
};
