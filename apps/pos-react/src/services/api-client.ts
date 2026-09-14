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

// Last email used for a local (free-plan) session. Persisted on login so the
// 401 self-heal can re-mint a local auth_token without holding user input.
const LAST_LOCAL_EMAIL_KEY = "last_local_email";

function getLastLocalEmail(): string | null {
  try {
    return localStorage.getItem(LAST_LOCAL_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setLastLocalEmail(email: string): void {
  try {
    localStorage.setItem(LAST_LOCAL_EMAIL_KEY, email);
  } catch {
    // localStorage unavailable
  }
}

// Single-flight session mint on 401: license-holder sessions exchange the
// license token for a fresh auth_token; free/local sessions (no license token)
// re-mint a local identity session from the persisted email. Self-heals
// expired sessions and the cold-boot race where data calls fire before
// initialize() has minted the session.
let mintInFlight: Promise<boolean> | null = null;

async function tryMintLocalSession(): Promise<boolean> {
  const email = getLastLocalEmail();
  if (!email) return false;
  const res = await fetch(`${API_BASE}/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) return false;
  setAuthToken(json.access_token);
  return true;
}

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

  // A stale/missing session gets one transparent retry: mint a fresh
  // auth_token (license bridge first, then local identity for free-plan
  // sessions) and re-issue the request once.
  if (res.status === 401 && !retried && path !== "/auth/license" && path !== "/auth/local") {
    const minted =
      (await tryMintLicenseSession()) || (await tryMintLocalSession());
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

async function requestText(path: string, retried = false): Promise<string> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {};

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (res.status === 401 && !retried && path !== "/auth/license" && path !== "/auth/local") {
    const minted =
      (await tryMintLicenseSession()) || (await tryMintLocalSession());
    if (minted) {
      return requestText(path, true);
    }
  }

  if (res.status === 401) {
    clearAuthToken();
    throw new ApiError(401, "Sesión expirada");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  return res.text();
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  getText: (path: string) => requestText(path),
};
