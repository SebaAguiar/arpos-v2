import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3000/api";

test.describe("Sync — Cloud Sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Sincronización" }).click();
    await expect(page.getByText("Sync Cloud")).toBeVisible({ timeout: 10000 });
  });

  test("shows sync cloud section heading", async ({ page }) => {
    await expect(page.getByText("Sync Cloud")).toBeVisible();
    await expect(page.getByText("Cloud Sync — Suscripción")).toBeVisible();
  });

  test("shows the cloud connect form", async ({ page }) => {
    const connectedBadge = page.getByText("No conectado").or(page.getByText("Conectado"));
    await connectedBadge.first().waitFor({ timeout: 10000 });

    if (await page.getByText("No conectado").isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Activar sincronización" }).click();
    } else {
      await page.getByRole("button", { name: "Configuración avanzada" }).click();
    }

    await expect(page.getByPlaceholder("URL del servidor cloud")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByPlaceholder("JWT token")).toBeVisible();
  });

  test("shows subscription status card", async ({ page }) => {
    await expect(page.getByText("Cloud Sync — Suscripción")).toBeVisible();
  });

  test("shows the network indicator in the header", async ({ page }) => {
    await page.goto("/");
    const indicator = page
      .locator("header")
      .getByText(/Sincronizado|Modo offline|Sync pendiente|Sincronizando|Sin conexión/);
    await expect(indicator.first()).toBeVisible({ timeout: 10000 });
  });

  test("recovers sync after going offline and back online", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("header").getByText(/Sincronizado|Modo offline|Sync pendiente/).first(),
    ).toBeVisible({ timeout: 10000 });

    const context = page.context();
    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine, {}, { timeout: 3000 });
    await page.waitForTimeout(500);

    await expect(page.getByText("Modo offline")).toBeVisible({ timeout: 5000 });

    await context.setOffline(false);
    await page.waitForFunction(() => navigator.onLine, {}, { timeout: 3000 });
    await page.waitForTimeout(500);

    // The device recovers: the offline badge must disappear.
    await expect(page.getByText("Modo offline")).toHaveCount(0, { timeout: 10000 });
  });

  test("a new sale increases the pending sync count", async ({ page, request }) => {
    const token = await page.evaluate(() => localStorage.getItem("auth_token") ?? "");

    // Disconnect so the background sync cannot auto-process the new sale.
    await request.post(`${API_BASE}/sync/disconnect`, { headers: auth(token) });
    const before = await getPending(request, token);

    const res = await request.post(`${API_BASE}/products`, {
      headers: auth(token),
      data: {
        code: `E2E-SYNC-${Date.now()}`,
        name: "Producto de prueba sync",
        price_cents: 5000,
        cost_cents: 3000,
        stock_quantity: 100,
      },
    });
    expect(res.ok()).toBe(true);
    const product = (await res.json()) as { id: string };

    const sale = await request.post(`${API_BASE}/sales`, {
      headers: auth(token),
      data: {
        items: [{ productId: product.id, quantity: 1, unit_price_cents: 5000 }],
        total_cents: 5000,
        payment_method: "CASH",
      },
    });
    expect(sale.ok()).toBe(true);

    await expect
      .poll(() => getPending(request, token), { timeout: 15000 })
      .toBeGreaterThan(before);
  });
});

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function getPending(request: import("@playwright/test").APIRequestContext, token: string) {
  const res = await request.get(`${API_BASE}/sync/status`, { headers: auth(token) });
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { pending: number };
  return body.pending;
}