import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface BackendStatus {
  running: boolean;
  port: number;
  pid: number | null;
  uptime_seconds: number | null;
}

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

function detectTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function useBackend(): UseBackendReturn {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isTauri = detectTauri();

  const startBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      setError(null);
      await invoke("start_backend");
    } catch (e) {
      setError(String(e));
    }
  }, [isTauri]);

  const stopBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      setError(null);
      await invoke("stop_backend");
      setStatus(null);
    } catch (e) {
      setError(String(e));
    }
  }, [isTauri]);

  const restartBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      setError(null);
      await invoke("restart_backend");
    } catch (e) {
      setError(String(e));
    }
  }, [isTauri]);

  const waitForBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      setError(null);
      await invoke("wait_for_backend");
    } catch (e) {
      setError(String(e));
    }
  }, [isTauri]);

  const fetchStatus = useCallback(async () => {
    if (!isTauri) {
      setIsLoading(false);
      return;
    }
    try {
      const s = await invoke<BackendStatus>("get_backend_status");
      setStatus(s);
    } catch {
      setStatus({ running: false, port: 3000, pid: null, uptime_seconds: null });
    }
  }, [isTauri]);

  useEffect(() => {
    if (!isTauri) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      await fetchStatus();

      const s = await invoke<BackendStatus>("get_backend_status").catch(() => null);
      if (cancelled) return;

      if (!s?.running) {
        await startBackend();
        if (cancelled) return;

        try {
          await invoke("wait_for_backend");
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
  }, [isTauri, fetchStatus, startBackend]);

  return {
    status,
    isLoading,
    error,
    isTauri,
    startBackend,
    stopBackend,
    restartBackend,
    waitForBackend,
  };
}
