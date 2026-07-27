import { create } from "zustand";
import { AuthRepository, type AuthUser } from "@/repositories/auth.repository";
import { SetupRepository } from "@/repositories/setup.repository";
import { setAuthToken, clearAuthToken } from "@/services/api-client";
import { ApiError } from "@/services/api-client";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => Promise<void>;
  checkSetup: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
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
      let message = "Error al iniciar sesión";
      if (e instanceof ApiError) {
        message = e.status === 401 ? "Email o contraseña incorrectos" : e.message;
      }
      set({ loading: false, error: message });
      return false;
    }
  },

  logout: () => {
    clearAuthToken();
    set({ user: null, error: null });
  },

  initialize: async () => {
    const token = localStorage.getItem("auth_token");
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
