import {
  LicenseService,
  type LicenseResponse,
  type LicenseClient,
  type LicensePlan,
  type LicenseSubscription,
} from "../services/license.service";

export interface LicenseData {
  client: LicenseClient;
  plan: LicensePlan;
  subscription: LicenseSubscription;
}

export interface VerifyResult {
  valid: boolean;
  license?: LicenseData;
  error?: string;
}

function mapLicense(response: LicenseResponse): LicenseData | undefined {
  if (!response.valid || !response.client || !response.plan || !response.subscription) {
    return undefined;
  }
  return {
    client: response.client,
    plan: response.plan,
    subscription: response.subscription,
  };
}

export const LicenseRepository = {
  async verify(email: string): Promise<VerifyResult> {
    try {
      const response = await LicenseService.verify(email);
      const license = mapLicense(response);
      return {
        valid: response.valid,
        license,
        error: response.valid ? undefined : "No se encontro una suscripcion activa para este email",
      };
    } catch {
      return {
        valid: false,
        error: "No se pudo verificar la licencia. Intenta de nuevo.",
      };
    }
  },
};
