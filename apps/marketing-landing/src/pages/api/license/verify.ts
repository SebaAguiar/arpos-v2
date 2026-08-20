export const prerender = false;

import type { APIRoute } from 'astro';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

const preapproval = new PreApproval(client);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { preapprovalId } = body;

    if (!preapprovalId) {
      return new Response(
        JSON.stringify({ error: 'preapprovalId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const subscription = await preapproval.get({ id: preapprovalId });

    const isActive = subscription.status === 'authorized';
    const isPaused = subscription.status === 'paused';

    return new Response(
      JSON.stringify({
        valid: isActive || isPaused,
        status: subscription.status,
        plan: subscription.reason,
        nextPaymentDate: subscription.next_payment_date,
        amount: subscription.auto_recurring?.transaction_amount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('License verify error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Verification failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
