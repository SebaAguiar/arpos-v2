import { jwtVerify, importSPKI } from "jose";
import { isTauri, safeInvoke } from "@/lib/tauri";

const TOKEN_STORAGE_KEY = "arcom_license_token";

async function readTokenLocal(): Promise<string | null> {
  if (isTauri()) {
    try {
      const token = await safeInvoke<string | null>("get_license_token");
      return token ?? null;
    } catch {
      // fall through to storage
    }
  }
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeTokenLocal(token: string): Promise<void> {
  if (isTauri()) {
    try {
      await safeInvoke("save_license_token", { token });
      return;
    } catch {
      // fall through to storage
    }
  }
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore
  }
}

async function clearTokenLocal(): Promise<void> {
  if (isTauri()) {
    try {
      await safeInvoke("clear_license_token");
      return;
    } catch {
      // fall through to storage
    }
  }
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { readTokenLocal, writeTokenLocal, clearTokenLocal };

export interface LicensePayload {
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

export type LicenseStatus =
  | { status: "valid"; payload: LicensePayload; daysLeft: number }
  | { status: "grace"; payload: LicensePayload; daysLeft: number }
  | { status: "expired"; payload: LicensePayload | null; daysLeft: number }
  | { status: "invalid"; payload: null; daysLeft: 0 };

const ISSUER = "arcom-admin";
const AUDIENCE = "arcom-pos";

// Public key (Ed25519) used to verify offline license tokens.
// The public key is injected at build time via VITE_LICENSE_PUBLIC_KEY
// (set in .env or build environment). The fallback below is intentionally
// disabled: if the build does not inject the key, license verification
// will fail fast (a hard failure is preferable to accepting an invalid
// or obsolete key). This mirrors the requirement that POS NEVER trusts a
// baked-in dev key in production builds.
const RAW_PUBLIC_KEY: string | undefined = import.meta.env.VITE_LICENSE_PUBLIC_KEY;

if (!RAW_PUBLIC_KEY) {
  throw new Error(
    "VITE_LICENSE_PUBLIC_KEY is missing. The POS must be built with the Ed25519 public key from the admin-panel.",
  );
}

const EMBEDDED_PUBLIC_KEY: string = RAW_PUBLIC_KEY;

// Grace period after validUntil before the paid features are blocked.
export const LICENSE_GRACE_DAYS = 15;

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function verifyLicenseToken(token: string): Promise<LicensePayload | null> {
  try {
    const publicKey = await importSPKI(EMBEDDED_PUBLIC_KEY, "EdDSA");
    // currentDate: epoch ignores the `exp` claim so that expired tokens still
    // yield their payload — getLicenseStatus() decides valid/grace/expired.
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
      currentDate: new Date(0),
    });

    return {
      sub: payload.sub ?? "",
      email: (payload.email as string) ?? "",
      name: (payload.name as string) ?? "",
      planSlug: (payload.planSlug as string) ?? "",
      planName: (payload.planName as string) ?? "",
      maxStores: (payload.maxStores as number) ?? 1,
      features: (payload.features as Record<string, boolean>) ?? {},
      validFrom: (payload.validFrom as string) ?? "",
      validUntil: (payload.validUntil as string) ?? "",
    };
  } catch {
    return null;
  }
}

export function getLicenseStatus(
  payload: LicensePayload | null,
): LicenseStatus {
  if (!payload || !payload.validUntil) {
    return { status: "invalid", payload: null, daysLeft: 0 };
  }

  const validUntil = new Date(payload.validUntil).getTime();

  if (Number.isNaN(validUntil)) {
    return { status: "invalid", payload: null, daysLeft: 0 };
  }

  const daysUntilExpiry = daysUntil(new Date(payload.validUntil));

  if (Date.now() <= validUntil) {
    return { status: "valid", payload, daysLeft: daysUntilExpiry };
  }

  // Past validUntil: check the 15-day grace window.
  const graceEnd = validUntil + LICENSE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() <= graceEnd) {
    return { status: "grace", payload, daysLeft: Math.ceil((graceEnd - Date.now()) / (1000 * 60 * 60 * 24)) };
  }

  return { status: "expired", payload, daysLeft: 0 };
}
