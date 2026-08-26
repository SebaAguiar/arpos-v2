import { NextResponse } from 'next/server';
import { db } from '@/server/db';

const POS_PRODUCT_ID = 'pos-product-seed';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Email is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const client = await db.client.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!client) {
      return NextResponse.json({ valid: false });
    }

    const subscription = await db.subscription.findFirst({
      where: {
        clientId: client.id,
        productId: POS_PRODUCT_ID,
        status: { in: ['active', 'paused'] },
      },
      include: {
        plan: {
          select: { name: true, slug: true, features: true, maxStoresDefault: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      client: { id: client.id, name: client.name, email: client.email },
      plan: {
        name: subscription.plan.name,
        slug: subscription.plan.slug,
        features: subscription.plan.features,
        maxStores: subscription.maxStoresOverride ?? subscription.plan.maxStoresDefault,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        renewalDate: subscription.renewalDate,
        startDate: subscription.startDate,
      },
    });
  } catch (error) {
    console.error('[license-verify] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
