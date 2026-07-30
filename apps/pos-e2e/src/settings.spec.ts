import { test, expect } from "@playwright/test";

test.describe("Configuración", () => {
  test("renders settings page with sections", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByText("Datos de la empresa")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Métodos de pago")).toBeVisible();
    await expect(page.getByText("Configuración general")).toBeVisible();
  });

  test("company form shows and has fields editable", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForSelector('input[placeholder="Nombre"]', { timeout: 10000 });

    await expect(page.getByPlaceholder("Nombre")).toBeVisible();
    await expect(page.getByPlaceholder("CUIT / RUT")).toBeVisible();
    await expect(page.getByPlaceholder("Dirección")).toBeVisible();
  });
});
