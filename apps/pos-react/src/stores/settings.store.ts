import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentMethod } from "@/lib/types";

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  enabled: boolean;
  color: string;
  requiresSurcharge?: boolean;
}

interface SettingsState {
  paymentMethods: PaymentMethodConfig[];
  creditSurcharge: number;
  taxRate: number;

  togglePaymentMethod: (id: PaymentMethod) => void;
  updatePaymentMethodLabel: (id: PaymentMethod, label: string) => void;
  setCreditSurcharge: (percent: number) => void;
  setTaxRate: (rate: number) => void;
  reorderPaymentMethods: (fromIndex: number, toIndex: number) => void;
}

const DEFAULT_METHODS: PaymentMethodConfig[] = [
  { id: "CASH", label: "Efectivo", enabled: true, color: "#30a46c" },
  { id: "DEBIT", label: "Débito", enabled: true, color: "#3b82f6" },
  { id: "CREDIT", label: "Crédito", enabled: true, color: "#8b5cf6", requiresSurcharge: true },
  { id: "QR", label: "QR", enabled: true, color: "#f59e0b" },
  { id: "WALLET", label: "Billetera", enabled: false, color: "#ec4899" },
  { id: "TRANSFER", label: "Transferencia", enabled: false, color: "#06b6d4" },
  { id: "POINTS", label: "Puntos", enabled: false, color: "#84cc16" },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      paymentMethods: DEFAULT_METHODS,
      creditSurcharge: 0,
      taxRate: 0.21,

      togglePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) =>
            m.id === id ? { ...m, enabled: !m.enabled } : m
          ),
        })),

      updatePaymentMethodLabel: (id, label) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) =>
            m.id === id ? { ...m, label } : m
          ),
        })),

      setCreditSurcharge: (percent) => set({ creditSurcharge: percent }),
      setTaxRate: (rate) => set({ taxRate: rate }),

      reorderPaymentMethods: (fromIndex, toIndex) =>
        set((state) => {
          const methods = [...state.paymentMethods];
          const [moved] = methods.splice(fromIndex, 1);
          methods.splice(toIndex, 0, moved);
          return { paymentMethods: methods };
        }),
    }),
    {
      name: "arpos-settings",
      partialize: (state) => ({
        paymentMethods: state.paymentMethods,
        creditSurcharge: state.creditSurcharge,
        taxRate: state.taxRate,
      }),
    }
  )
);

export const selectEnabledMethods = (s: SettingsState) =>
  s.paymentMethods.filter((m) => m.enabled);
