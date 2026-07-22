import { create } from "zustand";

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
  openShift: (initialAmount: number) => void;
  closeShift: (finalAmount: number) => void;
  addMovement: (type: CashMovement["type"], amount: number, description: string) => void;
  addSale: (amount: number) => void;
}

let nextShiftId = 1;
let nextMovementId = 1;

export const useCashRegisterStore = create<CashRegisterState>((set) => ({
  currentShift: null,
  shifts: [],

  openShift: (initialAmount) =>
    set({
      currentShift: {
        id: `shift-${nextShiftId++}`,
        initialAmount,
        finalAmount: null,
        status: "OPEN",
        startTime: Math.floor(Date.now() / 1000),
        endTime: null,
        movements: [],
        totalSales: 0,
        totalIncome: 0,
        totalExpenses: 0,
      },
    }),

  closeShift: (finalAmount) =>
    set((state) => {
      if (!state.currentShift) return state;
      const closed = {
        ...state.currentShift,
        finalAmount,
        status: "CLOSED" as const,
        endTime: Math.floor(Date.now() / 1000),
      };
      return {
        currentShift: null,
        shifts: [closed, ...state.shifts],
      };
    }),

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
