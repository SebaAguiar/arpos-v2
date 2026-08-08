import { useState, useEffect, useCallback } from "react";
import { apiBaseUrl } from "@/config";

interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/health`, {
          method: "HEAD",
          cache: "no-store",
        });
        if (res.ok && !navigator.onLine) {
          setIsOnline(true);
        }
      } catch {
        if (navigator.onLine) {
          setIsOnline(false);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}
