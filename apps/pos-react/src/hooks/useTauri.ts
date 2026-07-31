import { isTauri } from "@/lib/tauri";

interface TauriState {
  isTauri: boolean;
  isLoading: boolean;
}

export function useTauri(): TauriState {
  return { isTauri: isTauri(), isLoading: false };
}
