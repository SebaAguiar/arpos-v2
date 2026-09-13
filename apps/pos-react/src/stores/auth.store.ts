import { create } from "zustand";
import { AuthRepository, type AuthUser } from "@/repositories/auth.repository";
import { LicenseRepository, type LicenseData } from "@/repositories/license.repository";
import { SetupRepository } from "@/repositories/setup.repository";
import { setAuthToken, clearAuthToken } from "@/services/api-client";
import { ApiError } from "@/services/api-client";
import { readTokenLocal, type LicensePayload, type LicenseStatus } from "@/lib/license";

interface AuthState {
  user: AuthUser | null;
  license: LicenseData | null;
  licenseStatus: LicenseStatus | null;
  licensePayload: LicensePayload | null;
  loading: boolean;
  initialized: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithLicense: (email: string) => Promise<boolean>;
  refreshLicenseOnline: (email: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  checkSetup: () => Promise<void>;
  clearError: () => void;
}

const LICENSE_CACHE_KEY = "arcom_license";

function cacheLicense(license: LicenseData): void {
  try {
    localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify(license));
  } catch {
    // localStorage unavailable
  }
}

function loadCachedLicense(): LicenseData | null {
  try {
    const raw = localStorage.getItem(LICENSE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LicenseData;
  } catch {
    return null;
  }
}

function clearCachedLicense(): void {
  try {
    localStorage.removeItem(LICENSE_CACHE_KEY);
  } catch {
    // localStorage unavailable
  }
}

// Best-effort: exchange the locally-signed license token for the API session
// (auth_token) that the local sidecar requires on every data endpoint. Never
// throws — on any failure the POS keeps the license-derived identity and runs
// fully offline; the api-client retries the exchange on a 401.
async function mintApiAccessToken(): Promise<AuthUser | null> {
  const licenseToken = await readTokenLocal();
  if (!licenseToken) return null;
  try {
    const { token, user } = await AuthRepository.loginWithLicense(licenseToken);
    setAuthToken(token);
    return user;
  } catch {
    return null;
  }
}

// Offline-first session resolution: prefer the license bridge when a signed
// license token exists, otherwise fall back to a local identity session (free
// plan) so the core POS always loads data. The license only gates launcher
// updates and paid features — it never blocks the core.
async function resolveApiSession(email: string): Promise<AuthUser | null> {
  const licenseApiUser = await mintApiAccessToken();
  if (licenseApiUser) return licenseApiUser;
  try {
    const { token, user } = await AuthRepository.loginLocal(email);
    setAuthToken(token);
    return user;
  } catch {
    return null;
  }
}

function buildLicenseData(
  payload: LicensePayload,
  status: LicenseStatus,
): LicenseData {
  return {
    client: { id: payload.sub, name: payload.name, email: payload.email },
    plan: {
      name: payload.planName,
      slug: payload.planSlug,
      features: payload.features,
      maxStores: payload.maxStores,
    },
    subscription: {
      id: payload.sub,
      status: status.status === "invalid" ? "inactive" : "active",
      renewalDate: null,
      startDate: payload.validFrom,
    },
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  license: loadCachedLicense(),
  licenseStatus: null,
  licensePayload: null,
  loading: false,
  initialized: false,
  isInitialized: true,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await AuthRepository.login(email, password);
      setAuthToken(token);
      set({ user, loading: false });
      return true;
    } catch (e) {
      let message = "Error al iniciar sesion";
      if (e instanceof ApiError) {
        message = e.status === 401 ? "Email o contrasena incorrectos" : e.message;
      }
      set({ loading: false, error: message });
      return false;
    }
  },

  loginWithLicense: async (email) => {
    set({ loading: true, error: null });
    // Local-first login: the POS always operates, even fully offline. The
    // license only gates cloud/paid features, never the core POS. A hard
    // identity rejection from the license service (known:false) degrades to
    // a local free-tier session instead of blocking entry.
    const { known, result } = await LicenseRepository.issueAndStore(email);

    const status: LicenseStatus =
      result.ok ? result.status : { status: "invalid", payload: null, daysLeft: 0 };
    const payload = result.ok ? result.payload : null;
    const licenseData: LicenseData | null = payload
      ? buildLicenseData(payload, status)
      : null;

    if (!known) {
      // License revoked or account missing: persist nothing, keep paid gates
      // closed (licenseStatus invalid), and let the core continue locally.
      set({
        license: null,
        licenseStatus: status,
        licensePayload: payload,
        error: null,
      });
    } else if (licenseData) {
      cacheLicense(licenseData);
    }

    // Bridge the license into an API session so data endpoints stop returning
    // 401, falling back to a local free-tier identity when no license exists.
    // Best-effort: if the sidecar is unreachable the POS still enters.
    const apiUser = await resolveApiSession(email);
    const fallbackUser: AuthUser = {
      id: payload?.sub ?? email,
      email: payload?.email ?? email,
      name: payload?.name ?? email.split("@")[0],
      role: "client",
    };

    set({
      user: apiUser ?? fallbackUser,
      license: licenseData,
      licenseStatus: status,
      licensePayload: payload,
      loading: false,
      error: null,
    });
    return true;
  },

  logout: () => {
    clearAuthToken();
    clearCachedLicense();
    LicenseRepository.logoutLocal();
    set({ user: null, license: null, licenseStatus: null, licensePayload: null, error: null });
  },

  refreshLicenseOnline: async (email) => {
    // Best-effort online renewal. Never throws nor blocks: on transient
    // network failure it silently keeps the existing local status, and on a
    // hard identity rejection (plan revoked / account gone) it flags the
    // license as invalid so the paid gates close.
    try {
      const { known, result } = await LicenseRepository.issueAndStore(email);
      const status: LicenseStatus =
        result.ok ? result.status : { status: "invalid", payload: null, daysLeft: 0 };
      const payload = result.ok ? result.payload : null;

      if (!known) {
        // License revoked or account removed: drop the signed token and mark
        // the license invalid (identity gate stays closed to cloud/paid).
        LicenseRepository.logoutLocal();
        clearCachedLicense();
        set({ licenseStatus: status, licensePayload: payload, license: null, error: null });
        return;
      }

      const licenseData = payload ? buildLicenseData(payload, status) : get().license;
      if (licenseData) cacheLicense(licenseData);
      set({
        license: licenseData,
        licenseStatus: status,
        licensePayload: payload,
        error: null,
      });
    } catch {
      // keep existing local status on network failure
    }
  },

  initialize: async () => {
    const cachedLicense = loadCachedLicense();
    const local = await LicenseRepository.loadLocal();

    // Restore identity from the local signed license token (works offline).
    if (local.ok && local.status.payload) {
      const p = local.status.payload;
      set({
        user: {
          id: p.sub,
          email: p.email,
          name: p.name,
          role: "client",
        },
        licenseStatus: local.status,
        licensePayload: p,
        license: cachedLicense,
        initialized: true,
      });
      // Revalidate online in the background; never blocks startup.
      void get().refreshLicenseOnline(p.email);
      // Mint/refresh the API session from the license; the api-client retries
      // on the first 401 if this ever races the initial data calls.
      void mintApiAccessToken().then((apiUser) => {
        if (apiUser) set({ user: apiUser });
      });
      return;
    }

    if (cachedLicense) {
      set({
        user: {
          id: cachedLicense.client.id,
          email: cachedLicense.client.email,
          name: cachedLicense.client.name,
          role: "client",
        },
        license: cachedLicense,
        initialized: true,
      });
      return;
    }

    if (!localStorage.getItem("auth_token")) {
      set({ initialized: true });
      return;
    }

    set({ loading: true });
    try {
      const user = await AuthRepository.getProfile();
      set({ user, loading: false, initialized: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearAuthToken();
        set({ user: null, loading: false, initialized: true });
      } else {
        set({ loading: false, initialized: true });
      }
    }
  },

  checkSetup: async () => {
    try {
      const status = await SetupRepository.getStatus();
      set({ isInitialized: status.isInitialized });
    } catch {
      set({ isInitialized: true });
    }
  },

  clearError: () => set({ error: null }),
}));
