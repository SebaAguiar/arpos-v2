import { chromium } from "playwright";

const BASE_URL = "http://localhost:1420";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-AR",
  });
  const page = await context.newPage();

  // Use slow typing to visualize interactions

  let step = 1;

  // ============================================================
  // STEP 1 — LOGIN
  // ============================================================
  console.log(`\n${step}. LOGIN`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.locator('input[type="email"]').fill("admin@arpos.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator("button:has-text('Iniciar sesión')").click();

  // App doesn't auto-redirect after login; wait for token to be saved, then navigate to root
  await sleep(2000);
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('input[aria-label="Buscar productos o escanear código de barras"]', { timeout: 10000 });
  console.log("   ✓ Logged in as admin@arpos.com");

  // ============================================================
  // STEP 2 — OPEN CASH REGISTER
  // ============================================================
  step++;
  console.log(`\n${step}. CASH REGISTER — OPEN SHIFT`);

  // Close any existing shift first (from previous runs), then open a new one
  {
    const closeBtn = page.locator("header button", { hasText: "Cerrar caja" });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await sleep(600);
      await page.locator('input:focus').fill("1500");
      await sleep(200);
      await page.locator("button:has-text('Cerrar caja')").last().click();
      await sleep(1000);
      await page.mouse.click(5, 5);
      await sleep(500);
    }
  }

  // Click "Abrir caja" in the header
  await page.locator("header button", { hasText: "Abrir caja" }).click();
  await sleep(600);

  // CashShiftDialog — "Monto inicial" confirms it's open
  await page.locator('text="Monto inicial"').waitFor({ state: "visible", timeout: 5000 });
  await page.locator('input:focus').fill("1500");
  await sleep(300);

  // Click "Abrir caja" inside dialog
  await page.locator("button:has-text('Abrir caja')").last().click();
  await sleep(1000);

  // Close the cash shift dialog by clicking backdrop
  await page.mouse.click(5, 5);
  await sleep(500);
  console.log("   ✓ Shift opened with $1,500 initial");

  // ============================================================
  // STEP 3 — ADD SINGLE-VARIANT PRODUCT (Cinturón Cuero)
  // ============================================================
  step++;
  console.log(`\n${step}. ADD SINGLE-VARIANT PRODUCT`);

  // Search for the product first to narrow results
  const searchInput = page.locator(
    'input[aria-label="Buscar productos o escanear código de barras"]'
  );
  await searchInput.fill("Cinturón");
  await sleep(400);

  // Click the product card
  const cinturonCard = page.locator(
    'button[aria-label="Agregar Cinturón Cuero al carrito"]'
  );
  await cinturonCard.waitFor({ state: "visible", timeout: 5000 });
  await cinturonCard.click();
  await sleep(500);

  // Clear search
  await searchInput.fill("");
  await sleep(300);
  console.log("   ✓ Cinturón Cuero added to cart");

  // ============================================================
  // STEP 4 — ADD MULTI-VARIANT PRODUCT (Remera Básica → XS)
  // ============================================================
  step++;
  console.log(`\n${step}. ADD MULTI-VARIANT PRODUCT`);

  await searchInput.fill("Remera Básica");
  await sleep(400);

  const remeraCard = page.locator(
    'button[aria-label="Agregar Remera Básica al carrito"]'
  );
  await remeraCard.waitFor({ state: "visible", timeout: 5000 });
  await remeraCard.click();
  await sleep(500);

  // Wait for the dialog overlay to appear
  await sleep(1000);

  // VariantSelectionDialog — the backdrop div has role="dialog"
  const variantDialog = page.locator("div[role='dialog']");
  await variantDialog.waitFor({ state: "visible", timeout: 3000 });

  // Find a variant button (e.g., size "S" Blanco) and click it
  await variantDialog.locator("button:not([disabled])").first().click();
  await sleep(500);

  await searchInput.fill("");
  await sleep(300);
  console.log("   ✓ Remera Básica (S/Blanco) added to cart");

  // ============================================================
  // STEP 5 — SELECT / CREATE CUSTOMER
  // ============================================================
  step++;
  console.log(`\n${step}. SELECT CUSTOMER`);

  // Click the customer button in the cart header (or SummaryPanel)
  const customerBtn = page.locator(
    'button[aria-label="Seleccionar o cambiar cliente"]'
  );
  await customerBtn.waitFor({ state: "visible", timeout: 3000 });
  await customerBtn.click();
  await sleep(600);

  // CustomerSelectionDialog appears as plain overlay
  await page.locator("button:has-text('Crear nuevo cliente')").waitFor({ state: "visible", timeout: 3000 });

  // Click "Crear nuevo cliente"
  await page.locator("button:has-text('Crear nuevo cliente')").click();
  await sleep(300);

  // Fill form
  await page.locator('input[placeholder="Nombre *"]').fill("Juan Pérez");
  await page.locator('input[placeholder="Email (opcional)"]').fill("juan@example.com");
  await page.locator('input[placeholder="Teléfono (opcional)"]').fill("555-1234");
  await sleep(300);

  // Click "Crear" (second button in the create form area)
  await page.locator("button:has-text('Crear')").last().click();
  await sleep(800);
  console.log("   ✓ Customer 'Juan Pérez' created and selected");

  // ============================================================
  // STEP 6 — APPLY DISCOUNT
  // ============================================================
  step++;
  console.log(`\n${step}. APPLY DISCOUNT`);

  // The discount TextField.Root in SummaryPanel
  // It's an input[type="number"] inside the SummaryPanel area
  // There are multiple number inputs now — find the one in SummaryPanel
  // The SummaryPanel is in the right sidebar (width: 360px)
  const cartPanel = page.locator("div[style*='width: 360px']");
  const discountNumberInput = cartPanel.locator('input[type="number"]').first();

  // Clear and type "10"
  await discountNumberInput.click();
  await discountNumberInput.fill("10");
  await sleep(300);
  console.log("   ✓ 10% discount applied");

  // ============================================================
  // STEP 7 — PROCESS PAYMENT
  // ============================================================
  step++;
  console.log(`\n${step}. PROCESS PAYMENT`);

  // Click "Cobrar" button
  const cobrarBtn = cartPanel.locator("button:has-text('Cobrar')");
  await cobrarBtn.waitFor({ state: "visible", timeout: 3000 });
  await cobrarBtn.click();
  await sleep(800);

  // PaymentDialog appears as plain overlay — wait for "Total a pagar"
  await page.locator("text=Total a pagar").waitFor({ state: "visible", timeout: 3000 });

  // Click the green "Exacto" button
  await page.locator("button:has-text('Exacto')").waitFor({ state: "visible", timeout: 3000 });
  await page.locator("button:has-text('Exacto')").click();
  await sleep(500);

  // Click "Confirmar venta"
  await page.locator("button:has-text('Confirmar venta')").waitFor({ state: "visible", timeout: 3000 });
  await page.locator("button:has-text('Confirmar venta')").click();
  await sleep(2000);
  console.log("   ✓ Payment confirmed");

  // ============================================================
  // STEP 8 — VERIFY SALE SUCCESS
  // ============================================================
  step++;
  console.log(`\n${step}. VERIFY SALE SUCCESS`);

  // SaleSuccessDialog shows "Venta Procesada"
  await page.locator("text=Venta Procesada").waitFor({ state: "visible", timeout: 5000 });
  console.log("   ✓ Sale processed successfully! (Venta Procesada visible)");

  // Close with "Nueva Venta (Esc)" button
  await page.locator("button:has-text('Nueva Venta')").click();
  await sleep(800);
  console.log("   ✓ Success dialog closed, ready for next sale");

  // ============================================================
  // STEP 9 — CREATE A PRODUCT
  // ============================================================
  step++;
  console.log(`\n${step}. CREATE PRODUCT`);

  await page.goto(`${BASE_URL}/products-management`, { waitUntil: "networkidle" });
  await sleep(800);

  // Click "Nuevo producto" button
  const nuevoBtn = page.locator("button:has-text('Nuevo producto')");
  await nuevoBtn.waitFor({ state: "visible", timeout: 5000 });
  await nuevoBtn.click();
  await sleep(500);

  // Now on form tab — fill fields
  // Name
  const nameInput = page.locator('input[placeholder="Nombre *"]');
  await nameInput.waitFor({ state: "visible", timeout: 3000 });
  await nameInput.fill("Zapatilla Deportiva Test");

  // Internal code
  await page.locator('input[placeholder="Código interno"]').fill("ZAP-TEST-001");

  // Description
  await page.locator('input[placeholder="Descripción"]').fill("Creada por test E2E automatizado");

  // Category
  await page.locator('input[placeholder="Categoría"]').fill("Calzado");

  // Price — fill cost first (2000), then margin (50), auto-calculates price
  const costInput = page.locator('input[type="number"]').nth(0);
  await costInput.fill("2000");
  await sleep(200);

  const marginInput = page.locator('input[type="number"]').nth(1);
  await marginInput.fill("50");
  await sleep(200);

  // Click "Crear producto"
  await page.locator("button:has-text('Crear producto')").last().click();
  await sleep(1500);

  // Should be back on list tab
  console.log("   ✓ Product 'Zapatilla Deportiva Test' created");

  // ============================================================
  // STEP 10 — EDIT THE PRODUCT
  // ============================================================
  step++;
  console.log(`\n${step}. EDIT PRODUCT`);

  // Navigate to POS page to trigger product fetch (SPA nav preserves Zustand store)
  await page.locator('aside a:has-text("POS")').first().click();
  await sleep(1000);
  // Navigate back to products-management (store now has products)
  await page.locator('aside a:has-text("Productos")').first().click();
  await sleep(1000);

  // Now we should be on the list tab with products loaded
  // Search
  await page.locator('input[placeholder="Buscar producto..."]').first().fill("Zapatilla");
  await sleep(800);

  // Click the edit button for "Zapatilla Deportiva Test"
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.includes("Zapatilla Deportiva Test")) {
        let el = node.parentElement;
        while (el) {
          const btns = el.querySelectorAll("button");
          if (btns.length >= 3 && btns[0].querySelector("svg")) {
            btns[0].click();
            return;
          }
          el = el.parentElement;
        }
      }
    }
  });
  await sleep(800);

  // Edit the name — add "(Editado)" suffix
  const editNameInput = page.locator('input[placeholder="Nombre *"]').first();
  await editNameInput.fill("Zapatilla Deportiva Test (Editada)");
  await sleep(200);

  // Change price
  const editPriceInput = page.locator('input[type="number"]').nth(2);
  await editPriceInput.fill("3500");
  await sleep(200);

  // Save
  await page.locator("button:has-text('Guardar cambios')").last().click();
  await sleep(1500);
  console.log("   ✓ Product edited (renamed + price changed)");

  // ============================================================
  // STEP 11 — ADJUST STOCK
  // ============================================================
  step++;
  console.log(`\n${step}. ADJUST STOCK`);

  await page.goto(`${BASE_URL}/inventory`, { waitUntil: "networkidle" });
  await sleep(1000);

  // Click "Nuevo movimiento"
  const newMovBtn = page.locator("button:has-text('Nuevo movimiento')");
  await newMovBtn.waitFor({ state: "visible", timeout: 5000 });
  await newMovBtn.click();
  await sleep(600);

  // StockAdjustmentDialog is open as plain overlay
  await page.locator("text=Registrar movimiento").waitFor({ state: "visible", timeout: 3000 });

  // Click the product Select trigger (Radix UI)
  await page.locator("button:has-text('Seleccionar producto')").click();
  await sleep(500);

  // Radix Select portal — find the option with "ZAP-TEST-001"
  const option = page.locator("div[role='option'], [data-radix-select-item]", { hasText: "ZAP-TEST-001" }).first();
  await option.waitFor({ state: "visible", timeout: 3000 });
  await option.click();
  await sleep(400);

  // Fill quantity
  await page.locator('input[type="number"]').first().fill("15");
  await sleep(200);

  // Fill reason
  await page.locator('input[placeholder*="Ej:"]').fill("Stock inicial por test E2E");
  await sleep(200);

  // Click "Registrar"
  await page.locator("button:has-text('Registrar')").last().click();
  await sleep(1500);
  console.log("   ✓ Stock movement: +15 units registered");

  // ============================================================
  // STEP 12 — CLOSE CASH REGISTER
  // ============================================================
  step++;
  console.log(`\n${step}. CLOSE CASH REGISTER`);

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await sleep(800);

  // Click "Cerrar caja" in header
  const headerCloseBtn = page.locator("header button", { hasText: "Cerrar caja" });
  await headerCloseBtn.waitFor({ state: "visible", timeout: 5000 });
  await headerCloseBtn.click();
  await sleep(600);

  // CashShiftDialog shows close state — "Monto final en caja"
  await page.locator('text="Monto final en caja"').waitFor({ state: "visible", timeout: 3000 });

  // Fill final amount (focused input)
  await page.locator('input:focus').fill("1200");
  await sleep(300);

  // Click "Cerrar caja" button inside dialog
  await page.locator("button:has-text('Cerrar caja')").last().click();
  await sleep(1500);

  // Close the dialog (it stays open after closing shift)
  await page.mouse.click(5, 5);
  await sleep(500);
  console.log("   ✓ Cash register closed");

  // ============================================================
  // STEP 13 — LOGOUT
  // ============================================================
  step++;
  console.log(`\n${step}. LOGOUT`);

  // Click the user avatar in header (DropdownMenu.Trigger)
  // Use force click since it might be covered by Radix backdrop
  await page.locator("header button:has(span[class*='AvatarFallback'])").click({ force: true });
  await sleep(800);

  // The Radix portal renders content in body outside #root
  // Click "Cerrar sesión" menuitem via evaluate (pure JS, no TS cast)
  await page.evaluate(() => {
    const items = document.querySelectorAll('[role="menuitem"]');
    for (const item of items) {
      if (item.textContent && item.textContent.includes("Cerrar sesión")) {
        item.click();
        break;
      }
    }
  });
  await sleep(1500);

  // Logout only clears auth token — ProtectedRoute renders LoginPage at same URL
  // Verify login form appeared
  await page.locator('button:has-text("Iniciar sesión")').waitFor({ state: "visible", timeout: 5000 });
  console.log("   ✓ Logged out, login form visible");

  // ============================================================
  console.log("\n✅ ALL 13 STEPS COMPLETED SUCCESSFULLY");

  await sleep(3000);
  await browser.close();
})();
