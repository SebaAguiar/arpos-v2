import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const now = Math.floor(Date.now() / 1000);
const SEED_TAG = 'seed-demo';
const TAX_RATE_BPS = 2100;

const COMPANY_TAX_ID = '20-12345678-9';
const COMPANY_NAME = 'Arcon Demo';
const STORE_NAME = 'Sucursal Principal';
const ADMIN_EMAIL = 'admin@arcon.com';
const CASH_REGISTER_NAME = 'Caja Principal';

const ENV_PATH = path.resolve(process.cwd(), '.env');

// ── Helpers ────────────────────────────────────────────

function epochAt(daysAgo: number, hour: number, minute: number): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function epochRandomDayHour(daysAgo: number): number {
  const currentHour = new Date().getHours();
  const maxAllowedHour = daysAgo === 0 ? Math.max(8, Math.min(currentHour, 20)) : 21;
  const minAllowedHour = 8;

  if (maxAllowedHour <= minAllowedHour) {
    return epochAt(daysAgo, minAllowedHour, Math.floor(Math.random() * 60));
  }

  const roll = Math.random();
  let hour: number;
  if (roll < 0.25) {
    hour = 8 + Math.floor(Math.random() * 4); // 08:00 - 11:59
  } else if (roll < 0.55) {
    hour = 12 + Math.floor(Math.random() * 3); // 12:00 - 14:59
  } else if (roll < 0.75) {
    hour = 15 + Math.floor(Math.random() * 3); // 15:00 - 17:59
  } else {
    hour = 18 + Math.floor(Math.random() * 4); // 18:00 - 21:59
  }

  const clampedHour = Math.min(hour, maxAllowedHour);
  const minute = Math.floor(Math.random() * 60);
  return epochAt(daysAgo, clampedHour, minute);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeTicketCounter(): (ts: number) => number {
  const byDay = new Map<string, number>();
  return (ts: number): number => {
    const day = new Date(ts * 1000).toISOString().slice(0, 10);
    const next = (byDay.get(day) ?? 0) + 1;
    byDay.set(day, next);
    return next;
  };
}

function setEnvValue(key: string, value: string): boolean {
  if (!fs.existsSync(ENV_PATH)) return false;
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (idx === -1) return false;
  lines[idx] = `${key}="${value}"`;
  fs.writeFileSync(ENV_PATH, lines.join('\n'));
  process.env[key] = value;
  return true;
}

async function getOrCreateCompany(): Promise<string> {
  const envCompanyId = process.env.LOCAL_COMPANY_ID;
  if (envCompanyId) {
    const existing = await prisma.company.findUnique({ where: { id: envCompanyId } });
    if (existing) return existing.id;
  }

  const byTaxId = await prisma.company.findUnique({ where: { taxId: COMPANY_TAX_ID } });
  if (byTaxId) return byTaxId.id;

  const anyCompany = await prisma.company.findFirst();
  if (anyCompany) return anyCompany.id;

  const created = await prisma.company.create({
    data: {
      id: envCompanyId || undefined,
      name: COMPANY_NAME,
      taxId: COMPANY_TAX_ID,
      email: 'demo@arcon.com',
      phone: '+54 11 1234-5678',
      address: 'Av. Demo 1234, CABA',
      created_at: now,
      updated_at: now,
    },
  });
  return created.id;
}

async function getOrCreateStore(companyId: string): Promise<string> {
  const envStoreId = process.env.LOCAL_STORE_ID;
  if (envStoreId) {
    const existing = await prisma.store.findUnique({ where: { id: envStoreId } });
    if (existing) return existing.id;
  }

  const byName = await prisma.store.findFirst({ where: { companyId, name: STORE_NAME } });
  if (byName) return byName.id;

  const created = await prisma.store.create({
    data: {
      companyId,
      name: STORE_NAME,
      address: 'Av. Demo 1234, CABA',
      created_at: now,
      updated_at: now,
    },
  });
  return created.id;
}

interface ProductSeed {
  code: string;
  name: string;
  description: string;
  price_cents: number;
  cost_cents: number;
  stock_quantity: number;
  category_id: string;
  sku: string;
  min_stock: number;
  max_stock: number;
  variants?: string[];
}

const PRODUCTS: ProductSeed[] = [
  { code: 'REM001', name: 'Remera Básica Algodón', description: 'Algodón peinado 24/1, corte clásico, talle amplio.', price_cents: 250000, cost_cents: 120000, stock_quantity: 250, category_id: 'remeras', sku: 'REM-BAS-001', min_stock: 15, max_stock: 300, variants: ['S', 'M', 'L', 'XL'] },
  { code: 'REM002', name: 'Remera Polo', description: 'Piqué frisado, cuello con botones, ideal oficina.', price_cents: 450000, cost_cents: 220000, stock_quantity: 200, category_id: 'remeras', sku: 'REM-POL-002', min_stock: 12, max_stock: 250, variants: ['S', 'M', 'L', 'XL'] },
  { code: 'REM003', name: 'Remera Manga Larga', description: 'Rib liso, puños elastizados, abrigo liviano.', price_cents: 320000, cost_cents: 150000, stock_quantity: 180, category_id: 'remeras', sku: 'REM-MLG-003', min_stock: 10, max_stock: 200, variants: ['S', 'M', 'L', 'XL'] },
  { code: 'JNS001', name: 'Jeans Clásico Straight', description: 'Denim 12 oz, corte recto, lavado medio.', price_cents: 890000, cost_cents: 400000, stock_quantity: 150, category_id: 'pantalones', sku: 'JNS-STR-001', min_stock: 10, max_stock: 150 },
  { code: 'JNS002', name: 'Jeans Slim Fit', description: 'Denim con elastano, tiro medio, ajuste slim.', price_cents: 950000, cost_cents: 420000, stock_quantity: 140, category_id: 'pantalones', sku: 'JNS-SLM-002', min_stock: 10, max_stock: 150 },
  { code: 'BER001', name: 'Bermuda Cargo', description: 'Pie de soldado, bolsillos cargo, corte urbano.', price_cents: 650000, cost_cents: 300000, stock_quantity: 160, category_id: 'pantalones', sku: 'BER-CRG-001', min_stock: 12, max_stock: 200 },
  { code: 'CMP001', name: 'Campera Slim Forro Polar', description: 'Exterior de nylon matte, forro polar desmontable.', price_cents: 2200000, cost_cents: 900000, stock_quantity: 90, category_id: 'camperas', sku: 'CMP-SLM-001', min_stock: 5, max_stock: 100 },
  { code: 'CMP002', name: 'Campera Puffer Liviana', description: 'Puffer ultraliviano, relleno sintético, comprimible.', price_cents: 1800000, cost_cents: 750000, stock_quantity: 110, category_id: 'camperas', sku: 'CMP-PFF-002', min_stock: 5, max_stock: 120 },
  { code: 'ZAP001', name: 'Zapatillas Run Max', description: 'Runner con amortiguación de espuma, malla transpirable.', price_cents: 1500000, cost_cents: 650000, stock_quantity: 100, category_id: 'calzado', sku: 'ZAP-RUN-001', min_stock: 8, max_stock: 120 },
  { code: 'ZAP002', name: 'Zapatillas Urban Street', description: 'Silueta street, suela de goma, parte superior de cuero.', price_cents: 1200000, cost_cents: 500000, stock_quantity: 95, category_id: 'calzado', sku: 'ZAP-URB-002', min_stock: 8, max_stock: 100 },
  { code: 'GOR001', name: 'Gorro Lana Clásico', description: 'Lana merino, tejido grueso, color carbón.', price_cents: 180000, cost_cents: 80000, stock_quantity: 300, category_id: 'accesorios', sku: 'GOR-CLX-001', min_stock: 20, max_stock: 350 },
  { code: 'BUF001', name: 'Bufanda Algodón Twill', description: 'Twill de algodón suave, 180 cm, terminación flecos.', price_cents: 320000, cost_cents: 140000, stock_quantity: 250, category_id: 'accesorios', sku: 'BUF-ALG-001', min_stock: 15, max_stock: 300 },
  { code: 'MED001', name: 'Medias Pack x3', description: 'Algodón 26/1, caña media, pack de 3 unidades.', price_cents: 150000, cost_cents: 60000, stock_quantity: 400, category_id: 'accesorios', sku: 'MED-PK3-001', min_stock: 30, max_stock: 500 },
  { code: 'COL001', name: 'Collar Plata 925', description: 'Plata 925 con cadena ajustable, baño rodio.', price_cents: 850000, cost_cents: 350000, stock_quantity: 50, category_id: 'accesorios', sku: 'COL-PLT-001', min_stock: 5, max_stock: 60 },
  { code: 'CIN001', name: 'Cinturón Cuero', description: 'Cuero vacuno, hebilla metálica, 3.5 cm.', price_cents: 550000, cost_cents: 230000, stock_quantity: 120, category_id: 'accesorios', sku: 'CIN-CRO-001', min_stock: 10, max_stock: 150 },
];

interface ContactSeed {
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
}

const CUSTOMERS: ContactSeed[] = [
  { name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '+54 11 5555-1234', tax_id: '20-30123456-7' },
  { name: 'María García', email: 'maria.garcia@email.com', phone: '+54 11 5555-5678', tax_id: '27-25456789-3' },
  { name: 'Carlos López', email: null, phone: '+54 11 5555-9012', tax_id: null },
  { name: 'Ana Martínez', email: 'ana.martinez@email.com', phone: '+54 11 5555-3456', tax_id: '23-20987654-1' },
  { name: 'Roberto Fernández', email: null, phone: null, tax_id: null },
  { name: 'Lucía Rodríguez', email: 'lucia.rod@email.com', phone: '+54 11 5555-7890', tax_id: '20-27654321-5' },
];

const SUPPLIERS: ContactSeed[] = [
  { name: 'Mayorista Textil SRL', email: 'ventas@mayortextil.com.ar', phone: '+54 11 5555-2233', tax_id: '30-71111111-1' },
  { name: 'Calzados del Sur SA', email: 'compras@calzadosdelsur.com', phone: '+54 11 5555-4455', tax_id: '30-72222222-2' },
  { name: 'Distribuidora Norte', email: null, phone: '+54 341 555-6677', tax_id: null },
];

interface WalletOp {
  type: 'credit' | 'debit';
  amount_cents: number;
  reference: string;
  notes: string;
  daysAgo: number;
}

const WALLET_SPECS: { contactName: string; ops: WalletOp[] }[] = [
  {
    contactName: 'Juan Pérez',
    ops: [
      { type: 'credit', amount_cents: 100000, reference: 'payment', notes: 'Pago a cuenta', daysAgo: 20 },
      { type: 'debit', amount_cents: 45000, reference: 'sale', notes: 'Compra a cuenta', daysAgo: 12 },
      { type: 'debit', amount_cents: 28900, reference: 'sale', notes: 'Compra a cuenta', daysAgo: 5 },
      { type: 'credit', amount_cents: 50000, reference: 'payment', notes: 'Pago parcial', daysAgo: 1 },
    ],
  },
  {
    contactName: 'María García',
    ops: [
      { type: 'credit', amount_cents: 150000, reference: 'payment', notes: 'Pago a cuenta', daysAgo: 25 },
      { type: 'debit', amount_cents: 23000, reference: 'sale', notes: 'Compra a cuenta', daysAgo: 8 },
      { type: 'credit', amount_cents: 80000, reference: 'payment', notes: 'Pago a cuenta', daysAgo: 3 },
    ],
  },
  {
    contactName: 'Ana Martínez',
    ops: [
      { type: 'credit', amount_cents: 60000, reference: 'payment', notes: 'Pago a cuenta', daysAgo: 15 },
      { type: 'debit', amount_cents: 34000, reference: 'sale', notes: 'Compra a cuenta', daysAgo: 4 },
    ],
  },
  {
    contactName: 'Lucía Rodríguez',
    ops: [
      { type: 'credit', amount_cents: 90000, reference: 'payment', notes: 'Pago a cuenta', daysAgo: 18 },
      { type: 'debit', amount_cents: 45600, reference: 'sale', notes: 'Compra a cuenta', daysAgo: 10 },
      { type: 'debit', amount_cents: 12000, reference: 'sale', notes: 'Compra a cuenta', daysAgo: 6 },
      { type: 'credit', amount_cents: 20000, reference: 'payment', notes: 'Pago a cuenta', daysAgo: 2 },
    ],
  },
];

const SALE_SLOTS: { daysAgo: number; count: number }[] = Array.from({ length: 30 }, (_, i) => ({
  daysAgo: i,
  count: (i % 7 === 0 || i % 7 === 6) ? 14 + Math.floor(Math.random() * 8) : 8 + Math.floor(Math.random() * 6),
}));

const PAYMENT_METHODS = ['cash', 'cash', 'cash', 'debit', 'debit', 'credit', 'transfer', 'qr'] as const;

interface SeedSaleItemInput {
  productId: string | null;
  name?: string;
  quantity: number;
  unit_price_cents: number;
}

interface SeedSaleInput {
  created_at: number;
  ticket_number: number;
  items: SeedSaleItemInput[];
  payment_method: string;
  contact_id: string | null;
  discount_cents: number;
}

async function cleanupSeedData(companyId: string, storeId: string): Promise<void> {
  const seedSales = await prisma.sale.findMany({
    where: { companyId, payment_details: SEED_TAG },
    select: { id: true },
  });
  const seedSaleIds = seedSales.map((s) => s.id);
  if (seedSaleIds.length > 0) {
    await prisma.inventoryMovement.deleteMany({
      where: { reference_type: 'sale', reference_id: { in: seedSaleIds } },
    });
    await prisma.sale.deleteMany({ where: { id: { in: seedSaleIds } } });
  }

  await prisma.inventoryMovement.deleteMany({
    where: { companyId, reason: { startsWith: 'seed:' } },
  });
  await prisma.inventory.deleteMany({ where: { companyId, storeId } });

  await prisma.productVariant.deleteMany({
    where: { companyId, sku: { startsWith: 'SEED-' } },
  });

  await prisma.walletTransaction.deleteMany({ where: { companyId } });
  await prisma.cashMovement.deleteMany({
    where: { companyId, description: { startsWith: '[seed]' } },
  });

  await prisma.costHistory.deleteMany({ where: { companyId } });
  await prisma.purchaseReceipt.deleteMany({ where: { companyId } });

  const orders = await prisma.purchaseOrder.findMany({
    where: { companyId },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length > 0) {
    await prisma.purchaseOrderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.purchaseOrder.deleteMany({ where: { id: { in: orderIds } } });
  }
}

async function insertSeedSale(
  companyId: string,
  storeId: string,
  userId: string,
  cashRegisterId: string | null,
  sale: SeedSaleInput,
): Promise<void> {
  const subtotal = sale.items.reduce((sum, it) => sum + it.unit_price_cents * it.quantity, 0);
  const taxable = Math.max(0, subtotal - sale.discount_cents);
  const taxCents = Math.round((taxable * TAX_RATE_BPS) / 10000);
  const totalCents = taxable + taxCents;

  const created = await prisma.sale.create({
    data: {
      companyId,
      storeId,
      cash_register_id: cashRegisterId,
      user_id: userId,
      contact_id: sale.contact_id,
      ticket_number: sale.ticket_number,
      total_cents: totalCents,
      discount_cents: sale.discount_cents,
      tax_cents: taxCents,
      status: 'completed',
      payment_method: sale.payment_method,
      payment_details: SEED_TAG,
      created_at: sale.created_at,
      updated_at: sale.created_at,
    },
  });

  for (const item of sale.items) {
    await prisma.saleItem.create({
      data: {
        saleId: created.id,
        productId: item.productId,
        name: item.name ?? null,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        total_cents: item.unit_price_cents * item.quantity,
        discount_cents: 0,
      },
    });

    if (!item.productId) continue;

    await prisma.product.update({
      where: { id: item.productId },
      data: { stock_quantity: { decrement: item.quantity }, updated_at: now },
    });

    await prisma.inventory.updateMany({
      where: { companyId, storeId, productId: item.productId, variantId: null },
      data: { quantity: { decrement: item.quantity }, updated_at: now },
    });

    await prisma.inventoryMovement.create({
      data: {
        companyId,
        storeId,
        productId: item.productId,
        userId,
        type: 'sale',
        quantity: -item.quantity,
        reason: `seed:venta ticket #${sale.ticket_number}`,
        reference_type: 'sale',
        reference_id: created.id,
        created_at: sale.created_at,
      },
    });
  }
}

interface PurchaseOrderSeed {
  supplierName: string;
  status: string;
  created_days_ago: number;
  expected_days_ago: number;
  items: { code: string; qty: number; unit_cost_cents: number }[];
}

const PURCHASE_ORDERS: PurchaseOrderSeed[] = [
  {
    supplierName: 'Mayorista Textil SRL',
    status: 'received',
    created_days_ago: 10,
    expected_days_ago: 7,
    items: [
      { code: 'REM001', qty: 30, unit_cost_cents: 120000 },
      { code: 'MED001', qty: 40, unit_cost_cents: 60000 },
    ],
  },
  {
    supplierName: 'Calzados del Sur SA',
    status: 'pending',
    created_days_ago: 2,
    expected_days_ago: -2,
    items: [
      { code: 'ZAP001', qty: 12, unit_cost_cents: 650000 },
      { code: 'ZAP002', qty: 10, unit_cost_cents: 500000 },
    ],
  },
  {
    supplierName: 'Distribuidora Norte',
    status: 'pending',
    created_days_ago: 1,
    expected_days_ago: -4,
    items: [
      { code: 'GOR001', qty: 40, unit_cost_cents: 80000 },
      { code: 'BUF001', qty: 25, unit_cost_cents: 140000 },
      { code: 'CIN001', qty: 20, unit_cost_cents: 230000 },
    ],
  },
  {
    supplierName: 'Mayorista Textil SRL',
    status: 'draft',
    created_days_ago: 0,
    expected_days_ago: -6,
    items: [{ code: 'CMP001', qty: 6, unit_cost_cents: 900000 }],
  },
];

const CASH_MOVEMENTS: { type: 'income' | 'expense'; amount_cents: number; description: string; daysAgo: number }[] = [
  { type: 'income', amount_cents: 100000, description: '[seed] Fondo inicial de cambio', daysAgo: 6 },
  { type: 'expense', amount_cents: 25000, description: '[seed] Compra de bolsas y consumibles', daysAgo: 4 },
  { type: 'expense', amount_cents: 120000, description: '[seed] Retiro de efectivo para depósito', daysAgo: 2 },
  { type: 'income', amount_cents: 50000, description: '[seed] Ingreso por venta especial', daysAgo: 1 },
  { type: 'expense', amount_cents: 8000, description: '[seed] Café y desayuno del equipo', daysAgo: 0 },
];

async function main() {
  console.log('🌱 Seeding database...');

  const companyId = await getOrCreateCompany();
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { name: COMPANY_NAME, updated_at: now },
  });

  const storeId = await getOrCreateStore(companyId);
  const store = await prisma.store.update({
    where: { id: storeId },
    data: { name: STORE_NAME, updated_at: now },
  });

  console.log(`   Company: ${company.name} (${company.id})`);
  console.log(`   Store: ${store.name} (${store.id})`);

  // ── Admin user ────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { companyId_email: { companyId, email: ADMIN_EMAIL } },
    update: {
      name: 'Administrador',
      role: 'admin',
      password: adminPassword,
      is_active: true,
      updated_at: now,
    },
    create: {
      companyId,
      email: ADMIN_EMAIL,
      password: adminPassword,
      name: 'Administrador',
      role: 'admin',
      created_at: now,
      updated_at: now,
    },
  });
  console.log(`   Admin: ${admin.email} (${admin.id})`);

  // ── Cleanup previous demo data (idempotent re-seed) ──
  await cleanupSeedData(companyId, storeId);

  // ── Products ─────────────────────────────────────────
  const productIdsByCode = new Map<string, string>();
  for (const p of PRODUCTS) {
    const { variants: _variants, min_stock: _min, max_stock: _max, ...productData } = p;
    const existing = await prisma.product.findUnique({
      where: { companyId_storeId_code: { companyId, storeId, code: p.code } },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...productData, updated_at: now },
      });
      productIdsByCode.set(p.code, existing.id);
    } else {
      const created = await prisma.product.create({
        data: { companyId, storeId, ...productData, created_at: now, updated_at: now },
      });
      productIdsByCode.set(p.code, created.id);
    }
  }
  console.log(`   Products: ${PRODUCTS.length} upserted`);

  // ── Product variants (sizes for t-shirts) ────────────
  let variantCount = 0;
  for (const p of PRODUCTS) {
    if (!p.variants) continue;
    const productId = productIdsByCode.get(p.code)!;
    for (const size of p.variants) {
      const barcode = `${p.code}-${size}`;
      const sku = `SEED-${p.code}-${size}`;
      await prisma.productVariant.upsert({
        where: { companyId_barcode: { companyId, barcode } },
        update: { size, sku, price_cents: p.price_cents, cost_cents: p.cost_cents, is_active: true, updated_at: now },
        create: {
          companyId,
          productId,
          size,
          barcode,
          sku,
          price_cents: p.price_cents,
          cost_cents: p.cost_cents,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      });
      variantCount += 1;
    }
  }
  console.log(`   Variants: ${variantCount}`);

  // ── Inventory rows + initial entry movements ─────────
  let inventoryRows = 0;
  for (const p of PRODUCTS) {
    const productId = productIdsByCode.get(p.code)!;
    const existingInv = await prisma.inventory.findFirst({
      where: { companyId, storeId, productId, variantId: null },
    });
    const invData = {
      quantity: p.stock_quantity,
      min_stock: p.min_stock,
      max_stock: p.max_stock,
      updated_at: now,
    };
    if (existingInv) {
      await prisma.inventory.update({ where: { id: existingInv.id }, data: invData });
    } else {
      await prisma.inventory.create({
        data: {
          companyId,
          storeId,
          productId,
          variantId: null,
          ...invData,
          created_at: now,
        },
      });
    }
    inventoryRows += 1;

    if (p.stock_quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          companyId,
          storeId,
          productId,
          userId: admin.id,
          type: 'entry',
          quantity: p.stock_quantity,
          reason: 'seed:stock inicial',
          created_at: epochAt(45, 10, 0),
        },
      });
    }
  }
  console.log(`   Inventory rows: ${inventoryRows}`);

  // ── Contacts (customers + suppliers) ─────────────────
  await prisma.contact.deleteMany({ where: { companyId } });
  const contactIdsByName = new Map<string, string>();
  for (const c of [...CUSTOMERS, ...SUPPLIERS]) {
    const created = await prisma.contact.create({
      data: {
        companyId,
        type: CUSTOMERS.includes(c) ? 'customer' : 'supplier',
        ...c,
        created_at: now,
        updated_at: now,
      },
    });
    contactIdsByName.set(c.name, created.id);
  }
  console.log(`   Contacts: ${CUSTOMERS.length} customers, ${SUPPLIERS.length} suppliers`);

  // ── Wallet (account ledger per contact) ──────────────
  let walletTxCount = 0;
  for (const spec of WALLET_SPECS) {
    const contactId = contactIdsByName.get(spec.contactName)!;
    let balance = 0;
    for (const op of spec.ops) {
      const delta = op.type === 'credit' ? op.amount_cents : -op.amount_cents;
      const before = balance;
      balance += delta;
      await prisma.walletTransaction.create({
        data: {
          companyId,
          contactId,
          type: op.type,
          amount_cents: op.amount_cents,
          balance_before: before,
          balance_after: balance,
          reference: op.reference,
          notes: op.notes,
          created_by: admin.id,
          created_at: epochAt(op.daysAgo, 12, 0),
        },
      });
      walletTxCount += 1;
    }
    await prisma.contact.update({
      where: { id: contactId },
      data: { balance_cents: balance, updated_at: now },
    });
  }
  console.log(`   Wallet transactions: ${walletTxCount}`);

  // ── Cash register (open shift) ───────────────────────
  const existingRegister = await prisma.cashRegister.findFirst({
    where: { companyId, name: CASH_REGISTER_NAME },
  });
  const cashRegister =
    existingRegister ||
    (await prisma.cashRegister.create({
      data: {
        companyId,
        storeId,
        name: CASH_REGISTER_NAME,
        status: 'open',
        opening_amount: 500000,
        opened_at: now,
        created_at: now,
        updated_at: now,
      },
    }));
  console.log(
    `   Cash Register: ${cashRegister.name} (${cashRegister.status}, $${cashRegister.opening_amount / 100})`,
  );

  // ── Cash movements ───────────────────────────────────
  for (const m of CASH_MOVEMENTS) {
    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        companyId,
        storeId,
        type: m.type,
        amount_cents: m.amount_cents,
        description: m.description,
        created_at: epochAt(m.daysAgo, 11, 30),
      },
    });
  }
  console.log(`   Cash movements: ${CASH_MOVEMENTS.length}`);

  // ── Historical sales ─────────────────────────────────
  const ticketCounter = makeTicketCounter();
  const remainingStock = new Map<string, number>(PRODUCTS.map((p) => [p.code, p.stock_quantity]));
  let salesCreated = 0;

  for (const slot of SALE_SLOTS) {
    for (let i = 0; i < slot.count; i += 1) {
      const created_at = epochRandomDayHour(slot.daysAgo);

      const numItems = pick([1, 1, 2, 2, 2, 3, 3, 4]);
      const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
      const items: SeedSaleItemInput[] = [];
      for (const candidate of shuffled) {
        if (items.length >= numItems) break;
        const remaining = remainingStock.get(candidate.code) ?? 0;
        if (remaining <= 0) continue;
        const qty = remaining >= 2 ? pick([1, 1, 2]) : 1;
        items.push({
          productId: productIdsByCode.get(candidate.code)!,
          quantity: qty,
          unit_price_cents: candidate.price_cents,
        });
        remainingStock.set(candidate.code, remaining - qty);
      }
      if (items.length === 0) continue;

      const withDiscount = Math.random() < 0.12;
      const discount_cents = withDiscount
        ? Math.round(
            items.reduce((sum, it) => sum + it.unit_price_cents * it.quantity, 0) *
              (pick([5, 10]) / 100),
          )
        : 0;

      const customerIds = [...CUSTOMERS.map((c) => contactIdsByName.get(c.name)!)];
      const contact_id = Math.random() < 0.3 ? pick(customerIds) : null;

      await insertSeedSale(companyId, storeId, admin.id, cashRegister.id, {
        created_at,
        ticket_number: ticketCounter(created_at),
        items,
        payment_method: pick(PAYMENT_METHODS),
        contact_id,
        discount_cents,
      });
      salesCreated += 1;
    }
  }

  // Custom (non-catalog) sales
  const customSales: SeedSaleInput[] = [
    {
      created_at: epochRandomDayHour(2),
      ticket_number: ticketCounter(epochAt(2, 12, 0)),
      items: [{ productId: null, name: 'Estampado personalizado', quantity: 1, unit_price_cents: 12000 }],
      payment_method: 'cash',
      contact_id: null,
      discount_cents: 0,
    },
    {
      created_at: epochRandomDayHour(9),
      ticket_number: ticketCounter(epochAt(9, 12, 0)),
      items: [{ productId: null, name: 'Gift card Arcon', quantity: 1, unit_price_cents: 50000 }],
      payment_method: 'transfer',
      contact_id: null,
      discount_cents: 0,
    },
  ];
  for (const sale of customSales) {
    await insertSeedSale(companyId, storeId, admin.id, cashRegister.id, sale);
    salesCreated += 1;
  }

  console.log(`   Sales: ${salesCreated}`);

  // ── Purchase orders + receipt ────────────────────────
  for (const order of PURCHASE_ORDERS) {
    const supplierId = contactIdsByName.get(order.supplierName)!;
    const total = order.items.reduce((sum, it) => sum + it.unit_cost_cents * it.qty, 0);
    const createdOrder = await prisma.purchaseOrder.create({
      data: {
        companyId,
        storeId,
        supplierId,
        status: order.status,
        expected_date: epochAt(order.expected_days_ago, 18, 0),
        total_cents: total,
        created_by: admin.id,
        created_at: epochAt(order.created_days_ago, 10, 0),
        updated_at: now,
      },
    });
    for (const it of order.items) {
      const received = order.status === 'received' ? it.qty : 0;
      await prisma.purchaseOrderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: productIdsByCode.get(it.code)!,
          quantity_ordered: it.qty,
          quantity_received: received,
          unit_cost_cents: it.unit_cost_cents,
          total_cents: it.unit_cost_cents * it.qty,
        },
      });
    }
    if (order.status === 'received') {
      await prisma.purchaseReceipt.create({
        data: {
          companyId,
          storeId,
          orderId: createdOrder.id,
          supplierId,
          receipt_number: `R-${createdOrder.id.slice(-5).toUpperCase()}`,
          notes: '[seed] Remito de demostración',
          created_by: admin.id,
          created_at: epochAt(order.created_days_ago - 1, 12, 0),
        },
      });
    }
  }
  console.log(`   Purchase orders: ${PURCHASE_ORDERS.length}`);

  // ── Store config ─────────────────────────────────────
  await prisma.storeConfig.upsert({
    where: { storeId },
    update: {
      receipt_header: 'GRACIAS POR SU COMPRA',
      receipt_footer: 'Arcon POS — Venta de prueba',
      tax_rate_bps: TAX_RATE_BPS,
    },
    create: {
      storeId,
      receipt_header: 'GRACIAS POR SU COMPRA',
      receipt_footer: 'Arcon POS — Venta de prueba',
      tax_rate_bps: TAX_RATE_BPS,
    },
  });

  // ── Sync .env with actual tenant ids ─────────────────
  let envChanged = false;
  if (process.env.LOCAL_COMPANY_ID !== companyId) {
    envChanged = setEnvValue('LOCAL_COMPANY_ID', companyId) || envChanged;
  }
  if (process.env.LOCAL_STORE_ID !== storeId) {
    envChanged = setEnvValue('LOCAL_STORE_ID', storeId) || envChanged;
  }
  if (envChanged) {
    console.log('   .env: LOCAL_COMPANY_ID / LOCAL_STORE_ID synced to seeded tenant');
  }

  console.log('\n✅ Seed completed:');
  console.log(`   Company: ${company.name} (${company.id})`);
  console.log(`   Store: ${store.name} (${store.id})`);
  console.log(`   Admin: ${admin.email} (${admin.id})`);
  console.log(`   Products: ${PRODUCTS.length} (+${variantCount} variants)`);
  console.log(`   Contacts: ${CUSTOMERS.length} customers, ${SUPPLIERS.length} suppliers`);
  console.log(`   Wallet transactions: ${walletTxCount}`);
  console.log(`   Sales: ${salesCreated}`);
  console.log(`   Purchase orders: ${PURCHASE_ORDERS.length}`);
  console.log(
    `   Cash Register: ${cashRegister.status} with $${cashRegister.opening_amount / 100}`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
