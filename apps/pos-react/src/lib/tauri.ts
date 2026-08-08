import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function isDesktopOnlyError(): Error {
  return new Error("Esta función está disponible solo en la aplicación de escritorio.");
}

export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauri()) {
    throw isDesktopOnlyError();
  }
  return tauriInvoke<T>(command, args);
}

export async function getAppVersion(): Promise<string> {
  return getVersion();
}
