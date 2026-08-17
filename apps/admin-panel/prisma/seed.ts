import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin panel database...");

  const now = Math.floor(Date.now() / 1000);

  // ─── Planes ───
  const plans = [
    {
      slug: "free",
      name: "Free",
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
      slug: "basic",
      name: "Basic",
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
      slug: "pro",
      name: "Pro",
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
      slug: "enterprise",
      name: "Enterprise",
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

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: { ...plan, createdAt: now, updatedAt: now },
    });
  }
  console.log(`Created/updated ${plans.length} plans`);

  // ─── Admin user ───
  const adminPassword = await hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@arcom.local" },
    update: {},
    create: {
      email: "admin@arcom.local",
      passwordHash: adminPassword,
      name: "Admin",
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log("Created admin user: admin@arcom.local");

  // ─── Demo client ───
  const demoPassword = await hash("demo123", 12);
  const demoClient = await prisma.client.upsert({
    where: { email: "demo@arcom.local" },
    update: {},
    create: {
      name: "Demo Store",
      email: "demo@arcom.local",
      passwordHash: demoPassword,
      phone: "+54 11 1234-5678",
      company: "Demo S.A.",
      country: "AR",
      source: "landing",
      totalDevices: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (freePlan) {
    await prisma.license.upsert({
      where: { id: "demo-license-free" },
      update: {},
      create: {
        id: "demo-license-free",
        clientId: demoClient.id,
        planId: freePlan.id,
        key: "ARCOM-FREE-DEMO-0001",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  console.log("Created demo client: demo@arcom.local");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
