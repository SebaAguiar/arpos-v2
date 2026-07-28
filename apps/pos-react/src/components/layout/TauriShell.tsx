import type { ReactNode } from "react";
import { useBackend } from "@/hooks/useBackend";
import { BackendLoading } from "./BackendLoading";

interface TauriShellProps {
  children: ReactNode;
}

export function TauriShell({ children }: TauriShellProps) {
  const { isLoading, error, isTauri, restartBackend } = useBackend();

  if (!isTauri) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <BackendLoading error={error} onRetry={restartBackend} />;
  }

  if (error) {
    return <BackendLoading error={error} onRetry={restartBackend} />;
  }

  return <>{children}</>;
}
