import { create } from "zustand";
import { CashRegisterRepository } from "@/repositories/cash-register.repository";

export interface CashMovement {
  id: string;
  type: "INCOME" | "EXPENSE" | "WALLET_TRANSFER";
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
}

interface CashRegisterState {
  currentShift: CashShift | null;
  shifts: CashShift[];
  loading: boolean;

  fetchCurrentShift: () => Promise<void>;
  openShift: (name: string, initialAmount: number) => Promise<void>;
  closeShift: (finalAmount: number) => Promise<void>;
  addMovement: (type: CashMovement["type"], amount: number, description: string) => void;
  addSale: (amount: number) => void;
}

let nextMovementId = 1;

export const useCashRegisterStore = create<CashRegisterState>((set) => ({
  currentShift: null,
  shifts: [],
  loading: false,

  fetchCurrentShift: async () => {
    set({ loading: true });
    try {
      const register = await CashRegisterRepository.getCurrent();
      if (register && register.status === "OPEN") {
        set({
          currentShift: {
            id: register.id,
            initialAmount: register.openingAmount,
            finalAmount: register.closingAmount,
            status: "OPEN",
            startTime: register.openedAt ?? Math.floor(Date.now() / 1000),
            endTime: register.closedAt,
            movements: [],
            totalSales: 0,
            totalIncome: 0,
            totalExpenses: 0,
          },
          loading: false,
        });
      } else {
        set({ currentShift: null, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  openShift: async (name, initialAmount) => {
    set({ loading: true });
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
        },
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  closeShift: async (finalAmount) => {
    const state = useCashRegisterStore.getState();
    if (!state.currentShift) return;
    set({ loading: true });
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
    } catch {
      set({ loading: false });
    }
  },

  addMovement: (type, amount, description) =>
    set((state) => {
      if (!state.currentShift) return state;
      const movement: CashMovement = {
        id: `mov-${nextMovementId++}`,
        type,
        amount,
        description,
        createdAt: Math.floor(Date.now() / 1000),
      };
      return {
        currentShift: {
          ...state.currentShift,
          movements: [...state.currentShift.movements, movement],
          totalIncome:
            type === "INCOME"
              ? state.currentShift.totalIncome + amount
              : state.currentShift.totalIncome,
          totalExpenses:
            type === "EXPENSE"
              ? state.currentShift.totalExpenses + amount
              : state.currentShift.totalExpenses,
        },
      };
    }),

  addSale: (amount) =>
    set((state) => {
      if (!state.currentShift) return state;
      return {
        currentShift: {
          ...state.currentShift,
          totalSales: state.currentShift.totalSales + amount,
        },
      };
    }),
}));

export const selectShiftSummary = (s: CashRegisterState) => {
  if (!s.currentShift) return null;
  const shift = s.currentShift;
  const expectedCash =
    shift.initialAmount + shift.totalSales + shift.totalIncome - shift.totalExpenses;
  return {
    ...shift,
    expectedCash,
    difference:
      shift.finalAmount !== null ? shift.finalAmount - expectedCash : null,
  };
};
