import { useState, useEffect } from "react";
import { isTauri } from "@/lib/tauri";

interface TauriState {
  isTauri: boolean;
  isLoading: boolean;
}

export function useTauri(): TauriState {
  const [state, setState] = useState<TauriState>({
    isTauri: false,
    isLoading: true,
  });

  useEffect(() => {
    setState({ isTauri: isTauri(), isLoading: false });
  }, []);

  return state;
}
