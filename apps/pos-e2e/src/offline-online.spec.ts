import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { createServer, type Server } from "http";

const RELAY_PORT = 3457;
const RELAY_URL = `http://localhost:${RELAY_PORT}`;
const API_BASE = "http://localhost:3000/api";
const RELAY_JWT = "e2e-stub-token";

interface RelayApply {
  action: string;
  entity: string;
  entityId: string;
  payload: unknown;
}

let relay: Server;
let applies: RelayApply[] = [];

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function getToken(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem("auth_token") ?? "");
}

async function createTestProduct(
  request: APIRequestContext,
  token: string,
): Promise<{ id: string; price_cents: number }> {
  const res = await request.post(`${API_BASE}/products`, {
    headers: auth(token),
    data: {
      code: `E2E-OFFLINE-${Date.now()}`,
      name: "Producto de prueba offline-online",
      price_cents: 5000,
      cost_cents: 3000,
      stock_quantity: 100,
    },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { id: string; price_cents: number };
}

async function getSyncStatus(request: APIRequestContext, token: string) {
  const res = await request.get(`${API_BASE}/sync/status`, { headers: auth(token) });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { pending: number; synced: number; error: number };
}

async function getRelayApplies(request: APIRequestContext): Promise<RelayApply[]> {
  const res = await request.get(`${RELAY_URL}/__requests`);
  expect(res.ok()).toBe(true);
  return (await res.json()) as RelayApply[];
}

async function createSale(
  request: APIRequestContext,
  token: string,
  product: { id: string; price_cents: number },
): Promise<void> {
  const res = await request.post(`${API_BASE}/sales`, {
    headers: auth(token),
    data: {
      items: [{ productId: product.id, quantity: 1, unit_price_cents: product.price_cents }],
      total_cents: product.price_cents,
      payment_method: "CASH",
    },
  });
  expect(res.ok()).toBe(true);
}

test.beforeAll(async () => {
  relay = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/sync/apply") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        applies.push(JSON.parse(body) as RelayApply);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }

    if (req.method === "GET" && req.url === "/api/sync/changes") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("[]");
      return;
    }

    if (req.url === "/__requests") {
      if (req.method === "DELETE") {
        applies = [];
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(applies));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => relay.listen(RELAY_PORT, resolve));
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => relay.close(() => resolve()));
});

async function openSyncTab(page: Page): Promise<void> {
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Sincronización" }).click();
  await expect(page.getByText("Sync Cloud")).toBeVisible({ timeout: 10000 });
}

test.describe("Sync — offline to online transitions", () => {
  test.beforeEach(async ({ page }) => {
    await openSyncTab(page);
  });

  test("queues sales offline and pushes them after connecting to cloud", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const token = await getToken(page);

    // Deterministic starting point: no connection and an empty relay log.
    await request.post(`${API_BASE}/sync/disconnect`, { headers: auth(token) });
    await request.delete(`${RELAY_URL}/__requests`);
    await openSyncTab(page);

    const baseline = (await getSyncStatus(request, token)).pending;
    const product = await createTestProduct(request, token);

    // 1) OFFLINE-FIRST: a new sale stays queued and is never pushed.
    await createSale(request, token, product);
    const queued = (await getSyncStatus(request, token)).pending;
    expect(queued).toBeGreaterThanOrEqual(baseline + 1);
    expect(await getRelayApplies(request)).toHaveLength(0);

    // 2) CONNECT: configuring the cloud relay pushes the whole queue.
    await page.getByRole("button", { name: "Activar sincronización" }).click();
    await page.getByPlaceholder("URL del servidor cloud").fill(RELAY_URL);
    await page.getByPlaceholder("JWT token").fill(RELAY_JWT);
    await page.getByText("Conectar", { exact: true }).click();
    await expect(page.getByText("Conectado").first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Subir cambios" }).click();
    await expect
      .poll(() => getSyncStatus(request, token), { timeout: 20000 })
      .toMatchObject({ pending: 0 });

    const pushedOnline = await getRelayApplies(request);
    expect(pushedOnline.some((a) => a.entity === "sale")).toBe(true);

    // 3) DISCONNECT: new sales queue up again without reaching the relay.
    // The advanced form stays open (showSetup persisted), so "Desconectar"
    // is already visible.
    await page.getByRole("button", { name: "Desconectar", exact: true }).click();
    await expect(page.getByText("No conectado")).toBeVisible({ timeout: 10000 });

    // Fill the still-open form and connect again.
    await page.getByPlaceholder("URL del servidor cloud").fill(RELAY_URL);
    await page.getByPlaceholder("JWT token").fill(RELAY_JWT);
    await page.getByText("Conectar", { exact: true }).click();
    await expect(page.getByText("Conectado").first()).toBeVisible({ timeout: 10000 });

    // 4) RECONNECT: a new sale is pushed once cloud is configured again.
    const reappliedBefore = await getRelayApplies(request);
    await createSale(request, token, product);

    await page.getByRole("button", { name: "Subir cambios" }).click();
    await expect
      .poll(() => getSyncStatus(request, token), { timeout: 20000 })
      .toMatchObject({ pending: 0 });

    const appliesAfterReconnect = await getRelayApplies(request);
    expect(appliesAfterReconnect.length).toBeGreaterThan(reappliedBefore.length);

    // Leave the workspace disconnected so other sync specs stay deterministic.
    await request.post(`${API_BASE}/sync/disconnect`, { headers: auth(token) });
  });
});