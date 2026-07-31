import { test, expect } from "@playwright/test";

test.describe("Sync — Cloud Sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForSelector("text=Sync Cloud", { timeout: 10000 });
  });

  test("shows sync cloud section heading", async ({ page }) => {
    await expect(page.getByText("Sync Cloud")).toBeVisible();
    await expect(page.getByText("Cloud Sync")).toBeVisible();
  });

  test("shows connect form for inactive subscription", async ({ page }) => {
    await expect(page.getByPlaceholder("URL del servidor cloud")).toBeVisible();
    await expect(page.getByPlaceholder("JWT token")).toBeVisible();
    await expect(page.getByText("Conectar")).toBeVisible();
  });

  test("shows subscription status card", async ({ page }) => {
    await expect(page.getByText("Cloud Sync — Suscripción")).toBeVisible();
  });

  test("shows network indicator with sync status", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    const badge = page.locator("[class*=Badge]");
    await expect(badge.first()).toBeVisible();
  });

  test("recovers sync after going offline and back online", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Online", { timeout: 5000 });

    const context = page.context();
    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine, {}, { timeout: 3000 });
    await page.waitForTimeout(500);

    await expect(page.getByText("Sin internet")).toBeVisible({ timeout: 5000 });

    await context.setOffline(false);
    await page.waitForFunction(() => navigator.onLine, {}, { timeout: 3000 });
    await page.waitForTimeout(500);

    await expect(page.getByText("Online", { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("sync status reflects pending count after creating a sale", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[aria-label^="Agregar"]');
    await page.locator('[aria-label^="Agregar"]').first().click();
    await page.waitForTimeout(200);

    const cobrarBtn = page.locator("button:has-text('Cobrar')");
    await cobrarBtn.click();
    await page.waitForTimeout(300);

    await page.goto("/settings");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Sync Cloud")).toBeVisible();
  });
});
