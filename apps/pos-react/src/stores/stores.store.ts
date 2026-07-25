import { create } from "zustand";
import { StoresRepository, type Store } from "@/repositories/stores.repository";

interface StoresState {
  stores: Store[];
  storeCount: number;
  loading: boolean;
  error: string | null;
  canAddStore: boolean;
  fetchStores: () => Promise<void>;
  createStore: (input: { name: string; address?: string; phone?: string }) => Promise<Store>;
  updateStore: (
    id: string,
    data: Partial<{ name: string; address: string; phone: string; is_active: boolean }>,
  ) => Promise<Store>;
  deleteStore: (id: string) => Promise<void>;
}

export const useStoresStore = create<StoresState>((set, get) => ({
  stores: [],
  storeCount: 0,
  loading: false,
  error: null,
  canAddStore: true,

  fetchStores: async () => {
    set({ loading: true, error: null });
    try {
      const [stores, storeCount] = await Promise.all([
        StoresRepository.getAll(),
        StoresRepository.getCount(),
      ]);
      set({ stores, storeCount, canAddStore: storeCount < 1, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading stores";
      set({ error: message, loading: false });
    }
  },

  createStore: async (input) => {
    const store = await StoresRepository.create(input);
    const newCount = get().storeCount + 1;
    set({
      stores: [store, ...get().stores],
      storeCount: newCount,
      canAddStore: newCount < 1,
    });
    return store;
  },

  updateStore: async (id, data) => {
    const updated = await StoresRepository.update(id, data);
    set({
      stores: get().stores.map((s) => (s.id === id ? updated : s)),
    });
    return updated;
  },

  deleteStore: async (id) => {
    await StoresRepository.remove(id);
    const newCount = get().storeCount - 1;
    set({
      stores: get().stores.map((s) =>
        s.id === id ? { ...s, is_active: false } : s,
      ),
      storeCount: newCount,
      canAddStore: newCount < 1,
    });
  },
}));
