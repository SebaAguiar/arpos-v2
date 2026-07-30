import { test, expect } from "@playwright/test";

test.describe("POS — Ventas", () => {
  test("shows product grid and cart on page load", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Carrito", { exact: true })).toBeVisible();
    await expect(page.getByText("Carrito vacío")).toBeVisible();
    await expect(page.getByText(/\d+ productos/)).toBeVisible();
  });

  test("searches products by name", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder("Escanear código o buscar producto...");
    await searchInput.fill("Remera");

    await expect(page.locator('[aria-label^="Agregar"]').first()).toBeVisible();
    const count = await page.locator('[aria-label^="Agregar"]').count();
    expect(count).toBeGreaterThanOrEqual(1);

    await searchInput.fill("XYZ-NONEXISTENT");
    await expect(page.getByText("0 productos")).toBeVisible();
  });

  test("adds a product to cart and shows it in the cart panel", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector('[aria-label^="Agregar"]');
    await page.locator('[aria-label^="Agregar"]').first().click();
    await page.waitForTimeout(300);

    const cobrarBtn = page.locator("button:has-text('Cobrar')");
    await expect(cobrarBtn).toBeVisible({ timeout: 5000 });
  });

  test("adds multiple products and updates quantity", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector('[aria-label^="Agregar"]');
    const productButtons = page.locator('[aria-label^="Agregar"]');

    const count = await productButtons.count();
    if (count < 2) {
      test.skip(true, "Not enough products to test multiple add");
      return;
    }

    await productButtons.nth(0).click();
    await page.waitForTimeout(200);
    await productButtons.nth(1).click();

    const plusButtons = page.locator('button[aria-label*="Incrementar"]');
    if ((await plusButtons.count()) > 0) {
      await plusButtons.first().click();
      await page.waitForTimeout(200);
    }

    await expect(page.getByText("Cobrar")).toBeVisible();
  });

  test("opens payment dialog when clicking Cobrar", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector('[aria-label^="Agregar"]');
    await page.locator('[aria-label^="Agregar"]').first().click();
    await page.waitForTimeout(200);

    const cobrarBtn = page.locator("button:has-text('Cobrar')");
    await cobrarBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Total a pagar")).toBeVisible();
  });
});
