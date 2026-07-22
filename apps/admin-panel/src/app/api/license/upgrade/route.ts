import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { licenseId, newPlanSlug } = body;

    if (!licenseId || !newPlanSlug) {
      return NextResponse.json(
        { error: "licenseId and newPlanSlug are required" },
        { status: 400 }
      );
    }

    const newPlan = await prisma.plan.findUnique({
      where: { slug: newPlanSlug },
    });

    if (!newPlan || !newPlan.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive plan" },
        { status: 404 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { plan: true, client: true },
    });

    if (!license) {
      return NextResponse.json(
        { error: "License not found" },
        { status: 404 }
      );
    }

    if (license.clientId !== payload.id) {
      return NextResponse.json(
        { error: "Not your license" },
        { status: 403 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    const updatedLicense = await prisma.license.update({
      where: { id: licenseId },
      data: {
        planId: newPlan.id,
        expiresAt: null,
        updatedAt: now,
      },
      include: { plan: true },
    });

    return NextResponse.json({
      success: true,
      license: {
        id: updatedLicense.id,
        key: updatedLicense.key,
        plan: updatedLicense.plan.slug,
        status: updatedLicense.status,
        features: {
          cloudStorage: updatedLicense.plan.cloudStorage,
          syncEnabled: updatedLicense.plan.syncEnabled,
          arcaEnabled: updatedLicense.plan.arcaEnabled,
          reportsAdvanced: updatedLicense.plan.reportsAdvanced,
          maxDevices: updatedLicense.plan.maxDevices,
          maxStores: updatedLicense.plan.maxStores,
        },
        expiresAt: updatedLicense.expiresAt,
      },
    });
  } catch (error) {
    console.error("License upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
