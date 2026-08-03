import { create } from "zustand";
import { CompanyRepository } from "@/repositories/company.repository";
import type { Company, UpdateCompanyInput } from "@/lib/types";

interface CompanyState {
  company: Company | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchCompany: () => Promise<void>;
  updateCompany: (input: UpdateCompanyInput) => Promise<boolean>;
  clearError: () => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  loading: false,
  saving: false,
  error: null,

  fetchCompany: async () => {
    set({ loading: true, error: null });
    try {
      const company = await CompanyRepository.getCompany();
      set({ company, loading: false });
    } catch (e) {
      console.error("[Company] Failed to load company:", e);
      set({ loading: false, error: "No pudimos cargar los datos de la empresa." });
    }
  },

  updateCompany: async (input: UpdateCompanyInput) => {
    set({ saving: true, error: null });
    try {
      const company = await CompanyRepository.updateCompany(input);
      set({ company, saving: false });
      return true;
    } catch (e) {
      console.error("[Company] Failed to update company:", e);
      set({ saving: false, error: "No pudimos guardar los cambios. Reintentá." });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
