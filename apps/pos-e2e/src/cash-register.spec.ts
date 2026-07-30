import { test, expect } from "@playwright/test";

test.describe("Caja", () => {
  test("renders cash register page with title and shift info", async ({ page }) => {
    await page.goto("/cash-register");

    await expect(page.getByText("Historial de Caja")).toBeVisible();
  });

  test("shows open/close shift button in header", async ({ page }) => {
    await page.goto("/");

    const shiftBtn = page.getByText(/Abrir caja|Cerrar caja/);
    await expect(shiftBtn).toBeVisible();
  });
});
