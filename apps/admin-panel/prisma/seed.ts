import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPasswordHash = await bcrypt.hash('admin123', BCRYPT_ROUNDS);
  await prisma.adminUser.upsert({
    where: { email: 'admin@arcom.local' },
    update: {},
    create: {
      email: 'admin@arcom.local',
      passwordHash: adminPasswordHash,
      name: 'Admin',
      role: 'superadmin',
    },
  });
  console.log('✅ Admin user: admin@arcom.local / admin123');

  // Products
  const pos = await prisma.product.upsert({
    where: { id: 'pos-product-seed' },
    update: {},
    create: { id: 'pos-product-seed', name: 'Arcom POS', type: 'saas' },
  });

  const custom = await prisma.product.upsert({
    where: { id: 'custom-product-seed' },
    update: {},
    create: { id: 'custom-product-seed', name: 'Arcom Custom', type: 'custom' },
  });

  // Plans for POS product
  await prisma.plan.upsert({
    where: { productId_slug: { productId: pos.id, slug: 'free' } },
    update: {},
    create: {
      productId: pos.id,
      name: 'Emprendedor',
      slug: 'free',
      maxStoresDefault: 1,
      priceDefaultCents: 0,
      currency: 'ARS',
      features: { cloudSync: false, multiStore: false, reports: false },
      sortOrder: 0,
    },
  });

  await prisma.plan.upsert({
    where: { productId_slug: { productId: pos.id, slug: 'pro' } },
    update: {},
    create: {
      productId: pos.id,
      name: 'Profesional',
      slug: 'pro',
      maxStoresDefault: 3,
      priceDefaultCents: 499900,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true },
      sortOrder: 1,
    },
  });

  await prisma.plan.upsert({
    where: { productId_slug: { productId: pos.id, slug: 'enterprise' } },
    update: {},
    create: {
      productId: pos.id,
      name: 'Enterprise',
      slug: 'enterprise',
      maxStoresDefault: 999,
      priceDefaultCents: 999900,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true, priority: true },
      sortOrder: 2,
    },
  });

  console.log('✅ Products and plans created');
  console.log('🌱 Seed complete');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
