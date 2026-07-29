import { jwtVerify } from "jose";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "arpos-admin-secret-change-in-production"
);

export interface SyncTokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function verifySyncToken(token: string): Promise<{
  client: { id: string; email: string; name: string };
  license: { id: string; key: string } | null;
}> {
  const { payload } = await jwtVerify(token, secret);
  const data = payload as unknown as SyncTokenPayload;

  const client = await prisma.client.findUnique({
    where: { id: data.id },
    include: {
      licenses: {
        where: { status: "active" },
        take: 1,
      },
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  return {
    client: { id: client.id, email: client.email, name: client.name },
    license: client.licenses[0]
      ? { id: client.licenses[0].id, key: client.licenses[0].key }
      : null,
  };
}
