export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

const POS_PRODUCT_ID = 'pos-product-seed';
const FREE_PLAN_SLUG = 'free';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const nameFromEmail = normalizedEmail.split('@')[0];

    const client = await db.client.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        name: nameFromEmail,
        source: 'landing_free',
      },
    });

    const plan = await db.plan.findFirst({
      where: { productId: POS_PRODUCT_ID, slug: FREE_PLAN_SLUG },
    });

    if (!plan) {
      console.error('[signup-free] Free plan not found in DB. Run seed first.');
      return new Response(
        JSON.stringify({ error: 'Plan not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingSubscription = await db.subscription.findFirst({
      where: { clientId: client.id, planId: plan.id },
    });

    if (!existingSubscription) {
      await db.subscription.create({
        data: {
          clientId: client.id,
          productId: POS_PRODUCT_ID,
          planId: plan.id,
          status: 'active',
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        client: { id: client.id, email: client.email, name: client.name },
        plan: { name: plan.name, slug: plan.slug },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[signup-free] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
