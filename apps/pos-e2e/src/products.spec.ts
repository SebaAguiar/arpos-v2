import { test, expect } from "@playwright/test";

test.describe("Gestión de Productos", () => {
  test("navigates to products page and shows the product list", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByText("Inventario y Productos")).toBeVisible({
      timeout: 10000,
    });
    // Radix themes renders the table lazily once products land.
    await expect(page.getByRole("table").first()).toBeVisible({ timeout: 15000 });
  });

  test("can open the new product dialog", async ({ page }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: "Nuevo producto" }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
  });
});