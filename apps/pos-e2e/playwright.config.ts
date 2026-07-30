import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src",
  timeout: 45000,
  retries: 1,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:1420",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: "chromium",
      use: { browserName: "chromium", storageState: "e2e-auth.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "pnpm dev:api",
      port: 3000,
      timeout: 30000,
      reuseExistingServer: true,
    },
    {
      command: "pnpm dev:pos",
      port: 1420,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
