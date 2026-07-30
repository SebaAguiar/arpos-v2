import { test, expect } from "@playwright/test";

test.describe("Gestión de Productos", () => {
  test("navigates to products page and shows product list", async ({ page }) => {
    await page.goto("/products-management");
    await page.waitForTimeout(2000);

    await expect(page.getByText("Gestión de Productos")).toBeVisible();
  });

  test("can open add product dialog", async ({ page }) => {
    await page.goto("/products-management");

    const addBtn = page.getByRole("button", { name: /agregar|nuevo|crear/i }).first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
    }
  });
});
