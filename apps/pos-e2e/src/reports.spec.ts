import { test, expect } from "@playwright/test";

test.describe("Reportes", () => {
  test("renders reports page with title", async ({ page }) => {
    await page.goto("/reports");

    await expect(page.getByText("Reportes", { exact: true })).toBeVisible();
  });

  test("tab navigation works", async ({ page }) => {
    await page.goto("/reports");

    const tabs = page.getByRole("tablist").first().getByRole("tab");
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(200);
    }
  });
});
