export const CLOUD_API_BASE =
  import.meta.env.VITE_CLOUD_API_BASE ?? "http://localhost:3001";

export class CloudApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CloudApiError";
  }
}

async function cloudRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${CLOUD_API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error ?? parsed.message ?? text;
    } catch {
      // text is not JSON
    }
    throw new CloudApiError(res.status, message);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const cloudClient = {
  get: <T>(path: string) => cloudRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) =>
    cloudRequest<T>("POST", path, body),
};
