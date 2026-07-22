import { prisma } from "@/lib/prisma";

export async function getLicenses(filters?: { status?: string; planSlug?: string }) {
  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.planSlug) {
    where.plan = { slug: filters.planSlug };
  }

  return prisma.license.findMany({
    where,
    include: { client: true, plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateLicenseStatus(id: string, status: string) {
  return prisma.license.update({
    where: { id },
    data: { status, updatedAt: Math.floor(Date.now() / 1000) },
  });
}

export async function suspendLicense(id: string) {
  return updateLicenseStatus(id, "suspended");
}

export async function reactivateLicense(id: string) {
  return updateLicenseStatus(id, "active");
}
