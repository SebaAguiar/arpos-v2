import { useState, useEffect } from "react";

interface TauriState {
  isTauri: boolean;
  isLoading: boolean;
}

function detectTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function useTauri(): TauriState {
  const [state, setState] = useState<TauriState>({
    isTauri: false,
    isLoading: true,
  });

  useEffect(() => {
    setState({ isTauri: detectTauri(), isLoading: false });
  }, []);

  return state;
}
