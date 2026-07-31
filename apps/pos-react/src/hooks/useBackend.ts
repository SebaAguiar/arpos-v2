import { useState, useEffect, useCallback } from "react";
import { ProcessService } from "@/services/process.service";
import { isTauri } from "@/lib/tauri";
import type { BackendStatus } from "@/lib/types";

interface UseBackendReturn {
  status: BackendStatus | null;
  isLoading: boolean;
  error: string | null;
  isTauri: boolean;
  startBackend: () => Promise<void>;
  stopBackend: () => Promise<void>;
  restartBackend: () => Promise<void>;
  waitForBackend: () => Promise<void>;
}

export function useBackend(): UseBackendReturn {
  const tauri = isTauri();
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState(() => !tauri);
  const [error, setError] = useState<string | null>(null);

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

  const fetchStatus = useCallback(async () => {
    if (!tauri) {
      setIsLoading(false);
      return;
    }
    try {
      const s = await ProcessService.status();
      setStatus(s);
    } catch {
      setStatus({ running: false, port: 3000, pid: null, uptime_seconds: null });
    }
  }, [tauri]);

  useEffect(() => {
    if (!tauri) return;

    let cancelled = false;

    const init = async () => {
      await fetchStatus();

      const s = await ProcessService.status().catch(() => null);
      if (cancelled) return;

      if (!s?.running) {
        await startBackend();
        if (cancelled) return;

        try {
          await ProcessService.waitForReady();
        } catch (e) {
          if (!cancelled) setError(String(e));
          return;
        }
      }

      if (!cancelled) {
        await fetchStatus();
        setIsLoading(false);
      }
    };

    init();

    const interval = setInterval(fetchStatus, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tauri, fetchStatus, startBackend]);

  return {
    status,
    isLoading,
    error,
    isTauri: tauri,
    startBackend,
    stopBackend,
    restartBackend,
    waitForBackend,
  };
}
