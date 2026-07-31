import { PrismaClient } from '../src/generated/prisma';

/**
 * One-off seed: creates the migrated v1 tenant (Client + License) in the
 * cloud DB (admin-panel schema), plus the plan catalog.
 *
 * Tenant data is provided via env vars to keep customer PII out of the repo:
 *   TENANT_NAME  TENANT_EMAIL  TENANT_PHONE  TENANT_TAX_ID  TENANT_COMPANY
 *   TENANT_PLAN  TENANT_STATUS  TENANT_LICENSE_KEY
 *
 * Usage (from apps/admin-panel):
 *   DATABASE_URL="postgresql://..." TENANT_NAME="..." TENANT_EMAIL="..." \
 *     npx ts-node scripts/seed-tenant.ts
 */

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required`);
  return v;
};

const PLANS = [
  {
    slug: 'free',
    name: 'Free',
    maxDevices: 1,
    maxStores: 1,
    maxProducts: null,
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    cloudStorage: false,
    syncEnabled: false,
    arcaEnabled: false,
    reportsAdvanced: false,
    sortOrder: 0,
  },
  {
    slug: 'basic',
    name: 'Basic',
    maxDevices: 2,
    maxStores: 2,
    maxProducts: null,
    priceMonthlyCents: 500000,
    priceYearlyCents: 5000000,
    cloudStorage: true,
    syncEnabled: true,
    arcaEnabled: false,
    reportsAdvanced: false,
    sortOrder: 1,
  },
  {
    slug: 'pro',
    name: 'Pro',
    maxDevices: 3,
    maxStores: 3,
    maxProducts: null,
    priceMonthlyCents: 1000000,
    priceYearlyCents: 10000000,
    cloudStorage: true,
    syncEnabled: true,
    arcaEnabled: true,
    reportsAdvanced: true,
    sortOrder: 2,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    maxDevices: 3,
    maxStores: 3,
    maxProducts: null,
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    cloudStorage: true,
    syncEnabled: true,
    arcaEnabled: true,
    reportsAdvanced: true,
    sortOrder: 3,
  },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const now = Math.floor(Date.now() / 1000);

  try {
    for (const plan of PLANS) {
      await prisma.plan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: { ...plan, createdAt: now, updatedAt: now },
      });
    }
    console.log(`upserted ${PLANS.length} plans`);

    const tenant = {
      name: required('TENANT_NAME'),
      email: required('TENANT_EMAIL'),
      phone: process.env.TENANT_PHONE ?? null,
      taxId: process.env.TENANT_TAX_ID ?? null,
      company: process.env.TENANT_COMPANY ?? null,
      country: process.env.TENANT_COUNTRY ?? 'AR',
      plan: required('TENANT_PLAN'),
      status: required('TENANT_STATUS'),
      licenseKey: required('TENANT_LICENSE_KEY'),
    };

    const client = await prisma.client.upsert({
      where: { email: tenant.email },
      update: { phone: tenant.phone, taxId: tenant.taxId, company: tenant.company },
      create: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        taxId: tenant.taxId,
        company: tenant.company,
        country: tenant.country,
        source: 'migrated-v1',
        totalDevices: 1,
        createdAt: now,
        updatedAt: now,
      },
    });

    const plan = await prisma.plan.findUnique({ where: { slug: tenant.plan } });
    if (!plan) throw new Error(`plan "${tenant.plan}" not found`);

    await prisma.license.upsert({
      where: { key: tenant.licenseKey },
      update: { status: tenant.status, planId: plan.id },
      create: {
        clientId: client.id,
        planId: plan.id,
        key: tenant.licenseKey,
        status: tenant.status,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log(`tenant seeded: ${client.name} <${client.email}> plan=${plan.slug} license=${tenant.licenseKey} status=${tenant.status}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
