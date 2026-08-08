import type { ReactNode } from "react";
import { useBackend } from "@/hooks/useBackend";
import { BackendLoading } from "./BackendLoading";

interface TauriShellProps {
  children: ReactNode;
}

export function TauriShell({ children }: TauriShellProps) {
  const { isLoading, error, retry } = useBackend();

  if (isLoading || error) {
    return <BackendLoading error={error} onRetry={retry} />;
  }

  return <>{children}</>;
}
