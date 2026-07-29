import { create } from "zustand";
import { WalletRepository } from "@/repositories/wallet.repository";
import type { WalletTransaction, CreditDebitInput } from "@/lib/types";

interface WalletState {
  balanceCents: number;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;

  fetchBalance: (contactId: string) => Promise<void>;
  fetchTransactions: (contactId: string) => Promise<void>;
  credit: (contactId: string, input: CreditDebitInput) => Promise<void>;
  debit: (contactId: string, input: CreditDebitInput) => Promise<void>;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balanceCents: 0,
  transactions: [],
  loading: false,
  error: null,

  fetchBalance: async (contactId: string) => {
    set({ loading: true, error: null });
    try {
      const balanceCents = await WalletRepository.getBalance(contactId);
      set({ balanceCents, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error fetching balance", loading: false });
    }
  },

  fetchTransactions: async (contactId: string) => {
    set({ loading: true, error: null });
    try {
      const transactions = await WalletRepository.getTransactions(contactId);
      set({ transactions, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error fetching transactions",
        loading: false,
      });
    }
  },

  credit: async (contactId: string, input: CreditDebitInput) => {
    set({ loading: true, error: null });
    try {
      const result = await WalletRepository.credit(contactId, input);
      set((s) => ({
        balanceCents: result.balance_cents,
        transactions: [result.transaction, ...s.transactions],
        loading: false,
      }));
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error crediting wallet",
        loading: false,
      });
      throw e;
    }
  },

  debit: async (contactId: string, input: CreditDebitInput) => {
    set({ loading: true, error: null });
    try {
      const result = await WalletRepository.debit(contactId, input);
      set((s) => ({
        balanceCents: result.balance_cents,
        transactions: [result.transaction, ...s.transactions],
        loading: false,
      }));
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error debiting wallet",
        loading: false,
      });
      throw e;
    }
  },

  reset: () => {
    set({ balanceCents: 0, transactions: [], loading: false, error: null });
  },
}));
