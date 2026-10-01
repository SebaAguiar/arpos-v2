// Node-native unit tests for the webhook security boundary.
// Run with: node --test src/lib/webhook-security.test.mjs
// (An .mjs file on purpose: Node's type stripping needs explicit .ts
//  extensions on relative imports, which tsc would reject in a .ts test.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { InvalidWebhookSignatureError } from 'mercadopago';
import {
  validateWebhookSignature,
  MissingWebhookSecretError,
} from './webhook-security.ts';

const SECRET = 'TEST-1234567890abcdef-secret';
const DATA_ID = '123456789';
const REQUEST_ID = 'a1b2c3d4';

/**
 * Reproduce the documented MercadoPago signing algorithm to build a real
 * `x-signature` header for a given payload:
 *
 *   manifest = `id:{data.id};request-id:{x-request-id};ts:{ts};`
 *   v1       = hex(HMAC-SHA256(secret, manifest))
 *   header   = `ts={ts},v1={v1}`
 */
function sign(dataId, requestId, ts, secret) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

function signedInput(overrides = {}) {
  const ts = String(Date.now());
  return {
    secret: SECRET,
    xSignature: `ts=${ts},v1=${sign(DATA_ID, REQUEST_ID, ts, SECRET)}`,
    xRequestId: REQUEST_ID,
    dataId: DATA_ID,
    ...overrides,
  };
}

test('accepts a validly signed request', () => {
  assert.doesNotThrow(() => validateWebhookSignature(signedInput()));
});

test('rejects a signature for a different payload (tampered data.id)', () => {
  const tampered = signedInput({ dataId: '999999999' });
  // v1 was built for DATA_ID, so the manifest no longer matches.
  assert.throws(() => validateWebhookSignature(tampered), InvalidWebhookSignatureError);
});

test('rejects a signature built with a different secret', () => {
  const ts = String(Date.now());
  const forged = signedInput({
    xSignature: `ts=${ts},v1=${sign(DATA_ID, REQUEST_ID, ts, 'wrong-secret')}`,
  });
  assert.throws(() => validateWebhookSignature(forged), InvalidWebhookSignatureError);
});

test('rejects a request with no signature header (unauthenticated POST)', () => {
  assert.throws(() => validateWebhookSignature(signedInput({ xSignature: undefined })));
});

test('rejects a request with no x-request-id', () => {
  let threw = false;
  try {
    validateWebhookSignature(signedInput({ xRequestId: undefined }));
  } catch {
    threw = true; // SDK requires request-id to build the manifest
  }
  assert.ok(threw, 'expected validation to fail without x-request-id');
});

test('fails closed when the secret is missing (empty string)', () => {
  assert.throws(
    () => validateWebhookSignature(signedInput({ secret: '' })),
    MissingWebhookSecretError,
  );
});