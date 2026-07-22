import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const now = Math.floor(Date.now() / 1000);

  // ── Company ──────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: 'ArPOS Demo',
      taxId: '20-12345678-9',
      address: 'Av. Demo 1234, CABA',
      email: 'demo@arpos.com',
      phone: '+54 11 1234-5678',
      created_at: now,
      updated_at: now,
    },
  });

  const store = await prisma.store.create({
    data: {
      companyId: company.id,
      name: 'Sucursal Principal',
      address: 'Av. Demo 1234, CABA',
      created_at: now,
      updated_at: now,
    },
  });

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@arpos.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin',
      created_at: now,
      updated_at: now,
    },
  });

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

  const createdProducts = [];
  for (const p of products) {
    const created = await prisma.product.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        ...p,
        created_at: now,
        updated_at: now,
      },
    });
    createdProducts.push(created);
  }

  console.log(`   Products: ${createdProducts.length} created`);

  // ── Contacts (Customers) ─────────────────────────────
  const contacts = [
    { name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '+54 11 5555-1234', tax_id: '20-30123456-7' },
    { name: 'María García', email: 'maria.garcia@email.com', phone: '+54 11 5555-5678', tax_id: '27-25456789-3' },
    { name: 'Carlos López', email: null, phone: '+54 11 5555-9012', tax_id: null },
    { name: 'Ana Martínez', email: 'ana.martinez@email.com', phone: '+54 11 5555-3456', tax_id: '23-20987654-1' },
    { name: 'Roberto Fernández', email: null, phone: null, tax_id: null },
    { name: 'Lucía Rodríguez', email: 'lucia.rod@email.com', phone: '+54 11 5555-7890', tax_id: '20-27654321-5' },
  ];

  const createdContacts = [];
  for (const c of contacts) {
    const created = await prisma.contact.create({
      data: {
        companyId: company.id,
        type: 'customer',
        ...c,
        created_at: now,
        updated_at: now,
      },
    });
    createdContacts.push(created);
  }

  console.log(`   Contacts: ${createdContacts.length} created`);

  // ── Cash Register (open shift) ───────────────────────
  const cashRegister = await prisma.cashRegister.create({
    data: {
      companyId: company.id,
      storeId: store.id,
      name: 'Caja Principal',
      status: 'open',
      opening_amount: 500000,
      opened_at: now,
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`   Cash Register: ${cashRegister.name} (OPEN, $${cashRegister.opening_amount / 100})`);

  console.log('\n✅ Seed completed:');
  console.log(`   Company: ${company.name} (${company.id})`);
  console.log(`   Store: ${store.name} (${store.id})`);
  console.log(`   Admin: ${admin.email} (${admin.id})`);
  console.log(`   Products: ${createdProducts.length}`);
  console.log(`   Contacts: ${createdContacts.length}`);
  console.log(`   Cash Register: open with $${cashRegister.opening_amount / 100}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
