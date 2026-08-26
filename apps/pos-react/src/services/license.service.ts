import { cloudClient } from "./cloud-client";

export interface LicensePlan {
  name: string;
  slug: string;
  features: Record<string, boolean>;
  maxStores: number;
}

export interface LicenseSubscription {
  id: string;
  status: string;
  renewalDate: string | null;
  startDate: string;
}

export interface LicenseClient {
  id: string;
  name: string;
  email: string;
}

export interface LicenseResponse {
  valid: boolean;
  client?: LicenseClient;
  plan?: LicensePlan;
  subscription?: LicenseSubscription;
  error?: string;
}

export const LicenseService = {
  async verify(email: string): Promise<LicenseResponse> {
    return cloudClient.post<LicenseResponse>("/api/license/verify", { email });
  },
};
