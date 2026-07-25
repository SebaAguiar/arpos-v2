import { create } from "zustand";
import {
  InventoryRepository,
  type StockItemData,
  type InventoryMovementData,
} from "@/repositories/inventory.repository";
import { ApiError } from "@/services/api-client";

interface InventoryState {
  stock: StockItemData[];
  movements: InventoryMovementData[];
  loading: boolean;
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
  error: null,

  fetchStock: async () => {
    set({ loading: true, error: null });
    try {
      const stock = await InventoryRepository.getStock();
      set({ stock, loading: false });
    } catch (err) {
      let message = "Error al cargar stock";
      if (err instanceof ApiError) {
        try {
          const body = JSON.parse(err.message);
          message = body.message ?? message;
        } catch {
          message = err.message || message;
        }
      }
      set({ loading: false, error: message });
    }
  },

  fetchMovements: async (filters) => {
    set({ loading: true, error: null });
    try {
      const movements = await InventoryRepository.getMovements(filters);
      set({ movements, loading: false });
    } catch (err) {
      let message = "Error al cargar movimientos";
      if (err instanceof ApiError) {
        try {
          const body = JSON.parse(err.message);
          message = body.message ?? message;
        } catch {
          message = err.message || message;
        }
      }
      set({ loading: false, error: message });
    }
  },

  createMovement: async (input) => {
    set({ loading: true, error: null });
    try {
      await InventoryRepository.createMovement(input);
      const stock = await InventoryRepository.getStock();
      set({ stock, loading: false });
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
