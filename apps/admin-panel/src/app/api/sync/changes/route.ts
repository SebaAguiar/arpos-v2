import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySyncToken } from "@/lib/auth-sync";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let clientInfo: { client: { id: string } };
    try {
      clientInfo = await verifySyncToken(auth.slice(7));
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? parseInt(sinceParam, 10) : 0;

    if (isNaN(since)) {
      return NextResponse.json(
        { error: "Invalid since parameter" },
        { status: 400 },
      );
    }

    const changes = await prisma.syncedChange.findMany({
      where: {
        clientId: clientInfo.client.id,
        createdAt: { gt: since },
      },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: {
        action: true,
        entity: true,
        entityId: true,
        payload: true,
        createdAt: true,
      },
    });

    const mapped = changes.map((c) => ({
      action: c.action,
      entity: c.entity,
      entityId: c.entityId,
      payload: JSON.parse(c.payload),
      updatedAt: c.createdAt,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Sync changes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
