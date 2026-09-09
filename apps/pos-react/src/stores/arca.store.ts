import { create } from "zustand";
import {
  ArcaService,
  type ArcaConfigData,
  type ApiInvoice,
  type EmitInvoiceResult,
  type InvoiceStats,
  type DailyReport,
  type MonthlyReport,
} from "@/services/arca.service";

interface ArcaState {
  config: ArcaConfigData | null;
  invoices: ApiInvoice[];
  isLoadingConfig: boolean;
  isLoadingInvoices: boolean;
  isSaving: boolean;
  isEmitting: string | null;
  isBatchEmitting: boolean;
  isRetrying: boolean;
  lastEmitResult: EmitInvoiceResult | null;
  stats: InvoiceStats | null;
  dailyReport: DailyReport[];
  monthlyReport: MonthlyReport[];
  isLoadingStats: boolean;
  error: string | null;

  fetchConfig: () => Promise<void>;
  saveConfig: (input: {
    cuit: number;
    certificate: string;
    privateKey: string;
    point_of_sale: number;
    environment: string;
    responsabilidad_iva: string;
  }) => Promise<void>;
  deleteConfig: () => Promise<void>;
  fetchInvoices: (filters?: {
    status?: string;
    document_type?: string;
  }) => Promise<void>;
  createInvoice: (saleId: string) => Promise<ApiInvoice>;
  createGlobalDaily: (input?: {
    from?: number;
    to?: number;
    arcaConfigId?: string;
  }) => Promise<ApiInvoice>;
  createCreditNote: (input: {
    invoiceId: string;
    reason: string;
    amountCents?: number;
  }) => Promise<ApiInvoice>;
  createDebitNote: (input: {
    invoiceId: string;
    reason: string;
    amountCents: number;
  }) => Promise<ApiInvoice>;
  emitInvoice: (id: string) => Promise<EmitInvoiceResult>;
  emitBatch: () => Promise<{
    total: number;
    issued: number;
    failed: number;
  }>;
  retryFailed: () => Promise<{ total: number; issued: number; failed: number }>;
  fetchStats: () => Promise<void>;
  fetchDailyReport: (from: number, to: number) => Promise<void>;
  fetchMonthlyReport: (year: number) => Promise<void>;
  clearError: () => void;
}

export const useArcaStore = create<ArcaState>((set, get) => ({
  config: null,
  invoices: [],
  isLoadingConfig: false,
  isLoadingInvoices: false,
  isSaving: false,
  isEmitting: null,
  isBatchEmitting: false,
  isRetrying: false,
  lastEmitResult: null,
  stats: null,
  dailyReport: [],
  monthlyReport: [],
  isLoadingStats: false,
  error: null,

  fetchConfig: async () => {
    set({ isLoadingConfig: true, error: null });
    try {
      const config = await ArcaService.getConfig();
      set({ config, isLoadingConfig: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load ARCA config";
      set({ error: message, isLoadingConfig: false });
    }
  },

  saveConfig: async (input) => {
    set({ isSaving: true, error: null });
    try {
      const config = await ArcaService.saveConfig(input);
      set({ config, isSaving: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save ARCA config";
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  deleteConfig: async () => {
    set({ isSaving: true, error: null });
    try {
      await ArcaService.deleteConfig();
      set({ config: null, isSaving: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete ARCA config";
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  fetchInvoices: async (filters) => {
    set({ isLoadingInvoices: true, error: null });
    try {
      const invoices = await ArcaService.listInvoices(filters);
      set({ invoices, isLoadingInvoices: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load invoices";
      set({ error: message, isLoadingInvoices: false });
    }
  },

  createInvoice: async (saleId) => {
    set({ error: null });
    try {
      const invoice = await ArcaService.createInvoice({ saleId });
      const { invoices } = get();
      set({ invoices: [invoice, ...invoices] });
      return invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create invoice";
      set({ error: message });
      throw error;
    }
  },

  createGlobalDaily: async (input) => {
    set({ error: null });
    try {
      const invoice = await ArcaService.createGlobalDaily(input);
      const { invoices } = get();
      set({ invoices: [invoice, ...invoices] });
      return invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create daily global invoice";
      set({ error: message });
      throw error;
    }
  },

  emitInvoice: async (id) => {
    set({ isEmitting: id, error: null, lastEmitResult: null });
    try {
      const result = await ArcaService.emitInvoice(id);
      set({ lastEmitResult: result, isEmitting: null });

      if (result.success) {
        const { invoices } = get();
        set({
          invoices: invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  status: "issued",
                  cae: result.cae ?? inv.cae,
                  cae_expiration: result.caeExpiration ?? inv.cae_expiration,
                }
              : inv
          ),
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to emit invoice";
      set({ error: message, isEmitting: null });
      throw error;
    }
  },

  emitBatch: async () => {
    set({ isBatchEmitting: true, error: null });
    try {
      const result = await ArcaService.emitBatch();
      set({ isBatchEmitting: false });
      await get().fetchInvoices({ status: "pending" });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to emit batch";
      set({ error: message, isBatchEmitting: false });
      throw error;
    }
  },

  retryFailed: async () => {
    set({ isRetrying: true, error: null });
    try {
      const result = await ArcaService.retryFailed();
      set({ isRetrying: false });
      await get().fetchInvoices({ status: "pending" });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retry failed invoices";
      set({ error: message, isRetrying: false });
      throw error;
    }
  },

  createCreditNote: async (input) => {
    set({ error: null });
    try {
      const invoice = await ArcaService.createCreditNote(input);
      const { invoices } = get();
      set({ invoices: [invoice, ...invoices] });
      return invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create credit note";
      set({ error: message });
      throw error;
    }
  },

  createDebitNote: async (input) => {
    set({ error: null });
    try {
      const invoice = await ArcaService.createDebitNote(input);
      const { invoices } = get();
      set({ invoices: [invoice, ...invoices] });
      return invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create debit note";
      set({ error: message });
      throw error;
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      const stats = await ArcaService.getStats();
      set({ stats, isLoadingStats: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load stats";
      set({ error: message, isLoadingStats: false });
    }
  },

  fetchDailyReport: async (from, to) => {
    set({ error: null });
    try {
      const dailyReport = await ArcaService.getDailyReport(from, to);
      set({ dailyReport });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load daily report";
      set({ error: message });
    }
  },

  fetchMonthlyReport: async (year) => {
    set({ error: null });
    try {
      const monthlyReport = await ArcaService.getMonthlyReport(year);
      set({ monthlyReport });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load monthly report";
      set({ error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
