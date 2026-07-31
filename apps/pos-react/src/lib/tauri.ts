import { getVersion } from "@tauri-apps/api/app";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getAppVersion(): Promise<string> {
  return getVersion();
}
