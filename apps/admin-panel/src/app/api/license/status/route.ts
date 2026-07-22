import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: "instanceId is required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { instanceId },
      include: { client: true, plan: true },
    });

    if (!license) {
      return NextResponse.json(
        { error: "License not found" },
        { status: 404 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    await prisma.license.update({
      where: { id: license.id },
      data: { lastSeenAt: now },
    });

    await prisma.client.update({
      where: { id: license.clientId },
      data: { lastActiveAt: now },
    });

    return NextResponse.json({
      valid: true,
      client: {
        name: license.client.name,
        email: license.client.email,
        company: license.client.company,
      },
      license: {
        plan: license.plan.slug,
        status: license.status,
        expiresAt: license.expiresAt,
        features: {
          cloudStorage: license.plan.cloudStorage,
          syncEnabled: license.plan.syncEnabled,
          arcaEnabled: license.plan.arcaEnabled,
          reportsAdvanced: license.plan.reportsAdvanced,
          maxDevices: license.plan.maxDevices,
          maxStores: license.plan.maxStores,
        },
      },
    });
  } catch (error) {
    console.error("License status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
