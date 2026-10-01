/**
 * Fail the production build when webhook configuration is missing.
 *
 * The MercadoPago webhook is fail-closed: without MP_WEBHOOK_SECRET it
 * refuses every request with HTTP 503, so a production deployment lacking
 * the secret silently breaks subscription notifications. This guard turns
 * that silent runtime failure into a build error in production deploys
 * (Vercel sets VERCEL_ENV=production during production builds).
 *
 * Local and preview builds are intentionally not enforced so developers
 * can build without real credentials — the webhook still fails closed at
 * request time there. Enforce with VERCEL_ENV=production (or
 * NODE_ENV=production) to gate any other pipeline.
 */

const isProduction =
  process.env.VERCEL_ENV === 'production' ||
  (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production');

const REQUIRED = ['MP_WEBHOOK_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (isProduction && missing.length > 0) {
  console.error(
    `[check-env] Missing required production env var(s): ${missing.join(', ')}`,
  );
  console.error(
    '[check-env] The MercadoPago webhook is fail-closed: without these it would 503 every payment event.',
  );
  console.error('[check-env] Set them in the Vercel project settings and redeploy.');
  process.exit(1);
}

console.log(
  isProduction
    ? '[check-env] Production env OK'
    : '[check-env] Skipped (not a production build)',
);