import { apiClient } from "./api-client";

export interface ApiContact {
  id: string;
  companyId: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export const ContactsService = {
  async list(type?: string): Promise<ApiContact[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    return apiClient.get<ApiContact[]>(`/contacts${query}`);
  },

  async get(id: string): Promise<ApiContact> {
    return apiClient.get<ApiContact>(`/contacts/${id}`);
  },

  async create(input: {
    type?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    notes?: string;
  }): Promise<ApiContact> {
    return apiClient.post<ApiContact>("/contacts", input);
  },

  async update(
    id: string,
    data: Partial<{
      type: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      tax_id: string;
      notes: string;
      is_active: boolean;
    }>,
  ): Promise<ApiContact> {
    return apiClient.patch<ApiContact>(`/contacts/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/contacts/${id}`);
  },
};
