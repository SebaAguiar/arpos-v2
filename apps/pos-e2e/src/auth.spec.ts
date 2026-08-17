import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("login with valid credentials", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByText("Ingresá para continuar")).toBeVisible();

    await page.getByPlaceholder("admin@arcom.com").fill("admin@arcom.com");
    await page.getByPlaceholder("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").fill("admin123");
    await page.getByText("Iniciar sesión").click();

    await expect(page.getByText("POS — Ventas")).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test("rejects invalid credentials", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByText("Ingresá para continuar")).toBeVisible();

    await page.getByPlaceholder("admin@arcom.com").fill("wrong@email.com");
    await page.getByPlaceholder("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").fill("wrongpass");
    await page.getByText("Iniciar sesión").click();

    await expect(page.getByText("Error al iniciar sesión")).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test("can logout from user menu", async ({ page }) => {
    await page.goto("/");

    await page.locator('button[aria-haspopup="menu"]').first().click();
    await page.getByText("Cerrar sesión").click();

    await expect(page.getByText("Ingresá para continuar")).toBeVisible();
  });
});
