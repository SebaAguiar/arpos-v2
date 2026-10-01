import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH =
  "/home/seba/.cache/hyperframes/chrome/chrome-headless-shell/linux-152.0.7977.30/chrome-headless-shell-linux64/chrome-headless-shell";

const OUT_DIR =
  "/home/seba/Documentos/Trabajo/arsian/arpos-v2/videos/arcom-landing-demo/assets/screens";
const PUBLIC_DIR =
  "/home/seba/Documentos/Trabajo/arsian/arpos-v2/apps/marketing-landing/public/screenshots";

const PRODUCTS = [
  {
    id: "prod-1",
    name: "Bermuda Cargo Ripstop",
    description: "Gabardina pesada reforzada",
    price: 24900,
    cost: 11500,
    category: "Pantalones",
    internalCode: "BER-001",
    stockQuantity: 42,
  },
  {
    id: "prod-2",
    name: "Remera Básica Algodón",
    description: "100% Algodón peinado 24/1",
    price: 8500,
    cost: 3200,
    category: "Remeras",
    internalCode: "REM-001",
    stockQuantity: 110,
  },
  {
    id: "prod-3",
    name: "Campera Puffer Liviana",
    description: "Térmica ultra liviana impermeable",
    price: 68000,
    cost: 31000,
    category: "Camperas",
    internalCode: "CMP-001",
    stockQuantity: 18,
  },
  {
    id: "prod-4",
    name: "Camisa Lino Cuello Mao",
    description: "Lino lavado suave entallado",
    price: 32500,
    cost: 14000,
    category: "Camisas",
    internalCode: "CMS-001",
    stockQuantity: 28,
  },
  {
    id: "prod-5",
    name: "Pantalón Chino Slim",
    description: "Gabardina con spandex elastizada",
    price: 36000,
    cost: 16500,
    category: "Pantalones",
    internalCode: "PAN-001",
    stockQuantity: 35,
  },
  {
    id: "prod-6",
    name: "Buzo Hoodie Oversize",
    description: "Frisa pesada con capucha",
    price: 44000,
    cost: 19800,
    category: "Buzos",
    internalCode: "BUZ-001",
    stockQuantity: 24,
  },
  {
    id: "prod-7",
    name: "Gorra Trucker Bordada",
    description: "Frente estructurado y malla",
    price: 12000,
    cost: 4500,
    category: "Accesorios",
    internalCode: "GOR-001",
    stockQuantity: 65,
  },
  {
    id: "prod-8",
    name: "Zapatillas Urban Canvas",
    description: "Suela caucho vulcanizado",
    price: 58000,
    cost: 26000,
    category: "Calzado",
    internalCode: "ZAP-001",
    stockQuantity: 19,
  },
  {
    id: "prod-9",
    name: "Cinturón Cuero Vacuno",
    description: "Cuero genuino 35mm",
    price: 16500,
    cost: 6800,
    category: "Accesorios",
    internalCode: "CIN-001",
    stockQuantity: 44,
  },
  {
    id: "prod-10",
    name: "Medias Algodón Pack x3",
    description: "Algodón invisible con silicona",
    price: 6500,
    cost: 2100,
    category: "Accesorios",
    internalCode: "MED-001",
    stockQuantity: 150,
  },
  {
    id: "prod-11",
    name: "Mochila Cordura Porta PC",
    description: "Compartimento acolchado 15.6\"",
    price: 52000,
    cost: 23000,
    category: "Accesorios",
    internalCode: "MOC-001",
    stockQuantity: 15,
  },
  {
    id: "prod-12",
    name: "Billetera Cuero Minimal",
    description: "Protección RFID compacta",
    price: 19000,
    cost: 7500,
    category: "Accesorios",
    internalCode: "BIL-001",
    stockQuantity: 38,
  },
];

const API_PRODUCTS = PRODUCTS.map((p) => ({
  id: p.id,
  companyId: "c1",
  storeId: "s1",
  code: p.internalCode,
  name: p.name,
  description: p.description,
  price_cents: p.price * 100,
  cost_cents: p.cost * 100,
  stock_quantity: p.stockQuantity,
  sku: p.internalCode,
  category_id: p.category,
  metadata: null,
  is_active: true,
  created_at: Date.now(),
  updated_at: Date.now(),
  inventory: [
    {
      id: "inv-" + p.id,
      companyId: "c1",
      storeId: "s1",
      productId: p.id,
      variantId: null,
      quantity: p.stockQuantity,
      min_stock: 5,
      max_stock: 200,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ],
  variants: [],
}));

// Build realistic past sales for reports (past 30 days)
const nowSec = Math.floor(Date.now() / 1000);
const daySec = 86400;
const API_SALES = [];
for (let d = 29; d >= 0; d--) {
  const dayTime = nowSec - d * daySec;
  // Vary daily sales volume realistically
  const count = 5 + Math.floor(Math.abs(Math.sin(d * 0.7)) * 8);
  for (let i = 0; i < count; i++) {
    const p = PRODUCTS[(d + i) % PRODUCTS.length];
    API_SALES.push({
      id: `sale-${d}-${i}`,
      companyId: "c1",
      storeId: "s1",
      cash_register_id: "cr1",
      user_id: "u1",
      contact_id: null,
      ticket_number: 1000 + API_SALES.length,
      total_cents: p.price * 100,
      discount_cents: 0,
      tax_cents: Math.floor(p.price * 21),
      status: "completed",
      payment_method: ["EFECTIVO", "DEBITO", "CREDITO", "QR"][i % 4],
      payment_details: null,
      notes: null,
      synced_at: dayTime + 10,
      created_at: dayTime + (i * 1800 + 36000), // during store hours
      updated_at: dayTime + (i * 1800 + 36000),
      items: [
        {
          id: `item-${d}-${i}`,
          saleId: `sale-${d}-${i}`,
          productId: p.id,
          name: p.name,
          quantity: 1,
          unit_price_cents: p.price * 100,
          total_cents: p.price * 100,
          discount_cents: 0,
          product: { id: p.id, name: p.name, code: p.internalCode },
        },
      ],
      user: { id: "u1", name: "Seba Aguiar", email: "seba@arcom.test" },
    });
  }
}

const totalRevenueCents = API_SALES.reduce((sum, s) => sum + s.total_cents, 0);

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await context.addInitScript(() => {
    localStorage.setItem("arcom-theme", "arcom");
    localStorage.setItem("auth_token", "demo-token");
    localStorage.setItem(
      "arcom_license",
      JSON.stringify({
        client: { id: "u1", name: "Seba Aguiar", email: "seba@arcom.test" },
        plan: { name: "Profesional", slug: "pro", features: {}, maxStores: 2 },
        subscription: {
          id: "sub_1",
          status: "active",
          renewalDate: null,
          startDate: "2026-01-01",
        },
      })
    );
  });

  let currentSyncState = "synced"; // "synced" | "offline" | "syncing"

  const page = await context.newPage();

  // Unified deterministic API dispatcher
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.port === "3000") {
      const p = url.pathname;
      if (p.endsWith("/health")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ backend: true }),
        });
      }
      if (p.endsWith("/setup/status")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ isInitialized: true }),
        });
      }
      if (p.endsWith("/auth/me")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "u1",
            name: "Seba Aguiar",
            email: "seba@arcom.test",
            role: "admin",
          }),
        });
      }
      if (p.endsWith("/sync/status")) {
        if (currentSyncState === "offline") {
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "offline" }),
          });
        }
        if (currentSyncState === "syncing") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              pending: 3,
              synced: 142,
              error: 0,
              lastSyncedAt: nowSec - 200,
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            pending: 0,
            synced: 142,
            error: 0,
            lastSyncedAt: nowSec - 60,
          }),
        });
      }
      if (p.endsWith("/products")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(API_PRODUCTS),
        });
      }
      if (p.endsWith("/stores")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "s1", name: "Sucursal Central", address: "Av. Corrientes 1234" },
          ]),
        });
      }
      if (p.endsWith("/company")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "c1",
            name: "Arcom POS",
            rut: "30-71234567-9",
            address: "Av. Corrientes 1234",
            phone: "011 4567-8900",
            email: "contacto@arcom.ar",
          }),
        });
      }
      if (p.includes("/cash-registers")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "cr1",
              name: "Caja Principal",
              status: "open",
              opened_at: nowSec - 14400,
              opening_amount: 5000000,
              total_sales_cents: 14200000,
              income_cents: 0,
              expense_cents: 0,
              movement_count: 18,
              payment_summary: [
                { payment_method: "EFECTIVO", total_cents: 6200000, count: 8 },
                { payment_method: "DEBITO", total_cents: 5100000, count: 6 },
                { payment_method: "QR", total_cents: 2900000, count: 4 },
              ],
            },
          ]),
        });
      }
      if (p.includes("/sales/stats")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalSales: API_SALES.length,
            totalRevenue: totalRevenueCents,
            averageTicket: Math.round(totalRevenueCents / API_SALES.length),
          }),
        });
      }
      if (p.includes("/sales/by-payment-method")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { payment_method: "EFECTIVO", total_cents: Math.round(totalRevenueCents * 0.4), count: 95 },
            { payment_method: "DEBITO", total_cents: Math.round(totalRevenueCents * 0.3), count: 72 },
            { payment_method: "CREDITO", total_cents: Math.round(totalRevenueCents * 0.2), count: 48 },
            { payment_method: "QR", total_cents: Math.round(totalRevenueCents * 0.1), count: 24 },
          ]),
        });
      }
      if (p.includes("/sales/top-products")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              productId: "prod-1",
              productName: "Bermuda Cargo Ripstop",
              productCode: "BER-001",
              total_cents: 99600000,
              quantity: 40,
            },
            {
              productId: "prod-2",
              productName: "Remera Básica Algodón",
              productCode: "REM-001",
              total_cents: 85000000,
              quantity: 100,
            },
            {
              productId: "prod-3",
              productName: "Campera Puffer Liviana",
              productCode: "CMP-001",
              total_cents: 81600000,
              quantity: 12,
            },
            {
              productId: "prod-4",
              productName: "Camisa Lino Cuello Mao",
              productCode: "CMS-001",
              total_cents: 78000000,
              quantity: 24,
            },
            {
              productId: "prod-5",
              productName: "Pantalón Chino Slim",
              productCode: "PAN-001",
              total_cents: 72000000,
              quantity: 20,
            },
          ]),
        });
      }
      if (p.includes("/sales")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(API_SALES),
        });
      }
      if (p.includes("/inventory/report")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            totalProducts: 142,
            totalStockValueCents: 450000000,
            lowStockCount: 4,
            outOfStockCount: 1,
            byCategory: [
              { category: "Pantalones", count: 35, value: 120000000 },
              { category: "Remeras", count: 48, value: 85000000 },
              { category: "Camperas", count: 24, value: 140000000 },
              { category: "Accesorios", count: 35, value: 105000000 },
            ],
            lowStockProducts: [
              {
                productId: "prod-3",
                productName: "Campera Puffer Liviana",
                productCode: "CMP-001",
                stockQuantity: 2,
                cost: 31000,
                price: 68000,
              },
            ],
            outOfStockProducts: [],
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    }
    return route.continue();
  });

  // Helper to ensure brand license badge looks polished
  async function polishHeaderBadges(mode = "synced") {
    await page.evaluate((mode) => {
      // Find all badges in header
      const badges = Array.from(document.querySelectorAll(".rt-Badge, [class*=\"rt-Badge\"]"));
      
      // 1. License badge
      const licBadge = badges.find((b) =>
        b.textContent.toLowerCase().includes("licencia")
      );
      if (licBadge) {
        licBadge.textContent = "Licencia OK · 30d";
        licBadge.style.color = "#396a43";
        licBadge.style.backgroundColor = "rgba(57, 106, 67, 0.12)";
      }

      // 2. Network badge
      const netBadge = badges.find(
        (b) =>
          b.textContent.toLowerCase().includes("sincron") ||
          b.textContent.toLowerCase().includes("offline") ||
          b.textContent.toLowerCase().includes("conexión") ||
          b.textContent.toLowerCase().includes("sync")
      );
      if (netBadge) {
        if (mode === "offline") {
          netBadge.textContent = "Modo offline";
          netBadge.style.color = "#7d5b17";
          netBadge.style.backgroundColor = "rgba(125, 91, 23, 0.14)";
        } else if (mode === "syncing") {
          netBadge.textContent = "Sincronizando...";
          netBadge.style.color = "#3f6288";
          netBadge.style.backgroundColor = "rgba(63, 98, 136, 0.14)";
        } else {
          netBadge.textContent = "Sincronizado";
          netBadge.style.color = "#396a43";
          netBadge.style.backgroundColor = "rgba(57, 106, 67, 0.12)";
        }
      }
    }, mode);
  }

  // 1. CAPTURE POS NORMAL (pos-light.png)
  console.log("Navigating to POS...");
  currentSyncState = "synced";
  await page.goto("http://localhost:4173/");
  await page.waitForSelector(".product-card");

  // Click first card ("Bermuda Cargo Ripstop")
  await page.locator(".product-card").first().click();
  await page.waitForTimeout(400);

  // Click second card ("Remera Básica Algodón") twice
  await page.locator(".product-card").nth(1).click();
  await page.waitForTimeout(400);
  await page.locator(".product-card").nth(1).click();
  await page.waitForTimeout(500);

  await polishHeaderBadges("synced");
  await page.waitForTimeout(300);

  const posLightPath = path.join(OUT_DIR, "pos-light.png");
  await page.screenshot({ path: posLightPath });
  console.log("Saved:", posLightPath);
  fs.copyFileSync(posLightPath, path.join(PUBLIC_DIR, "pos-light.png"));

  // 2. CAPTURE POS OFFLINE (pos-offline-light.png)
  console.log("Capturing pos-offline-light...");
  await polishHeaderBadges("offline");
  await page.waitForTimeout(300);

  const posOfflinePath = path.join(OUT_DIR, "pos-offline-light.png");
  await page.screenshot({ path: posOfflinePath });
  console.log("Saved:", posOfflinePath);
  fs.copyFileSync(posOfflinePath, path.join(PUBLIC_DIR, "pos-offline-light.png"));

  // 3. CAPTURE POS SYNC (pos-sync-light.png)
  console.log("Capturing pos-sync-light...");
  await polishHeaderBadges("syncing");
  await page.waitForTimeout(300);

  const posSyncPath = path.join(OUT_DIR, "pos-sync-light.png");
  await page.screenshot({ path: posSyncPath });
  console.log("Saved:", posSyncPath);
  fs.copyFileSync(posSyncPath, path.join(PUBLIC_DIR, "pos-sync-light.png"));

  // 4. CAPTURE DASHBOARD / REPORTS (dashboard-light.png)
  console.log("Navigating to /reports...");
  await page.goto("http://localhost:4173/reports");
  await page.waitForTimeout(2000);
  await polishHeaderBadges("synced");
  await page.waitForTimeout(500);

  const dashboardPath = path.join(OUT_DIR, "dashboard-light.png");
  await page.screenshot({ path: dashboardPath });
  console.log("Saved:", dashboardPath);
  fs.copyFileSync(dashboardPath, path.join(PUBLIC_DIR, "dashboard-light.png"));
  fs.copyFileSync(dashboardPath, path.join(OUT_DIR, "reports-light.png"));
  fs.copyFileSync(dashboardPath, path.join(PUBLIC_DIR, "reports-light.png"));

  await browser.close();
  console.log("All 4 screens successfully generated in authentic arcom brand theme!");
}

run().catch((err) => {
  console.error("Capture script failed:", err);
  process.exit(1);
});
