import { create } from "zustand";
import {
  InventoryRepository,
  type StockItemData,
  type InventoryMovementData,
} from "@/repositories/inventory.repository";
import { getCached, setCache } from "@/lib/cache";
import { ApiError } from "@/services/api-client";

const CACHE_KEY_STOCK = "stock";
const CACHE_KEY_MOVEMENTS = "movements";

interface InventoryState {
  stock: StockItemData[];
  movements: InventoryMovementData[];
  loading: boolean;
  isStale: boolean;
  error: string | null;

  fetchStock: () => Promise<void>;
  fetchMovements: (filters?: {
    productId?: string;
    type?: string;
    from?: number;
    to?: number;
  }) => Promise<void>;
  createMovement: (input: {
    productId: string;
    type: string;
    quantity: number;
    reason: string;
  }) => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stock: [],
  movements: [],
  loading: false,
  isStale: false,
  error: null,

  fetchStock: async () => {
    set({ loading: true, error: null });
    try {
      const stock = await InventoryRepository.getStock();
      setCache(CACHE_KEY_STOCK, stock);
      set({ stock, loading: false, isStale: false });
    } catch {
      const cached = getCached<StockItemData[]>(CACHE_KEY_STOCK);
      set({
        stock: cached ?? [],
        loading: false,
        isStale: cached !== null,
      });
    }
  },

  fetchMovements: async (filters) => {
    set({ loading: true, error: null });
    try {
      const movements = await InventoryRepository.getMovements(filters);
      setCache(CACHE_KEY_MOVEMENTS, movements);
      set({ movements, loading: false, isStale: false });
    } catch {
      const cached = getCached<InventoryMovementData[]>(CACHE_KEY_MOVEMENTS);
      set({
        movements: cached ?? [],
        loading: false,
        isStale: cached !== null,
      });
    }
  },

  createMovement: async (input) => {
    set({ loading: true, error: null });
    try {
      await InventoryRepository.createMovement(input);
      const stock = await InventoryRepository.getStock();
      setCache(CACHE_KEY_STOCK, stock);
      set({ stock, loading: false, isStale: false });
    } catch (err) {
      let message = "Error al registrar movimiento";
      if (err instanceof ApiError) {
        try {
          const body = JSON.parse(err.message);
          message = body.message ?? message;
        } catch {
          message = err.message || message;
        }
      }
      set({ loading: false, error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
