import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySyncToken } from "@/lib/auth-sync";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let clientInfo: { client: { id: string }; license: { id: string } | null };
    try {
      clientInfo = await verifySyncToken(auth.slice(7));
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { action, entity, entityId, payload } = body;

    if (!action || !entity || !entityId) {
      return NextResponse.json(
        { error: "action, entity, and entityId are required" },
        { status: 400 },
      );
    }

    const validActions = ["create", "update", "delete"];
    const validEntities = ["product", "contact", "inventory"];

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!validEntities.includes(entity)) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);

    await prisma.syncedChange.create({
      data: {
        clientId: clientInfo.client.id,
        licenseId: clientInfo.license?.id ?? null,
        action,
        entity,
        entityId,
        payload: JSON.stringify(payload ?? {}),
        source: "pos",
        createdAt: now,
      },
    });

    return NextResponse.json({ success: true, receivedAt: now });
  } catch (error) {
    console.error("Sync apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
