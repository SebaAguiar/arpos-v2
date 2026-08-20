import { Injectable } from '@kanjijs/core';
import { Controller, Post } from '@kanjijs/platform-hono';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { createHmac, timingSafeEqual } from 'crypto';

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

const MercadoPagoWebhookSchema = z.object({
  id: z.number(),
  type: z.string(),
  date_created: z.string(),
  user_id: z.number().optional(),
  api_version: z.string().optional(),
  action: z.string().optional(),
  data: z.object({
    id: z.string(),
  }).optional(),
});

function verifySignature(signature: string | undefined | null, body: string, secret: string): boolean {
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(',').map(p => {
      const [key, ...val] = p.split('=');
      return [key!, val.join('=')];
    })
  );

  const expected = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const received = parts.ts !== undefined
    ? parts.v1
    : parts.v1;

  if (!received || !expected) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

@Injectable()
@Controller('/webhooks')
export class WebhookController {
  @Post('/mercadopago')
  @Contract({
    method: 'POST',
    path: '/webhooks/mercadopago',
    request: { body: MercadoPagoWebhookSchema },
    responses: { 200: z.object({ received: z.boolean() }) },
  })
  async handleMercadoPago(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof MercadoPagoWebhookSchema>;

    if (WEBHOOK_SECRET) {
      const rawBody = await c.req.raw.text();
      const signature = c.req.header('x-signature');
      if (!verifySignature(signature, rawBody, WEBHOOK_SECRET)) {
        return c.json({ error: 'Forbidden', message: 'Invalid webhook signature' }, 403);
      }
    }

    // TODO: Process webhook based on type
    // - payment: update payment status
    // - subscription: update subscription status
    // - invoice: update invoice status

    return { received: true };
  }
}
