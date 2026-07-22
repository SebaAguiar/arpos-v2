import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, instanceId } = body;

    if (!key || !instanceId) {
      return NextResponse.json(
        { error: "key and instanceId are required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { key },
      include: { plan: true, client: true },
    });

    if (!license) {
      return NextResponse.json(
        { error: "Invalid activation key" },
        { status: 404 }
      );
    }

    if (license.status === "suspended") {
      return NextResponse.json(
        { error: "License suspended. Contact support." },
        { status: 403 }
      );
    }

    if (license.expiresAt && license.expiresAt < Math.floor(Date.now() / 1000)) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "License expired. Please renew." },
        { status: 403 }
      );
    }

    if (license.instanceId && license.instanceId !== instanceId) {
      return NextResponse.json(
        { error: "This key is already linked to another installation" },
        { status: 409 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    await prisma.license.update({
      where: { id: license.id },
      data: {
        instanceId,
        status: "active",
        activatedAt: now,
        updatedAt: now,
      },
    });

    await prisma.client.update({
      where: { id: license.clientId },
      data: {
        totalDevices: { increment: license.instanceId ? 0 : 1 },
        lastActiveAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        name: license.client.name,
        email: license.client.email,
      },
      license: {
        plan: license.plan.slug,
        status: "active",
        features: {
          cloudStorage: license.plan.cloudStorage,
          syncEnabled: license.plan.syncEnabled,
          arcaEnabled: license.plan.arcaEnabled,
          reportsAdvanced: license.plan.reportsAdvanced,
          maxDevices: license.plan.maxDevices,
          maxStores: license.plan.maxStores,
        },
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error("License activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
