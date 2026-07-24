import { apiClient } from "./api-client";

export interface ApiAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface ApiLoginResponse {
  access_token: string;
  user: ApiAuthUser;
}

export const AuthService = {
  async login(email: string, password: string): Promise<ApiLoginResponse> {
    return apiClient.post<ApiLoginResponse>("/auth/login", { email, password });
  },

  async getProfile(): Promise<ApiAuthUser> {
    return apiClient.get<ApiAuthUser>("/auth/me");
  },
};
