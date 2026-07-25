import { apiClient } from "./api-client";

export interface ApiStore {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export const StoresService = {
  async list(): Promise<ApiStore[]> {
    return apiClient.get<ApiStore[]>("/stores");
  },

  async count(): Promise<number> {
    return apiClient.get<number>("/stores/count");
  },

  async get(id: string): Promise<ApiStore> {
    return apiClient.get<ApiStore>(`/stores/${id}`);
  },

  async create(input: {
    name: string;
    address?: string;
    phone?: string;
  }): Promise<ApiStore> {
    return apiClient.post<ApiStore>("/stores", input);
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      phone: string;
      is_active: boolean;
    }>,
  ): Promise<ApiStore> {
    return apiClient.patch<ApiStore>(`/stores/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/stores/${id}`);
  },
};
