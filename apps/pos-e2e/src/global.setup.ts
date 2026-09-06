import { test as setup, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { SignJWT, importPKCS8 } from "jose";

// The POS authenticates via a locally-signed license token (EdDSA), not via
// username/password. To make the e2e suite deterministic and offline-first,
// we mint a valid license token using the same private key the admin uses
// (apps/admin-panel/.env -> LICENSE_PRIVATE_KEY) and inject it into the POS
// localStorage before the app boots. initialize() then restores the identity
// from the local token and the POS loads authenticated.

const POS = "http://localhost:1420";
const API_LOGIN = "http://localhost:3000/api/auth/login";

// Dev credentials known from the API seed (apps/api/prisma/seed.ts uses the
// universal "admin123" for admins). The DB may have been seeded either with
// the current seed (admin@arcom.com) or an earlier one (admin@arpos.com), so
// we try both — the first successful login wins.
const API_ADMIN_CREDENTIALS = [
  { email: "admin@arcom.com", password: "admin123" },
  { email: "admin@arpos.com", password: "admin123" },
];

function resolveEnvPath(): string {
  const candidates = [
    "../../admin-panel/.env",
    "apps/admin-panel/.env",
    "admin-panel/.env",
  ];
  for (const rel of candidates) {
    const abs = require.resolve(`./${rel}`).replace(/\\/g, "/");
    if (existsSync(abs)) return abs;
  }
  throw new Error(
    "Could not locate apps/admin-panel/.env from pos-e2e; check the workspace layout",
  );
}

function readEnv(name: string): string {
  const envFile = resolveEnvPath();
  const content = readFileSync(envFile, "utf8");
  const re = new RegExp(`^${name}=("([^"]*)"|([^\\r\\n]*))`, "m");
  const m = content.match(re);
  if (!m) throw new Error(`${name} not found in ${envFile}`);
  return (m[2] ?? m[3]).replace(/\\n/g, "\n");
}

async function mintLicenseToken(privateKeyPem: string): Promise<string> {
  const validFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const privateKey = await importPKCS8(privateKeyPem, "EdDSA");
  return new SignJWT({
    email: "e2e@arcom.test",
    name: "E2E Tester",
    planSlug: "pro",
    planName: "Profesional",
    maxStores: 2,
    features: { reports: true, cloudSync: true, multiStore: true },
    validFrom: validFrom.toISOString(),
    validUntil: validUntil.toISOString(),
  })
    .setProtectedHeader({ alg: "EdDSA" })
    .setIssuer("arcom-admin")
    .setAudience("arcom-pos")
    .setSubject("e2e-sub-001")
    .setIssuedAt()
    .setExpirationTime(validUntil)
    .sign(privateKey);
}

// The data endpoints of the local API (apps/api) are behind their own JWT
// (auth_token, HS256) which the POS now does not mint anymore since auth moved
// to the license flow. Without it every data call returns 401 and the POS
// falls back to "Sin conexión al servidor". Mint it via the real login so the
// whole suite runs against the seeded dev database.
async function getApiAccessToken(): Promise<string> {
  for (const cred of API_ADMIN_CREDENTIALS) {
    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cred),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { access_token?: string };
      if (json.access_token) return json.access_token;
    } catch {
      // API still booting; try next candidate
    }
  }
  throw new Error("Could not obtain an API access_token for the e2e run");
}

setup("authenticate via injected license token and save storage state", async ({
  page,
  context,
}) => {
  const privateKey = readEnv("LICENSE_PRIVATE_KEY");
  const licenseToken = await mintLicenseToken(privateKey);
  const apiToken = await getApiAccessToken();

  // Boot once so the origin exists and origin-scoped localStorage is writable.
  await page.goto(POS);
  await page.waitForTimeout(500);

  // Inject the signed license token AND the API access token before the app
  // re-initializes, then reload so initialize() restores the identity from the
  // local license token (offline) while data calls use the API token (401-free).
  await page.evaluate((t) => localStorage.setItem("arcom_license_token", t), licenseToken);
  await page.evaluate((t) => localStorage.setItem("auth_token", t), apiToken);
  await page.reload();

  // The POS (authenticated) shows the "Carrito" panel once loaded; if auth
  // failed we would instead see the LoginPage (tu@email.com placeholder).
  await expect(page.getByText("Carrito", { exact: true })).toBeVisible({
    timeout: 15000,
  });

// The products grid must be populated and reach the API — otherwise the
  // sale-flow specs start from an empty, offline grid.
  await expect
    .poll(
      async () => {
        const count = await page
          .getByText(/\d+ productos/)
          .textContent()
          .catch(() => "");
        const n = count ? Number(count.match(/\d+/)?.[0] ?? 0) : 0;
        const offline = await page
          .getByText("Sin conexión al servidor")
          .isVisible()
          .catch(() => false);
        return n > 0 && !offline;
      },
      { timeout: 30000 },
    )
    .toBe(true);

  await context.storageState({ path: "e2e-auth.json" });
});
