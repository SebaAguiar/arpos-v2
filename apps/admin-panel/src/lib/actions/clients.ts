import { prisma } from "@/lib/prisma";

export async function getClients() {
  const clients = await prisma.client.findMany({
    include: {
      licenses: { include: { plan: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return clients.map((c) => ({
    ...c,
    activePlan: c.licenses.find((l) => l.status === "active")?.plan?.slug || null,
    activeLicense: c.licenses.find((l) => l.status === "active") || null,
  }));
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      licenses: { include: { plan: true } },
      payments: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      supportTickets: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateClient(id: string, data: { name?: string; email?: string; phone?: string; company?: string; taxId?: string; notes?: string }) {
  return prisma.client.update({
    where: { id },
    data: { ...data, updatedAt: Math.floor(Date.now() / 1000) },
  });
}
