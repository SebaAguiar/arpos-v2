import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { signToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = ["ARCOM"];
  for (let s = 0; s < 3; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join("-");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, instanceId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.client.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const now = Math.floor(Date.now() / 1000);

    const freePlan = await prisma.plan.findUnique({
      where: { slug: "free" },
    });

    if (!freePlan) {
      return NextResponse.json(
        { error: "Free plan not configured" },
        { status: 500 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        passwordHash,
        source: instanceId ? "in-app" : "landing",
        totalDevices: instanceId ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    const licenseKey = generateLicenseKey();

    const license = await prisma.license.create({
      data: {
        clientId: client.id,
        planId: freePlan.id,
        instanceId: instanceId || null,
        key: licenseKey,
        status: instanceId ? "active" : "pending",
        activatedAt: instanceId ? now : null,
        createdAt: now,
        updatedAt: now,
      },
    });

    const token = await signToken({
      id: client.id,
      email: client.email,
      role: "client",
    });

    return NextResponse.json({
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      license: {
        id: license.id,
        key: license.key,
        plan: freePlan.slug,
        status: license.status,
        features: {
          cloudStorage: freePlan.cloudStorage,
          syncEnabled: freePlan.syncEnabled,
          arcaEnabled: freePlan.arcaEnabled,
          reportsAdvanced: freePlan.reportsAdvanced,
          maxDevices: freePlan.maxDevices,
          maxStores: freePlan.maxStores,
        },
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
