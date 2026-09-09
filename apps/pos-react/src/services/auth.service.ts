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

  // License bridge: the POS no longer signs in with credentials. It presents
  // the EdDSA license token and the local API mints the auth_token session.
  async loginWithLicense(licenseToken: string): Promise<ApiLoginResponse> {
    return apiClient.post<ApiLoginResponse>("/auth/license", { licenseToken });
  },

  // Offline-first local session (free plan): resolve the device identity
  // against the local sidecar without any dependency on the license panel.
  async loginLocal(email?: string, name?: string): Promise<ApiLoginResponse> {
    return apiClient.post<ApiLoginResponse>("/auth/local", {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    });
  },

  async getProfile(): Promise<ApiAuthUser> {
    return apiClient.get<ApiAuthUser>("/auth/me");
  },
};
