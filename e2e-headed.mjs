import { chromium } from "playwright";

const BASE_URL = "http://localhost:1420";
const EMAIL = "admin@arcom.com";
const PASSWORD = "admin123";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log("\n🚀 Arcom E2E — slow headed mode\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "es-AR",
    // slowMo adds a delay in ms after each operation
  });

  const page = await context.newPage();

  // 1. Load app
  console.log("📌 Cargando aplicación...");
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await sleep(1500);

  // 2. Login — type slowly
  console.log("📌 Iniciando sesión...");
  await page.click('input[type="email"]');
  await sleep(300);
  await page.type('input[type="email"]', EMAIL, { delay: 80 });
  await sleep(400);
  await page.click('input[type="password"]');
  await sleep(300);
  await page.type('input[type="password"]', PASSWORD, { delay: 80 });
  await sleep(500);
  await page.click('button[type="submit"]');
  await sleep(4000);

  // 3. POS page — look at products
  console.log("📌 POS — explorando productos...");
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(2000);
  // Scroll down slowly through products
  await page.evaluate(() => window.scrollTo(0, 300));
  await sleep(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(2000);

  // 4. Search slowly
  console.log("📌 Buscando 'Remera'...");
  const searchInput = page.locator('[placeholder*="Buscar" i], [placeholder*="escanear" i]');
  if (await searchInput.count() > 0) {
    await searchInput.first().click();
    await sleep(500);
    await searchInput.first().fill("");
    await sleep(300);
    await searchInput.first().pressSequentially("Remera", { delay: 100 });
    await sleep(3000);
    // Clear search
    await searchInput.first().click();
    await sleep(200);
    await searchInput.first().fill("");
    await sleep(1500);
  }

  // 5. Navigate to Products — click sidebar link
  console.log("📌 Navegando a Productos...");
  await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });
  await sleep(3000);
  await page.evaluate(() => window.scrollTo(0, 200));
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  // 6. Inventory
  console.log("📌 Navegando a Inventario...");
  await page.goto(`${BASE_URL}/inventory`, { waitUntil: "networkidle" });
  await sleep(3000);
  await page.evaluate(() => window.scrollTo(0, 300));
  await sleep(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  // 7. Cash Register
  console.log("📌 Navegando a Historial de Caja...");
  await page.goto(`${BASE_URL}/cash-register`, { waitUntil: "networkidle" });
  await sleep(3000);

  // 8. Reports
  console.log("📌 Navegando a Reportes...");
  await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle" });
  await sleep(3000);

  // 9. Settings
  console.log("📌 Navegando a Configuración...");
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  await sleep(3500);

  // 10. Back to POS
  console.log("📌 Volviendo al POS...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await sleep(4000);

  console.log("\n✅ Todos los flujos completados — cerrando navegador en 5s...\n");
  await sleep(5000);
  await browser.close();
})();
