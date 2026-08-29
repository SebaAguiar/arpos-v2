import {
  LicenseService,
  type LicenseResponse,
  type LicenseClient,
  type LicensePlan,
  type LicenseSubscription,
} from "../services/license.service";
import { CloudApiError } from "../services/cloud-client";
import {
  verifyLicenseToken,
  getLicenseStatus,
  readTokenLocal,
  writeTokenLocal,
  clearTokenLocal,
  type LicensePayload,
  type LicenseStatus,
} from "../lib/license";

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

export type LicenseLoadResult =
  | { ok: true; status: LicenseStatus; payload: LicensePayload | null }
  | { ok: false; error: string };

// Distinguish a hard identity error (email has no account/subscription) from a
// transient network failure that should degrade to the local cache.
export interface IssueOutcome {
  known: boolean;
  result: LicenseLoadResult;
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
  // Kept for backward compatibility with the legacy online-only check.
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

  // Read the locally cached signed token and evaluate it offline (no network).
  async loadLocal(): Promise<LicenseLoadResult> {
    const token = await readTokenLocal();
    if (!token) {
      return { ok: true, status: { status: "invalid", payload: null, daysLeft: 0 }, payload: null };
    }
    const payload = await verifyLicenseToken(token);
    const status = getLicenseStatus(payload);
    return { ok: true, status, payload };
  },

  // Fetch a fresh signed license token from the admin (network), verify it
  // offline, persist it locally, and return the license status.
  async issueAndStore(email: string): Promise<IssueOutcome> {
    try {
      const response = await LicenseService.issue(email);
      const payload = await verifyLicenseToken(response.token);
      if (!response.valid || !response.token || !payload) {
        return { known: false, result: { ok: false, error: "No se pudo emitir la licencia para este email" } };
      }
      await writeTokenLocal(response.token);
      const status = getLicenseStatus(payload);
      return { known: true, result: { ok: true, status, payload } };
    } catch (e) {
      // A CloudApiError with HTTP 4xx for this email means the identity is not
      // recognized (no account / no active subscription) -> hard gate.
      if (e instanceof CloudApiError && e.status >= 400 && e.status < 500) {
        return { known: false, result: { ok: false, error: "Este email no tiene una cuenta de licencia activa" } };
      }
      // Anything else (network/offline) degrades to the local cache.
      const local = await this.loadLocal();
      return { known: true, result: local };
    }
  },

  async logoutLocal(): Promise<void> {
    await clearTokenLocal();
  },
};
