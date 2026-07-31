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

test.describe("Sync — offline to online transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForSelector("text=Sync Cloud", { timeout: 10000 });
  });

  test("queues sales offline and pushes them after connecting to cloud", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    const token = await getToken(page);

    await request.post(`${API_BASE}/sync/disconnect`, { headers: auth(token) });
    await request.delete(`${RELAY_URL}/__requests`);

    const product = await createTestProduct(request, token);

    // 1) OFFLINE-FIRST: a new sale stays queued and is never pushed.
    await createSale(request, token, product);
    const offlineStatus = await getSyncStatus(request, token);
    expect(offlineStatus.pending).toBeGreaterThanOrEqual(1);
    expect(await getRelayApplies(request)).toHaveLength(0);

    // 2) CONNECT: configuring the cloud relay pushes the whole queue.
    await page.getByPlaceholder("URL del servidor cloud").fill(RELAY_URL);
    await page.getByPlaceholder("JWT token").fill(RELAY_JWT);
    await page.getByText("Conectar", { exact: true }).click();
    await expect(page.getByText("Subir cambios")).toBeVisible({ timeout: 10000 });

    await page.getByText("Subir cambios").click();
    await expect(page.getByText(/\d+ pendientes/)).toHaveCount(0, { timeout: 15000 });

    const onlineStatus = await getSyncStatus(request, token);
    expect(onlineStatus.pending).toBe(0);

    const pushedOnline = await getRelayApplies(request);
    expect(pushedOnline.some((a) => a.entity === "sale")).toBe(true);

    // 3) DISCONNECT: new sales queue up again without reaching the relay.
    await page.getByText("Desconectar").click();
    await createSale(request, token, product);

    const offlineAgain = await getSyncStatus(request, token);
    expect(offlineAgain.pending).toBeGreaterThanOrEqual(1);

    const appliesBeforeReconnect = await getRelayApplies(request);
    const countBeforeReconnect = appliesBeforeReconnect.length;

    // 4) RECONNECT: the queued sale is pushed once cloud is configured again.
    await page.getByPlaceholder("URL del servidor cloud").fill(RELAY_URL);
    await page.getByPlaceholder("JWT token").fill(RELAY_JWT);
    await page.getByText("Conectar", { exact: true }).click();
    await expect(page.getByText("Subir cambios")).toBeVisible({ timeout: 10000 });

    await page.getByText("Subir cambios").click();
    await expect(page.getByText(/\d+ pendientes/)).toHaveCount(0, { timeout: 15000 });

    const reconnectedStatus = await getSyncStatus(request, token);
    expect(reconnectedStatus.pending).toBe(0);

    const appliesAfterReconnect = await getRelayApplies(request);
    expect(appliesAfterReconnect.length).toBeGreaterThan(countBeforeReconnect);

    // Leave the workspace disconnected so other sync specs stay deterministic.
    await request.post(`${API_BASE}/sync/disconnect`, { headers: auth(token) });
  });
});
