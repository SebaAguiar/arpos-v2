import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const license = useAuthStore((s) => s.license);
  const licenseStatus = useAuthStore((s) => s.licenseStatus);
  const licensePayload = useAuthStore((s) => s.licensePayload);
  const loading = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const loginWithLicense = useAuthStore((s) => s.loginWithLicense);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const initialize = useAuthStore((s) => s.initialize);
  const checkSetup = useAuthStore((s) => s.checkSetup);

  useEffect(() => {
    if (!initialized) {
      checkSetup().then(() => initialize());
    }
  }, [initialized, checkSetup, initialize]);

  return {
    user,
    license,
    licenseStatus,
    licensePayload,
    loading,
    initialized,
    isInitialized,
    isAuthenticated: !!user,
    error,
    login,
    loginWithLicense,
    logout,
    clearError,
  };
}
