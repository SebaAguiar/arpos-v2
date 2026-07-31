import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiClient,
  ApiError,
  setAuthToken,
  clearAuthToken,
} from "@/services/api-client";

function mockResponse(body: unknown, status = 200): Response {
  const json = status === 204 ? null : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(json ?? ""),
    statusText: status === 401 ? "Unauthorized" : "OK",
  } as Response;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api-client", () => {
  it("sends the auth token when present", async () => {
    setAuthToken("abc123");
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get<{ id: number }>("/products");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer abc123");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("sends a JSON body on POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.post<{ id: number }>("/sales", { total: 100 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe('{"total":100}');
  });

  it("clears the token and throws on 401", async () => {
    setAuthToken("expired");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(null, 401)));

    await expect(apiClient.get("/sales")).rejects.toThrow("Sesión expirada");
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("parses the error message from a JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ message: "Producto no encontrado" }, 404))
    );

    const err = await apiClient.get("/products/123").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(404);
    expect((err as ApiError).message).toBe("Producto no encontrado");
  });

  it("returns undefined on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(null, 204)));
    await expect(apiClient.delete("/sales/1")).resolves.toBeUndefined();
  });

  it("clears the token", () => {
    setAuthToken("abc");
    clearAuthToken();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
});
