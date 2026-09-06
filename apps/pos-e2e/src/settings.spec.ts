import { test, expect } from "@playwright/test";

test.describe("Configuración", () => {
  test("renders settings page with sections", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByText("Datos de la empresa").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Configuración general").first()).toBeVisible({
      timeout: 15000,
    });

    // Payment methods live in their own tab (Radix Tabs).
    await page.getByRole("tab", { name: "Pagos" }).click();
    await expect(page.getByText("Métodos de pago").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("company form shows and has fields editable", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForSelector("text=Configuración general", { timeout: 15000 });

    await expect(page.getByLabel("Nombre de la empresa")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByLabel("CUIT o RUT de la empresa")).toBeVisible();
    await expect(page.getByLabel("Dirección de la empresa")).toBeVisible();
  });
});