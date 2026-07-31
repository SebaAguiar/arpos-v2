import { create } from "zustand";
import { PurchasesRepository } from "@/repositories/purchases.repository";
import type { PurchaseOrder } from "@/lib/types";

interface PurchasesState {
  orders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  search: string;
  isStale: boolean;

  fetchOrders: (status?: string) => Promise<void>;
  setSearch: (search: string) => void;
  clearError: () => void;
}

export const usePurchasesStore = create<PurchasesState>((set) => ({
  orders: [],
  loading: false,
  error: null,
  search: "",
  isStale: false,

  fetchOrders: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const orders = await PurchasesRepository.getAll(status);
      set({ orders, loading: false, isStale: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error loading orders", loading: false });
    }
  },

  setSearch: (search) => set({ search }),
  clearError: () => set({ error: null }),
}));
