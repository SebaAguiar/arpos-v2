import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email },
      include: {
        licenses: {
          where: { status: "active" },
          include: { plan: true },
        },
      },
    });

    if (!client || !client.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const validPassword = await compare(password, client.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    await prisma.client.update({
      where: { id: client.id },
      data: { lastActiveAt: now },
    });

    const activeLicense = client.licenses[0];

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
      license: activeLicense
        ? {
            id: activeLicense.id,
            key: activeLicense.key,
            plan: activeLicense.plan.slug,
            status: activeLicense.status,
            features: {
              cloudStorage: activeLicense.plan.cloudStorage,
              syncEnabled: activeLicense.plan.syncEnabled,
              arcaEnabled: activeLicense.plan.arcaEnabled,
              reportsAdvanced: activeLicense.plan.reportsAdvanced,
              maxDevices: activeLicense.plan.maxDevices,
              maxStores: activeLicense.plan.maxStores,
            },
            expiresAt: activeLicense.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
