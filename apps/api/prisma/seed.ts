import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const now = Math.floor(Date.now() / 1000);

const COMPANY_TAX_ID = '20-12345678-9';
const COMPANY_NAME = 'Arcon Demo';
const STORE_NAME = 'Sucursal Principal';
const ADMIN_EMAIL = 'admin@arcon.com';
const CASH_REGISTER_NAME = 'Caja Principal';

const ENV_PATH = path.resolve(process.cwd(), '.env');

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

  // ── Products ─────────────────────────────────────────
  const products = [
    { code: 'REM001', name: 'Remera Básica Algodón', price_cents: 250000, cost_cents: 120000, stock_quantity: 45, category_id: 'remeras', sku: 'REM-BAS-001' },
    { code: 'REM002', name: 'Remera Polo', price_cents: 450000, cost_cents: 220000, stock_quantity: 30, category_id: 'remeras', sku: 'REM-POL-002' },
    { code: 'REM003', name: 'Remera Manga Larga', price_cents: 320000, cost_cents: 150000, stock_quantity: 25, category_id: 'remeras', sku: 'REM-MLG-003' },
    { code: 'JNS001', name: 'Jeans Clásico Straight', price_cents: 890000, cost_cents: 400000, stock_quantity: 20, category_id: 'pantalones', sku: 'JNS-STR-001' },
    { code: 'JNS002', name: 'Jeans Slim Fit', price_cents: 950000, cost_cents: 420000, stock_quantity: 18, category_id: 'pantalones', sku: 'JNS-SLM-002' },
    { code: 'BER001', name: 'Bermuda Cargo', price_cents: 650000, cost_cents: 300000, stock_quantity: 35, category_id: 'pantalones', sku: 'BER-CRG-001' },
    { code: 'CMP001', name: 'Campera Slim Forro Polar', price_cents: 2200000, cost_cents: 900000, stock_quantity: 12, category_id: 'camperas', sku: 'CMP-SLM-001' },
    { code: 'CMP002', name: 'Campera Puffer Liviana', price_cents: 1800000, cost_cents: 750000, stock_quantity: 15, category_id: 'camperas', sku: 'CMP-PFF-002' },
    { code: 'ZAP001', name: 'Zapatillas Run Max', price_cents: 1500000, cost_cents: 650000, stock_quantity: 22, category_id: 'calzado', sku: 'ZAP-RUN-001' },
    { code: 'ZAP002', name: 'Zapatillas Urban Street', price_cents: 1200000, cost_cents: 500000, stock_quantity: 18, category_id: 'calzado', sku: 'ZAP-URB-002' },
    { code: 'GOR001', name: 'Gorro Lana Clásico', price_cents: 180000, cost_cents: 80000, stock_quantity: 50, category_id: 'accesorios', sku: 'GOR-CLX-001' },
    { code: 'BUF001', name: 'Bufanda Algodón Twill', price_cents: 320000, cost_cents: 140000, stock_quantity: 40, category_id: 'accesorios', sku: 'BUF-ALG-001' },
    { code: 'MED001', name: 'Medias Pack x3', price_cents: 150000, cost_cents: 60000, stock_quantity: 80, category_id: 'accesorios', sku: 'MED-PK3-001' },
    { code: 'COL001', name: 'Collar Plata 925', price_cents: 850000, cost_cents: 350000, stock_quantity: 10, category_id: 'accesorios', sku: 'COL-PLT-001' },
    { code: 'CIN001', name: 'Cinturón Cuero', price_cents: 550000, cost_cents: 230000, stock_quantity: 25, category_id: 'accesorios', sku: 'CIN-CRO-001' },
  ];

  let createdProducts = 0;
  let updatedProducts = 0;
  for (const p of products) {
    const { code, ...data } = p;
    const existing = await prisma.product.findUnique({
      where: { companyId_storeId_code: { companyId, storeId, code } },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...data, updated_at: now },
      });
      updatedProducts += 1;
    } else {
      await prisma.product.create({
        data: { companyId, storeId, code, ...data, created_at: now, updated_at: now },
      });
      createdProducts += 1;
    }
  }

  console.log(`   Products: ${createdProducts} created, ${updatedProducts} updated`);

  // ── Contacts (Customers) ─────────────────────────────
  const contacts = [
    { name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '+54 11 5555-1234', tax_id: '20-30123456-7' },
    { name: 'María García', email: 'maria.garcia@email.com', phone: '+54 11 5555-5678', tax_id: '27-25456789-3' },
    { name: 'Carlos López', email: null, phone: '+54 11 5555-9012', tax_id: null },
    { name: 'Ana Martínez', email: 'ana.martinez@email.com', phone: '+54 11 5555-3456', tax_id: '23-20987654-1' },
    { name: 'Roberto Fernández', email: null, phone: null, tax_id: null },
    { name: 'Lucía Rodríguez', email: 'lucia.rod@email.com', phone: '+54 11 5555-7890', tax_id: '20-27654321-5' },
  ];

  await prisma.contact.deleteMany({ where: { companyId } });
  for (const c of contacts) {
    await prisma.contact.create({
      data: { companyId, type: 'customer', ...c, created_at: now, updated_at: now },
    });
  }

  console.log(`   Contacts: ${contacts.length} (re-seeded)`);

  // ── Cash Register (open shift) ───────────────────────
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

  console.log(`   Cash Register: ${cashRegister.name} (${cashRegister.status}, $${cashRegister.opening_amount / 100})`);

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
  console.log(`   Products: ${createdProducts + updatedProducts}`);
  console.log(`   Contacts: ${contacts.length}`);
  console.log(`   Cash Register: ${cashRegister.status} with $${cashRegister.opening_amount / 100}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
