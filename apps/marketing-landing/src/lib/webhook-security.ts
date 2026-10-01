import { WebhookSignatureValidator } from 'mercadopago';

/**
 * Raised when MP_WEBHOOK_SECRET is missing.
 *
 * The webhook must never process a request without a configured secret
 * (fail-closed): the endpoint is public and an unauthenticated POST could
 * otherwise mutate the subscription DB.
 */
export class MissingWebhookSecretError extends Error {
  readonly name = 'MissingWebhookSecretError';

  constructor() {
    super(
      'MP_WEBHOOK_SECRET is not configured. The webhook refuses to process requests without it.',
    );
  }
}

export interface WebhookSignatureInput {
  /** MP_WEBHOOK_SECRET — the shared secret used to sign notifications. */
  secret: string;
  /** `x-signature` header value (`ts=...,v1=...`). */
  xSignature?: string;
  /** `x-request-id` header value. */
  xRequestId?: string;
  /** `id` query param (`data.id`) of the notified resource. */
  dataId?: string;
}

/**
 * Security boundary of the MercadoPago subscription webhook.
 *
 * Verifies that a request was signed by MercadoPago with `secret`. Throws:
 * - {@link MissingWebhookSecretError} when no secret is configured (fail-closed)
 * - `mercadopago`'s `InvalidWebhookSignatureError` when the signature doesn't match
 *
 * Pure function — no Astro, no env access, no DB — so the fail-closed
 * behavior is unit-testable in isolation.
 */
export function validateWebhookSignature(input: WebhookSignatureInput): void {
  if (!input.secret) {
    throw new MissingWebhookSecretError();
  }
  WebhookSignatureValidator.validate({
    xSignature: input.xSignature,
    xRequestId: input.xRequestId,
    dataId: input.dataId,
    secret: input.secret,
  });
}