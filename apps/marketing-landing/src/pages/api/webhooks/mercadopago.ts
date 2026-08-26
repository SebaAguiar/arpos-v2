export const prerender = false;

import type { APIRoute } from 'astro';
import {
  MercadoPagoConfig,
  PreApproval,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from 'mercadopago';
import { db } from '../../../lib/db';

const mpClient = new MercadoPagoConfig({
  accessToken: import.meta.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

const preapproval = new PreApproval(mpClient);

const WEBHOOK_SECRET = import.meta.env.MP_WEBHOOK_SECRET || '';
const POS_PRODUCT_ID = 'pos-product-seed';

const MP_STATUS_MAP: Record<string, string> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'cancelled',
  pending: 'pending',
};

function parseExternalReference(
  ref: string | null | undefined,
): { email: string; planSlug: string } | null {
  if (!ref) return null;
  const parts = ref.split(':');
  if (parts.length !== 2) return null;
  const [email, planSlug] = parts;
  if (!email || !planSlug) return null;
  return {
    email: email.trim().toLowerCase(),
    planSlug: planSlug.trim().toLowerCase(),
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (WEBHOOK_SECRET) {
      const url = new URL(request.url);
      try {
        WebhookSignatureValidator.validate({
          xSignature: request.headers.get('x-signature') ?? undefined,
          xRequestId: request.headers.get('x-request-id') ?? undefined,
          dataId: url.searchParams.get('data.id') ?? undefined,
          secret: WEBHOOK_SECRET,
        });
      } catch (err) {
        if (err instanceof InvalidWebhookSignatureError) {
          console.error(`[webhook] Invalid signature: ${err.reason}`);
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw err;
      }
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'preapproval') {
      await handlePreapproval(data?.id);
    }

    if (type === 'preapproval_payment') {
      await handlePreapprovalPayment(data?.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handlePreapproval(preapprovalId: string | undefined) {
  if (!preapprovalId) return;

  const details = await preapproval.get({ id: preapprovalId });

  const payerEmail = details.payer_email;
  const externalRef = details.external_reference;
  const parsed = parseExternalReference(externalRef);

  const email = parsed?.email || payerEmail;
  if (!email) {
    console.error(`[webhook] No email found for preapproval ${preapprovalId}`);
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const planSlug = parsed?.planSlug || 'pro';
  const nameFromEmail = normalizedEmail.split('@')[0];
  const dbStatus = MP_STATUS_MAP[details.status || 'pending'] || 'pending';
  const amountCents = Math.round(
    (details.auto_recurring?.transaction_amount || 0) * 100,
  );
  const nextPaymentDate = details.next_payment_date
    ? new Date(details.next_payment_date)
    : null;

  const client = await db.client.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: {
      email: normalizedEmail,
      name: nameFromEmail,
      source: 'mercadopago',
    },
  });

  const plan = await db.plan.findFirst({
    where: { productId: POS_PRODUCT_ID, slug: planSlug },
  });

  if (!plan) {
    console.error(
      `[webhook] Plan "${planSlug}" not found for preapproval ${preapprovalId}`,
    );
    return;
  }

  const existingSub = await db.subscription.findFirst({
    where: { clientId: client.id, productId: POS_PRODUCT_ID },
  });

  let subscription;
  if (existingSub) {
    subscription = await db.subscription.update({
      where: { id: existingSub.id },
      data: {
        planId: plan.id,
        status: dbStatus,
        renewalDate: nextPaymentDate,
      },
    });
  } else {
    subscription = await db.subscription.create({
      data: {
        clientId: client.id,
        productId: POS_PRODUCT_ID,
        planId: plan.id,
        status: dbStatus,
        renewalDate: nextPaymentDate,
      },
    });
  }

  const existingPayment = await db.payment.findFirst({
    where: { externalRef: preapprovalId },
  });

  if (!existingPayment && amountCents > 0) {
    await db.payment.create({
      data: {
        clientId: client.id,
        subscriptionId: subscription.id,
        amountCents,
        currency: details.auto_recurring?.currency_id || 'ARS',
        status: dbStatus === 'active' ? 'paid' : 'pending',
        method: 'mercadopago_subscription',
        externalRef: preapprovalId,
        paidAt: dbStatus === 'active' ? new Date() : null,
      },
    });
  }

  console.log(
    `[webhook] Preapproval ${preapprovalId}: client=${normalizedEmail}, plan=${planSlug}, status=${dbStatus}`,
  );
}

async function handlePreapprovalPayment(preapprovalId: string | undefined) {
  if (!preapprovalId) return;

  const details = await preapproval.get({ id: preapprovalId });
  const email = details.payer_email;
  if (!email) return;

  const client = await db.client.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!client) return;

  const subscription = await db.subscription.findFirst({
    where: { clientId: client.id, productId: POS_PRODUCT_ID },
  });

  const amountCents = Math.round(
    (details.auto_recurring?.transaction_amount || 0) * 100,
  );

  const existingPayment = await db.payment.findFirst({
    where: { externalRef: preapprovalId },
  });

  if (!existingPayment) {
    await db.payment.create({
      data: {
        clientId: client.id,
        subscriptionId: subscription?.id || null,
        amountCents,
        currency: details.auto_recurring?.currency_id || 'ARS',
        status: 'paid',
        method: 'mercadopago_subscription',
        externalRef: preapprovalId,
        paidAt: new Date(),
      },
    });
  }

  if (subscription && details.next_payment_date) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: { renewalDate: new Date(details.next_payment_date) },
    });
  }

  console.log(
    `[webhook] Preapproval payment ${preapprovalId}: client=${email.trim().toLowerCase()}, amount=${amountCents}`,
  );
}
