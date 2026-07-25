import { apiClient } from "./api-client";

export interface ApiUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export const UsersService = {
  async list(filters?: { role?: string; is_active?: boolean }): Promise<ApiUser[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set("role", filters.role);
    if (filters?.is_active !== undefined) params.set("is_active", String(filters.is_active));
    const query = params.toString();
    return apiClient.get<ApiUser[]>(`/users${query ? `?${query}` : ""}`);
  },

  async get(id: string): Promise<ApiUser> {
    return apiClient.get<ApiUser>(`/users/${id}`);
  },

  async create(input: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<ApiUser> {
    return apiClient.post<ApiUser>("/users", input);
  },

  async update(
    id: string,
    data: Partial<{
      email: string;
      password: string;
      name: string;
      role: string;
      is_active: boolean;
    }>,
  ): Promise<ApiUser> {
    return apiClient.patch<ApiUser>(`/users/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
};
