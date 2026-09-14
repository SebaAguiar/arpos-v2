import { useState, useEffect, useCallback } from "react";
import { ProcessService } from "@/services/process.service";
import { isTauri } from "@/lib/tauri";
import { getApiBaseUrl, getSidecarHeaders, refreshBackendConfig } from "@/config";
import type { BackendStatus } from "@/lib/types";

const HEALTH_POLL_INTERVAL_MS = 500;
const HEALTH_TIMEOUT_MS = 60_000;

interface UseBackendReturn {
  status: BackendStatus | null;
  isLoading: boolean;
  error: string | null;
  isTauri: boolean;
  startBackend: () => Promise<void>;
  stopBackend: () => Promise<void>;
  restartBackend: () => Promise<void>;
  waitForBackend: () => Promise<void>;
  retry: () => void;
}

export function useBackend(): UseBackendReturn {
  const tauri = isTauri();
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const startBackend = useCallback(async () => {
    if (!tauri) return;
    try {
      setError(null);
      await ProcessService.start();
    } catch (e) {
      setError(String(e));
    }
  }, [tauri]);

  const stopBackend = useCallback(async () => {
    if (!tauri) return;
    try {
      setError(null);
      await ProcessService.stop();
      setStatus(null);
    } catch (e) {
      setError(String(e));
    }
  }, [tauri]);

  const restartBackend = useCallback(async () => {
    if (!tauri) return;
    try {
      setError(null);
      await ProcessService.restart();
    } catch (e) {
      setError(String(e));
    }
  }, [tauri]);

  const waitForBackend = useCallback(async () => {
    if (!tauri) return;
    try {
      setError(null);
      await ProcessService.waitForReady();
    } catch (e) {
      setError(String(e));
    }
  }, [tauri]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/health`, {
        headers: getSidecarHeaders(),
        signal: AbortSignal.timeout(2_000),
      });
      // A foreign process answering 2xx without our sidecar identity must not
      // be treated as "backend up": only our backend reports backend:true.
      if (!res.ok) return false;
      const body = (await res.json().catch(() => null)) as {
        backend?: boolean;
      } | null;
      return body?.backend === true;
    } catch {
      return false;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!tauri) return;
    try {
      const s = await ProcessService.status();
      setStatus(s);
    } catch {
      setStatus({ running: false, port: 3000, pid: null, uptime_seconds: null });
    }
  }, [tauri]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const healthy = await checkHealth();
      if (cancelled) return;

      if (healthy) {
        setIsLoading(false);
        return;
      }

      if (tauri && !import.meta.env.DEV) {
        await fetchStatus();
        const s = await ProcessService.status().catch(() => null);
        if (cancelled) return;

        if (!s?.running) {
          try {
            await startBackend();
            if (cancelled) return;
            await ProcessService.waitForReady();
            // The sidecar binds a fresh ephemeral port per spawn; re-read the
            // launcher config so subsequent requests hit the new port.
            await refreshBackendConfig();
          } catch (e) {
            if (!cancelled) {
              setError(String(e));
              setIsLoading(false);
            }
            return;
          }
        }

        if (!cancelled) {
          await fetchStatus();
          setIsLoading(false);
        }
        return;
      }

      const startedAt = Date.now();
      while (!cancelled && Date.now() - startedAt < HEALTH_TIMEOUT_MS) {
        if (await checkHealth()) {
          if (cancelled) return;
          setIsLoading(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL_MS));
      }
      if (cancelled) return;
      setError(
        `No se pudo conectar al servidor local en ${HEALTH_TIMEOUT_MS / 1000}s. Verificá que el backend esté corriendo (pnpm dev:api).`,
      );
      setIsLoading(false);
    };

    init();

    const interval = setInterval(fetchStatus, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tauri, fetchStatus, startBackend, checkHealth, retryNonce]);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setRetryNonce((n) => n + 1);
  }, []);

  return {
    status,
    isLoading,
    error,
    isTauri: tauri,
    startBackend,
    stopBackend,
    restartBackend,
    waitForBackend,
    retry,
  };
}
