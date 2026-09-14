import { isTauri, safeInvoke } from "@/lib/tauri";

const DEFAULT_API_BASE = "http://localhost:3000/api";
const SIDECAR_TOKEN_HEADER = "x-arcom-api-token";

// In the desktop build the launcher picks an ephemeral port for the backend
// and shares it (with a secret token) over IPC. Until resolveBackendConfig()
// runs we fall back to the fixed port used during plain web development.
let currentApiBase = (DEFAULT_API_BASE as string).replace(/\/$/, "");
let backendToken: string | null = null;
let resolvePromise: Promise<void> | null = null;

async function fetchLauncherConfig(): Promise<void> {
  try {
    const config = await safeInvoke<{ port: number; token: string }>(
      "get_backend_config",
    );
    currentApiBase = `http://127.0.0.1:${config.port}/api`;
    backendToken = config.token;
  } catch {
    // IPC unavailable or launcher not ready: keep the default base URL.
  }
}

export function getApiBaseUrl(): string {
  return currentApiBase;
}

export function getBackendToken(): string | null {
  return backendToken;
}

// Headers every request to the sidecar API must carry when a launcher-injected
// token exists. Returned only when the token is known, so web-development
// requests stay unchanged.
export function getSidecarHeaders(): Record<string, string> {
  return backendToken ? { [SIDECAR_TOKEN_HEADER]: backendToken } : {};
}

// Resolve the effective API base + token from the Tauri launcher once. Keeps
// the web development default when running outside the desktop shell.
export async function resolveBackendConfig(): Promise<void> {
  if (!isTauri()) return;
  if (!resolvePromise) {
    resolvePromise = fetchLauncherConfig();
  }
  return resolvePromise;
}

// Re-query the launcher after a start/restart: the sidecar binds a new
// ephemeral port each time it spawns, so a previously cached port is stale.
export async function refreshBackendConfig(): Promise<void> {
  await resolveBackendConfig();
  if (!isTauri()) return;
  await fetchLauncherConfig();
}