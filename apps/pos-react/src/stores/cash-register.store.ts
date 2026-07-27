import { create } from "zustand";
import {
  CashRegisterRepository,
  type PaymentMethodSummary,
  type CashMovementData,
} from "@/repositories/cash-register.repository";
import { getCached, setCache } from "@/lib/cache";
import { ApiError } from "@/services/api-client";

export interface CashMovement {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  createdAt: number;
}

export interface CashShift {
  id: string;
  initialAmount: number;
  finalAmount: number | null;
  status: "OPEN" | "CLOSED";
  startTime: number;
  endTime: number | null;
  movements: CashMovement[];
  totalSales: number;
  totalIncome: number;
  totalExpenses: number;
  movementCount: number;
  paymentSummary: PaymentMethodSummary[];
}

const CACHE_KEY_SHIFT = "cashShift";
const CACHE_KEY_HISTORY = "cashHistory";

interface CashRegisterState {
  currentShift: CashShift | null;
  shifts: CashShift[];
  loading: boolean;
  isStale: boolean;
  error: string | null;

  fetchCurrentShift: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  openShift: (name: string, initialAmount: number) => Promise<void>;
  closeShift: (finalAmount: number) => Promise<void>;
  addMovement: (type: CashMovement["type"], amount: number, description: string) => Promise<void>;
  clearError: () => void;
}

function mapMovement(m: CashMovementData): CashMovement {
  return {
    id: m.id,
    type: m.type === "income" ? "INCOME" : "EXPENSE",
    amount: m.amountCents / 100,
    description: m.description,
    createdAt: m.createdAt,
  };
}

export const useCashRegisterStore = create<CashRegisterState>((set, get) => ({
  currentShift: null,
  shifts: [],
  loading: false,
  isStale: false,
  error: null,

  fetchCurrentShift: async () => {
    set({ loading: true });
    try {
      const register = await CashRegisterRepository.getCurrent();
      if (register && register.status === "OPEN") {
        const movementsData = await CashRegisterRepository.getMovements(register.id);
        const movements = movementsData.map(mapMovement);

        const shift: CashShift = {
          id: register.id,
          initialAmount: register.openingAmount,
          finalAmount: register.closingAmount,
          status: "OPEN",
          startTime: register.openedAt ?? Math.floor(Date.now() / 1000),
          endTime: register.closedAt,
          movements,
          totalSales: register.totalSalesCents / 100,
          totalIncome: register.incomeCents / 100,
          totalExpenses: register.expenseCents / 100,
          movementCount: register.movementCount,
          paymentSummary: register.paymentSummary,
        };
        setCache(CACHE_KEY_SHIFT, shift);
        set({ currentShift: shift, loading: false, isStale: false });
      } else {
        set({ currentShift: null, loading: false, isStale: false });
      }
    } catch {
      const cached = getCached<CashShift>(CACHE_KEY_SHIFT);
      set({
        currentShift: cached ?? null,
        loading: false,
        isStale: cached !== null,
      });
    }
  },

  fetchHistory: async () => {
    try {
      const registers = await CashRegisterRepository.getAll();
      const closedShifts: CashShift[] = registers
        .filter((r) => r.status === "CLOSED")
        .map((r) => ({
          id: r.id,
          initialAmount: r.openingAmount,
          finalAmount: r.closingAmount,
          status: "CLOSED" as const,
          startTime: r.openedAt ?? 0,
          endTime: r.closedAt,
          movements: [],
          totalSales: r.totalSalesCents / 100,
          totalIncome: r.incomeCents / 100,
          totalExpenses: r.expenseCents / 100,
          movementCount: r.movementCount,
          paymentSummary: r.paymentSummary,
        }));
      setCache(CACHE_KEY_HISTORY, closedShifts);
      set({ shifts: closedShifts, isStale: false });
    } catch {
      const cached = getCached<CashShift[]>(CACHE_KEY_HISTORY);
      set({
        shifts: cached ?? [],
        isStale: cached !== null,
      });
    }
  },

  openShift: async (name, initialAmount) => {
    set({ loading: true, error: null });
    try {
      const register = await CashRegisterRepository.open(name, initialAmount);
      set({
        currentShift: {
          id: register.id,
          initialAmount: register.openingAmount,
          finalAmount: null,
          status: "OPEN",
          startTime: register.openedAt ?? Math.floor(Date.now() / 1000),
          endTime: null,
          movements: [],
          totalSales: 0,
          totalIncome: 0,
          totalExpenses: 0,
          movementCount: 0,
          paymentSummary: [],
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      let message = "Error al abrir turno";
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

  closeShift: async (finalAmount) => {
    const state = get();
    if (!state.currentShift) return;
    set({ loading: true, error: null });
    try {
      await CashRegisterRepository.close(state.currentShift.id, finalAmount);
      const closed = {
        ...state.currentShift,
        finalAmount,
        status: "CLOSED" as const,
        endTime: Math.floor(Date.now() / 1000),
      };
      set({
        currentShift: null,
        shifts: [closed, ...state.shifts],
        loading: false,
      });
    } catch (err) {
      let message = "Error al cerrar turno";
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

  addMovement: async (type, amount, description) => {
    const state = get();
    if (!state.currentShift) return;
    set({ loading: true, error: null });
    try {
      const created = await CashRegisterRepository.createMovement(
        state.currentShift.id,
        type === "INCOME" ? "income" : "expense",
        amount,
        description,
      );
      const movement = mapMovement(created);
      set({
        currentShift: {
          ...state.currentShift,
          movements: [...state.currentShift.movements, movement],
          movementCount: state.currentShift.movementCount + 1,
          totalIncome:
            type === "INCOME"
              ? state.currentShift.totalIncome + amount
              : state.currentShift.totalIncome,
          totalExpenses:
            type === "EXPENSE"
              ? state.currentShift.totalExpenses + amount
              : state.currentShift.totalExpenses,
        },
        loading: false,
      });
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
    }
  },

  clearError: () => set({ error: null }),
}));
