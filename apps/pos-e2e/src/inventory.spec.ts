import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3000/api";

async function authToken(page: import("@playwright/test").Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem("auth_token") ?? "");
  return token;
}

test.describe("Inventario", () => {
  test("navigates to the inventory page and renders the stock KPIs", async ({ page }) => {
    await page.goto("/inventory");

    await expect(page.getByText("Inventario", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Control de existencias")).toBeVisible();
    await expect(page.getByText("Total Productos", { exact: true })).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible({ timeout: 15000 });
  });

  test("filters products by stock status from the KPI cards", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByText("Total Productos", { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // The Sin Stock KPI card is always present and clickable; toggling its
    // filter must not break the table render.
    await page.getByText("Sin Stock", { exact: true }).first().click();
    await expect(page.getByText("No se encontraron productos").or(page.getByRole("table").first())).toBeVisible({
      timeout: 10000,
    });
  });

  test("creates an entry stock movement from the new movement dialog", async ({ page }) => {
    // Navigate to the app origin first so the license-bridged auth_token is
    // present in localStorage (the same ordering sync.spec relies on).
    await page.goto("/");
    const token = await authToken(page);
    const code = `E2E-INV-${Date.now()}`;
    const res = await page.request.post(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code,
        name: "Producto de inventario e2e",
        price_cents: 1000,
        cost_cents: 600,
        stock_quantity: 0,
      },
    });
    expect(res.ok()).toBe(true);
    const product = (await res.json()) as { id: string };

    await page.goto("/inventory");
    await page.getByRole("button", { name: "Nuevo movimiento" }).click();

    const dialog = page.locator('div[style*="position: fixed"]').filter({
      hasText: "Registrar movimiento",
    });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Select the freshly created product in the Radix Select.
    await dialog.getByText("Seleccionar producto").click();
    await page
      .getByRole("option", { name: new RegExp(`${code} - Producto de inventario e2e`) })
      .click();

    await dialog.getByPlaceholder("0").fill("5");
    await dialog.getByPlaceholder("Ej: Ingreso de mercadería, Ajuste por conteo...").fill("Ingreso de prueba e2e");

    await dialog.getByText("Registrar", { exact: true }).click();

    // The movement registers and a pending entry shows consolidated stock >= 5.
    await expect
      .poll(
        async () => {
          const sres = await page.request.get(`${API_BASE}/inventory`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const stock = (await sres.json()) as Array<{ productId: string; stock_quantity: number }>;
          const match = stock.find((s) => s.productId === product.id);
          return (match?.stock_quantity ?? 0) >= 5;
        },
        { timeout: 15000 },
      )
      .toBe(true);
  });
});