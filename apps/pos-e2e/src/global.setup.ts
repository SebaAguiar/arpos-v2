import { test as setup, expect } from "@playwright/test";

setup("authenticate via UI login and save storage state", async ({ page }) => {
  await page.goto("http://localhost:1420");
  await page.waitForTimeout(500);

  await page.getByPlaceholder("admin@arcom.com").fill("admin@arcom.com");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.getByText("Iniciar sesión").click();

  const sidebarPos = page.getByRole("link", { name: "POS — Ventas" });
  await expect(sidebarPos).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: "e2e-auth.json" });
});
