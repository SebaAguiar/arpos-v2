import { apiClient } from "./api-client";

export interface SetupStatusResponse {
  isInitialized: boolean;
}

export interface AccountLink {
  sub: string;
  email: string;
  name: string;
  planSlug: string;
  planName: string;
  maxStores: number;
  features: Record<string, boolean>;
  validFrom: string;
  validUntil: string;
}

export interface InitCompanyInput {
  companyName: string;
  taxId: string;
  adminEmail: string;
  adminPassword: string;
  account?: AccountLink;
}

export interface InitCompanyResponse {
  companyId: string;
  storeId: string;
  userId: string;
  message: string;
}

export const SetupService = {
  async getStatus(): Promise<SetupStatusResponse> {
    return apiClient.get<SetupStatusResponse>("/setup/status");
  },

  async initCompany(input: InitCompanyInput): Promise<InitCompanyResponse> {
    return apiClient.post<InitCompanyResponse>("/setup/init-company", input);
  },
};
