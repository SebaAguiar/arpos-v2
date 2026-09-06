import { test, expect } from "@playwright/test";

// Auth in Arcom is license-based: a locally-signed token
// (localStorage["arcom_license_token"]) gates the POS routes, restored
// offline by auth.store initialize(). There is no email/password login
// anymore — only the license email claim flow, which stays local-first.

// Open a clean context (no storage state) so the app boots unauthenticated.
async function openUnauthenticated(browser: import("@playwright/test").Browser) {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  return { context, page };
}

test.describe("Auth", () => {
  test("redirects to the license login when unauthenticated", async ({ browser }) => {
    const { context, page } = await openUnauthenticated(browser);

    await page.goto("/");

    await expect(page.getByText("Ingresa tu email para continuar")).toBeVisible();
    await expect(page.getByPlaceholder("tu@email.com")).toBeVisible();
    await expect(page.getByText("Iniciar sesion")).toBeVisible();

    await context.close();
  });

  test("signs in a fresh email locally-first", async ({ browser }) => {
    // License is local-first: with no admin server reachable the POS still
    // operates, restoring/issuing identity locally. The license only gates
    // cloud/paid features, never the core POS.
    const { context, page } = await openUnauthenticated(browser);

    await page.goto("/");
    await page.getByPlaceholder("tu@email.com").fill("e2e-offline@arcom.test");
    await page.getByText("Iniciar sesion").click();

    await expect(page.getByText("Carrito", { exact: true })).toBeVisible({
      timeout: 15000,
    });

    await context.close();
  });

  test("restores identity from the saved license token", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Carrito", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/\d+ productos/)).toBeVisible();
  });

  test("can logout from the user menu", async ({ page }) => {
    await page.goto("/");

    await page.locator('button[aria-haspopup="menu"]').first().click();
    await page.getByText("Cerrar sesión").click();

    await expect(page.getByText("Ingresa tu email para continuar")).toBeVisible();
  });
});