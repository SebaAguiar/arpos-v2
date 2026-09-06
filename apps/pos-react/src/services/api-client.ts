import { apiBaseUrl } from "@/config";
import { readTokenLocal } from "@/lib/license";

const API_BASE = apiBaseUrl;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const AUTH_TOKEN_KEY = "auth_token";

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // localStorage unavailable
  }
}

// Single-flight exchange of the license token for a fresh auth_token on 401.
// Self-heals expired sessions and the cold-boot race where data calls fire
// before initialize() has minted the session.
let mintInFlight: Promise<boolean> | null = null;

async function tryMintLicenseSession(): Promise<boolean> {
  if (!mintInFlight) {
    mintInFlight = (async () => {
      try {
        const licenseToken = await readTokenLocal();
        if (!licenseToken) return false;
        const res = await fetch(`${API_BASE}/auth/license`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenseToken }),
          cache: "no-store",
        });
        if (!res.ok) return false;
        const json = (await res.json()) as { access_token?: string };
        if (!json.access_token) return false;
        setAuthToken(json.access_token);
        return true;
      } catch {
        return false;
      } finally {
        mintInFlight = null;
      }
    })();
  }
  return mintInFlight;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  // A license holder with a stale/missing session gets one transparent retry:
  // mint a fresh auth_token and re-issue the request once.
  if (res.status === 401 && !retried && path !== "/auth/license") {
    const minted = await tryMintLicenseSession();
    if (minted) {
      return request<T>(method, path, body, true);
    }
  }

  if (res.status === 401) {
    clearAuthToken();
    throw new ApiError(401, "Sesión expirada");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message ?? text;
    } catch {
      // text is not JSON, use as-is
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
