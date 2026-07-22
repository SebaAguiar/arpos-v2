import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, email } = body;

    if (!instanceId || !email) {
      return NextResponse.json(
        { error: "instanceId and email are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const license = await prisma.license.findFirst({
      where: {
        clientId: client.id,
        instanceId,
        status: "active",
      },
      include: { plan: true },
    });

    if (!license) {
      const anyLicense = await prisma.license.findFirst({
        where: { clientId: client.id, status: "active" },
        include: { plan: true },
      });

      if (anyLicense) {
        if (anyLicense.plan.maxDevices <= 1) {
          return NextResponse.json(
            { error: "License tied to different instance. Upgrade plan for multi-device." },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: "No active license for this instance" },
        { status: 403 }
      );
    }

    if (license.expiresAt && license.expiresAt < Math.floor(Date.now() / 1000)) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "License expired" },
        { status: 403 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    await prisma.license.update({
      where: { id: license.id },
      data: { lastSeenAt: now },
    });

    await prisma.client.update({
      where: { id: client.id },
      data: { lastActiveAt: now },
    });

    return NextResponse.json({
      valid: true,
      plan: license.plan.slug,
      features: {
        cloudStorage: license.plan.cloudStorage,
        syncEnabled: license.plan.syncEnabled,
        arcaEnabled: license.plan.arcaEnabled,
        reportsAdvanced: license.plan.reportsAdvanced,
        maxDevices: license.plan.maxDevices,
        maxStores: license.plan.maxStores,
      },
      expiresAt: license.expiresAt,
    });
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
