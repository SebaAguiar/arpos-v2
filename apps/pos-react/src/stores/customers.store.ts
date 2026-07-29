import { create } from "zustand";
import { ContactsRepository } from "@/repositories/contacts.repository";
import { getCached, setCache } from "@/lib/cache";
import type { Customer } from "@/lib/types";

const CACHE_KEY = "customers";

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  isStale: boolean;
  search: string;
  sortField: "name" | "email";
  sortDirection: "asc" | "desc";

  fetchCustomers: () => Promise<void>;
  setSearch: (search: string) => void;
  setSort: (field: CustomersState["sortField"]) => void;
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  loading: false,
  isStale: false,
  search: "",
  sortField: "name",
  sortDirection: "asc",

  fetchCustomers: async () => {
    set({ loading: true });
    try {
      const customers = await ContactsRepository.getAll("customer");
      setCache(CACHE_KEY, customers);
      set({ customers, loading: false, isStale: false });
    } catch {
      const cached = getCached<Customer[]>(CACHE_KEY);
      set({ customers: cached ?? [], loading: false, isStale: cached !== null });
    }
  },

  setSearch: (search) => set({ search }),
  setSort: (field) => {
    const { sortField, sortDirection } = get();
    const direction = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    set({ sortField: field, sortDirection: direction });
  },
}));

export const selectFilteredCustomers = (s: CustomersState) => {
  let result = s.customers;

  if (s.search) {
    const q = s.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }

  result = [...result].sort((a, b) => {
    const dir = s.sortDirection === "asc" ? 1 : -1;
    const aVal = (a[s.sortField as "name" | "email"] ?? "").toString().toLowerCase();
    const bVal = (b[s.sortField as "name" | "email"] ?? "").toString().toLowerCase();
    return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
  });

  return result;
};
