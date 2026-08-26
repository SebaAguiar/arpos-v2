export const prerender = false;

import type { APIRoute } from 'astro';

const MP_CHECKOUT_BASE = 'https://www.mercadopago.com.ar/subscriptions/checkout';

const MP_PLAN_IDS: Record<string, string | undefined> = {
  pro: import.meta.env.MP_PLAN_ID_PRO,
  enterprise: import.meta.env.MP_PLAN_ID_ENTERPRISE,
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { planId, payerEmail } = body;

    if (!planId || !payerEmail) {
      return new Response(
        JSON.stringify({ error: 'planId and payerEmail are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mpPlanId = MP_PLAN_IDS[planId];
    if (!mpPlanId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const externalReference = `${payerEmail.trim().toLowerCase()}:${planId}`;
    const checkoutUrl = `${MP_CHECKOUT_BASE}?preapproval_plan_id=${mpPlanId}&external_reference=${encodeURIComponent(externalReference)}`;

    return new Response(
      JSON.stringify({ initPoint: checkoutUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
