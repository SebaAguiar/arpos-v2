import { create } from "zustand";
import { StoresRepository, type Store } from "@/repositories/stores.repository";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY = "stores";

interface StoresState {
  stores: Store[];
  storeCount: number;
  loading: boolean;
  isStale: boolean;
  error: string | null;
  fetchStores: () => Promise<void>;
  createStore: (input: { name: string; address?: string; phone?: string }) => Promise<Store>;
  updateStore: (
    id: string,
    data: Partial<{ name: string; address: string; phone: string; is_active: boolean }>,
  ) => Promise<Store>;
  deleteStore: (id: string) => Promise<void>;
}

interface StoresCache {
  stores: Store[];
  storeCount: number;
}

export const useStoresStore = create<StoresState>((set, get) => ({
  stores: [],
  storeCount: 0,
  loading: false,
  isStale: false,
  error: null,

  fetchStores: async () => {
    set({ loading: true, error: null });
    try {
      const [stores, storeCount] = await Promise.all([
        StoresRepository.getAll(),
        StoresRepository.getCount(),
      ]);
      setCache(CACHE_KEY, { stores, storeCount } satisfies StoresCache);
      set({ stores, storeCount, loading: false, isStale: false });
    } catch {
      const cached = getCached<StoresCache>(CACHE_KEY);
      if (cached) {
        set({
          stores: cached.stores,
          storeCount: cached.storeCount,
          loading: false,
          isStale: true,
        });
      } else {
        set({ loading: false, isStale: false });
      }
    }
  },

  createStore: async (input) => {
    const store = await StoresRepository.create(input);
    const newCount = get().storeCount + 1;
    set({
      stores: [store, ...get().stores],
      storeCount: newCount,
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
    });
  },
}));
