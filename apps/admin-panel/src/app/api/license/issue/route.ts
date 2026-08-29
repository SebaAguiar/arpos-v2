import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { signLicenseToken } from '@/server/license-signer';

const POS_PRODUCT_ID = 'pos-product-seed';
const FREE_TERM_DAYS = 365;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const client = await db.client.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const subscription = await db.subscription.findFirst({
      where: {
        clientId: client.id,
        productId: POS_PRODUCT_ID,
        status: { in: ['active', 'paused'] },
      },
      include: {
        plan: {
          select: {
            name: true,
            slug: true,
            features: true,
            maxStoresDefault: true,
            priceDefaultCents: true,
            termDaysDefault: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription', valid: false },
        { status: 404 },
      );
    }

    const isPaidPlan = subscription.plan.priceDefaultCents > 0;
    const validFrom = client.createdAt;
    const validUntil = isPaidPlan
      ? (subscription.renewalDate ??
          addDays(subscription.startDate, subscription.plan.termDaysDefault))
      : addDays(validFrom, FREE_TERM_DAYS);

    const maxStores =
      subscription.maxStoresOverride ?? subscription.plan.maxStoresDefault;

    const token = await signLicenseToken({
      sub: client.id,
      email: client.email,
      name: client.name,
      planSlug: subscription.plan.slug,
      planName: subscription.plan.name,
      maxStores,
      features: subscription.plan.features as Record<string, boolean>,
      validFrom,
      validUntil,
    });

    return NextResponse.json({
      valid: true,
      token,
      license: {
        sub: client.id,
        email: client.email,
        name: client.name,
        planSlug: subscription.plan.slug,
        planName: subscription.plan.name,
        maxStores,
        features: subscription.plan.features,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      },
    });
  } catch (error) {
    console.error('[license-issue] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
