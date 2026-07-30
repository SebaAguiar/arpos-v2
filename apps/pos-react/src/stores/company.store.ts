import { create } from "zustand";
import { CompanyRepository } from "@/repositories/company.repository";
import { ApiError } from "@/services/api-client";
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
      let message = "Error al cargar datos de la empresa";
      if (e instanceof ApiError) {
        message = e.message;
      }
      set({ loading: false, error: message });
    }
  },

  updateCompany: async (input: UpdateCompanyInput) => {
    set({ saving: true, error: null });
    try {
      const company = await CompanyRepository.updateCompany(input);
      set({ company, saving: false });
      return true;
    } catch (e) {
      let message = "Error al actualizar datos de la empresa";
      if (e instanceof ApiError) {
        message = e.message;
      }
      set({ saving: false, error: message });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
