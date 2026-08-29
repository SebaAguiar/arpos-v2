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

export interface LicenseIssueResponse {
  valid: boolean;
  token: string;
  license: {
    sub: string;
    email: string;
    name: string;
    planSlug: string;
    planName: string;
    maxStores: number;
    features: Record<string, boolean>;
    validFrom: string;
    validUntil: string;
  };
}

export const LicenseService = {
  async verify(email: string): Promise<LicenseResponse> {
    return cloudClient.post<LicenseResponse>("/api/license/verify", { email });
  },

  async issue(email: string): Promise<LicenseIssueResponse> {
    return cloudClient.post<LicenseIssueResponse>("/api/license/issue", { email });
  },
};
