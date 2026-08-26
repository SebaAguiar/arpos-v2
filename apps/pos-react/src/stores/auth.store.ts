import { create } from "zustand";
import { AuthRepository, type AuthUser } from "@/repositories/auth.repository";
import { LicenseRepository, type LicenseData } from "@/repositories/license.repository";
import { SetupRepository } from "@/repositories/setup.repository";
import { setAuthToken, clearAuthToken } from "@/services/api-client";
import { ApiError } from "@/services/api-client";

interface AuthState {
  user: AuthUser | null;
  license: LicenseData | null;
  loading: boolean;
  initialized: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithLicense: (email: string) => Promise<boolean>;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  license: loadCachedLicense(),
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
    try {
      const result = await LicenseRepository.verify(email);
      if (!result.valid || !result.license) {
        set({ loading: false, error: result.error || "Licencia no valida" });
        return false;
      }

      cacheLicense(result.license);

      set({
        user: {
          id: result.license.client.id,
          email: result.license.client.email,
          name: result.license.client.name,
          role: "client",
        },
        license: result.license,
        loading: false,
      });
      return true;
    } catch {
      set({ loading: false, error: "Error al verificar licencia" });
      return false;
    }
  },

  logout: () => {
    clearAuthToken();
    clearCachedLicense();
    set({ user: null, license: null, error: null });
  },

  initialize: async () => {
    const token = localStorage.getItem("auth_token");
    const cachedLicense = loadCachedLicense();

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

    if (!token) {
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
