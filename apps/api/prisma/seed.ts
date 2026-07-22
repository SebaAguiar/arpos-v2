import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const now = Date.now();

  const company = await prisma.company.create({
    data: {
      name: 'ArPOS Demo',
      taxId: '20-12345678-9',
      address: 'Av. Demo 1234',
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
      address: 'Av. Demo 1234',
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

  console.log('✅ Seed completed:');
  console.log(`   Company: ${company.name} (${company.id})`);
  console.log(`   Store: ${store.name} (${store.id})`);
  console.log(`   Admin: ${admin.email} (${admin.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
