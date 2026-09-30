import 'dotenv/config';
import { PrismaClient } from '../generated';
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
    update: {
      name: 'Emprendedor',
      maxStoresDefault: 1,
      priceDefaultCents: 0,
      termDaysDefault: 365,
      currency: 'ARS',
      features: { cloudSync: false, multiStore: false, reports: false },
      sortOrder: 0,
    },
    create: {
      productId: pos.id,
      name: 'Emprendedor',
      slug: 'free',
      maxStoresDefault: 1,
      priceDefaultCents: 0,
      termDaysDefault: 365,
      currency: 'ARS',
      features: { cloudSync: false, multiStore: false, reports: false },
      sortOrder: 0,
    },
  });

  await prisma.plan.upsert({
    where: { productId_slug: { productId: pos.id, slug: 'pro' } },
    update: {
      name: 'Profesional',
      maxStoresDefault: 2,
      priceDefaultCents: 499900,
      termDaysDefault: 30,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true },
      sortOrder: 1,
    },
    create: {
      productId: pos.id,
      name: 'Profesional',
      slug: 'pro',
      maxStoresDefault: 2,
      priceDefaultCents: 499900,
      termDaysDefault: 30,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true },
      sortOrder: 1,
    },
  });

  await prisma.plan.upsert({
    where: { productId_slug: { productId: pos.id, slug: 'enterprise' } },
    update: {
      name: 'Enterprise',
      maxStoresDefault: 4,
      priceDefaultCents: 999900,
      termDaysDefault: 30,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true, priority: true },
      sortOrder: 2,
    },
    create: {
      productId: pos.id,
      name: 'Enterprise',
      slug: 'enterprise',
      maxStoresDefault: 4,
      priceDefaultCents: 999900,
      termDaysDefault: 30,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true, priority: true },
      sortOrder: 2,
    },
  });

  await prisma.plan.upsert({
    where: { productId_slug: { productId: pos.id, slug: 'custom' } },
    update: {
      name: 'Custom',
      maxStoresDefault: 999,
      priceDefaultCents: 1,
      termDaysDefault: 15,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true, priority: true },
      sortOrder: 3,
    },
    create: {
      productId: pos.id,
      name: 'Custom',
      slug: 'custom',
      maxStoresDefault: 999,
      priceDefaultCents: 1,
      termDaysDefault: 15,
      currency: 'ARS',
      features: { cloudSync: true, multiStore: true, reports: true, priority: true },
      sortOrder: 3,
    },
  });

  console.log('✅ Products and plans created');

  // ── Demo clients + subscriptions ─────────────────────────
  // POST /api/license/issue (apps/admin-panel/src/app/api/license/issue)
  // resolves a license by looking up a Client by email and then a
  // Subscription on POS_PRODUCT_ID with status active|paused. Without at
  // least one of each, that endpoint can only ever answer 404, so the whole
  // POS license flow is untestable from a fresh clone.
  const daysFromNow = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const demoClients = [
    {
      email: 'cliente.pro@ejemplo.com',
      name: 'Comercio Demo',
      planSlug: 'pro',
      status: 'active',
      maxStores: 3,
      renewalInDays: 25,
    },
    {
      email: 'cliente.free@ejemplo.com',
      name: 'Cliente Free',
      planSlug: 'free',
      status: 'active',
      maxStores: 1,
      renewalInDays: 300,
    },
    {
      email: 'cliente.paused@ejemplo.com',
      name: 'Cliente Pausado',
      planSlug: 'pro',
      status: 'paused',
      maxStores: 3,
      renewalInDays: 10,
    },
  ];

  for (const demo of demoClients) {
    const client = await prisma.client.upsert({
      where: { email: demo.email },
      update: { name: demo.name, updatedAt: new Date() },
      create: {
        email: demo.email,
        name: demo.name,
        type: 'business',
        source: 'seed',
      },
    });

    const plan = await prisma.plan.findUniqueOrThrow({
      where: { productId_slug: { productId: pos.id, slug: demo.planSlug } },
    });

    // Keyed by clientId+productId+planId (no natural unique constraint on
    // Subscription), so an existing demo subscription is located by query
    // and updated in place. Keeps `db:up` idempotent across re-runs.
    const existing = await prisma.subscription.findFirst({
      where: { clientId: client.id, productId: pos.id, planId: plan.id },
    });

    const subData = {
      status: demo.status,
      maxStoresOverride: demo.maxStores,
      startDate: new Date(),
      renewalDate: daysFromNow(demo.renewalInDays),
      updatedAt: new Date(),
    };

    if (existing) {
      await prisma.subscription.update({ where: { id: existing.id }, data: subData });
    } else {
      await prisma.subscription.create({
        data: { ...subData, clientId: client.id, productId: pos.id, planId: plan.id },
      });
    }

    console.log(`✅ Client: ${client.email} (${demo.planSlug}, ${demo.status})`);
  }

  console.log('🌱 Seed complete');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
