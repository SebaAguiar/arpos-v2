export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, data } = body;

    // MercadoPago sends different notification types
    // For subscriptions: "preapproval" type
    if (type === 'preapproval') {
      const preapprovalId = data?.id;
      if (!preapprovalId) {
        return new Response(
          JSON.stringify({ error: 'Missing preapproval ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // TODO: Fetch preapproval details from MercadoPago API
      // TODO: Update license status in your database
      // TODO: Send confirmation email

      console.log(`[webhook] Preapproval notification: ${preapprovalId}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
