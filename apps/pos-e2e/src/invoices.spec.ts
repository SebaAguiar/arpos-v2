import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3000/api";

async function authToken(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem("auth_token") ?? "");
}

test.describe("Comprobantes Fiscales (ARCA)", () => {
  test("renders the fiscal invoices dashboard and its summary", async ({ page }) => {
    await page.goto("/invoices");

    await expect(page.getByText("Comprobantes Fiscales", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    // The header summary is a relative count that must always render, with or
    // without any voucher on record.
    await expect(page.getByText(/\d+ total · \d+ pendientes/)).toBeVisible();
  });

  test("lists the pending voucher it created and exposes the emit action", async ({
    page,
    request,
  }) => {
    // Navigate to the app origin first so the license-bridged auth_token is
    // present in localStorage (the same ordering sync.spec relies on).
    await page.goto("/");
    const token = await authToken(page);

    // Emission is only reachable once ARCA is configured; without an active
    // config the POST /invoices contract itself rejects the invoice. Branch on
    // the real config state, mirroring the sync.spec "No conectado" pattern.
    const configRes = await request.get(`${API_BASE}/arca/config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Nest serializes a missing ARCA config (null) as an empty 200 body.
    const configText = configRes.ok() ? await configRes.text() : "";
    const config = configText ? (JSON.parse(configText) as unknown) : null;
    test.skip(!config, "No active ARCA configuration on the dev database");

    const code = `E2E-FISCAL-${Date.now()}`;
    const productRes = await request.post(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code,
        name: "Producto fiscal e2e",
        price_cents: 12100,
        cost_cents: 8000,
        stock_quantity: 10,
      },
    });
    expect(productRes.ok()).toBe(true);
    const product = (await productRes.json()) as { id: string };

    const saleRes = await request.post(`${API_BASE}/sales`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        items: [{ productId: product.id, quantity: 1, unit_price_cents: 12100 }],
        total_cents: 12100,
        payment_method: "CASH",
      },
    });
    expect(saleRes.ok()).toBe(true);
    const sale = (await saleRes.json()) as { id: string };

    const invoiceRes = await request.post(`${API_BASE}/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { saleId: sale.id },
    });
    expect(invoiceRes.ok()).toBe(true);
    const invoice = (await invoiceRes.json()) as { id: string; status: string };

    await page.goto("/invoices");

    // The freshly created voucher appears as a pending row (the sale has no
    // contact, so it falls back to "Consumidor Final").
    await expect(page.getByText("Pendiente", { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });

    // A pending voucher exposes the single-emit (Rocket) action in its row.
    if (invoice.status === "pending") {
      await expect(
        page.getByRole("button", { name: /^Emitir/i }).first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("navigates back to the POS via the dialog close action", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.getByText("Comprobantes Fiscales", { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // The invoices screen is an overlay dialog; clicking the backdrop closes
    // it and returns to the POS.
    await page.mouse.click(10, 10);
    await expect(page.getByText("Carrito", { exact: true })).toBeVisible({ timeout: 10000 });
  });
});