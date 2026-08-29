import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { LicenseStatus } from "@/lib/license";

export type FeatureKey = "cloudSync" | "multiStore" | "reports" | "priority";

export interface LicenseGate {
  enabled: boolean;
  covered: boolean; // plan has the feature AND license is still within validity/grace
  blockMessage: string;
  status: LicenseStatus | null;
  requiresPurchase: boolean;
}

function featureOf(features: Record<string, boolean> | undefined, key: FeatureKey): boolean {
  return features?.[key] === true;
}

export function useLicense(): LicenseGate {
  const { licensePayload, licenseStatus } = useAuth();

  return useMemo<LicenseGate>(() => {
    const active = licenseStatus?.status === "valid" || licenseStatus?.status === "grace";
    const features = licensePayload?.features;

    const covered = active && featureOf(features, "cloudSync");

    return {
      enabled: covered,
      covered,
      requiresPurchase: !covered,
      status: licenseStatus,
      blockMessage:
        "La sincronización en la nube requiere un plan de pago o una licencia vigente. " +
        "Podés usarla sin conexión; para activarla, renová tu licencia o suscribite a un plan.",
    };
  }, [licensePayload, licenseStatus]);
}
