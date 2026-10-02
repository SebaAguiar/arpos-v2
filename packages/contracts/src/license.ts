import { z } from "zod";

/**
 * License issuance contract, shared by the cloud API (admin-panel) and the POS
 * (pos-react).
 *
 * Why this schema exists: the POS derives its entire paid-feature gate from the
 * signed license token, so the request that produces that token is part of the
 * trust boundary. Both sides MUST agree on the shape; a permissive schema here
 * would let a client omit fields the server assumes are present.
 */

// ─── Feature flags ─────────────────────────────────────────────
// Keyed by plan (Plan.features). Kept open on purpose: the plan catalogue
// lives in the DB and adding a flag must not require a deploy of every app.
export const licenseFeaturesSchema = z.record(z.boolean());

export type LicenseFeatures = z.infer<typeof licenseFeaturesSchema>;

// ─── Signed token claims ───────────────────────────────────────
// Mirrors LicenseTokenPayload in admin-panel/src/server/license-signer.ts.
// The POS verifies these claims offline with the Ed25519 public key baked in
// at build time, so this is the contract the UI actually reads.
export const licenseClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
  planSlug: z.string().min(1),
  planName: z.string().min(1),
  maxStores: z.number().int().positive(),
  features: licenseFeaturesSchema,
  validFrom: z.string(),
  validUntil: z.string(),
});

export type LicenseClaims = z.infer<typeof licenseClaimsSchema>;

// ─── POST /api/license/issue ───────────────────────────────────
export const licenseIssueRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type LicenseIssueRequest = z.infer<typeof licenseIssueRequestSchema>;

// ─── Device binding ────────────────────────────────────────────
// The device proves possession of a private key it generated on first run.
// The server stores the public key and only ever issues a license token to a
// request signed by the matching private key, so knowing an email is no
// longer enough to mint a license.
export const deviceRegistrationRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  devicePublicKey: z.string().min(1),
  deviceLabel: z.string().max(120).optional(),
});

export type DeviceRegistrationRequest = z.infer<
  typeof deviceRegistrationRequestSchema
>;

export const deviceRegistrationResponseSchema = z.object({
  deviceId: z.string().min(1),
  // True when this call created a new binding; false when an existing
  // registration was returned (idempotent re-registration on reinstall).
  created: z.boolean(),
});

export type DeviceRegistrationResponse = z.infer<
  typeof deviceRegistrationResponseSchema
>;

// Signed proof-of-possession sent with every license request.
//
// The proof is a compact JWS (`header.payload.signature`) signed with the
// device's Ed25519 private key. It carries `iat`/`exp` so replay bounding is
// enforced by signature verification rather than by hand-rolled timestamp
// math, and it names the email it was issued for so a captured proof cannot be
// replayed against a different account.
//
// The header names live here, not in the POS or the admin-panel, because both
// ends have to agree on them literally and a typo would surface as an opaque
// signature failure instead of a missing-header error.
export const DEVICE_PROOF_HEADERS = {
  deviceId: "x-arcom-device-id",
  proof: "x-arcom-device-proof",
} as const;

export const deviceProofHeadersSchema = z.object({
  [DEVICE_PROOF_HEADERS.deviceId]: z.string().min(1),
  [DEVICE_PROOF_HEADERS.proof]: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      "compact JWS with three segments",
    ),
});

export type DeviceProofHeaders = z.infer<typeof deviceProofHeadersSchema>;

/** How long a device proof stays acceptable after it was issued, in seconds. */
export const DEVICE_PROOF_MAX_AGE_SECONDS = 300;

// ─── Shared responses ──────────────────────────────────────────
export const licenseIssueResponseSchema = z.object({
  valid: z.boolean(),
  token: z.string(),
  license: licenseClaimsSchema,
});

export type LicenseIssueResponse = z.infer<typeof licenseIssueResponseSchema>;

// A stable error envelope so the POS can distinguish "this identity is not
// entitled" (hard gate, close paid features) from "try again later"
// (transient, keep the cached license).
export const LICENSE_ERROR_CODES = [
  "unknown_email",
  "no_active_subscription",
  "device_not_registered",
  "device_signature_invalid",
  "device_limit_reached",
  "rate_limited",
  "server_error",
] as const;

export const licenseErrorSchema = z.object({
  valid: z.literal(false),
  code: z.enum(LICENSE_ERROR_CODES),
  error: z.string(),
});

export type LicenseErrorCode = (typeof LICENSE_ERROR_CODES)[number];
export type LicenseError = z.infer<typeof licenseErrorSchema>;

/**
 * Errors that mean the identity itself is not entitled. The POS treats these as
 * a hard gate (revoke cached license); everything else degrades to offline.
 */
export const HARD_DENIAL_CODES = [
  "unknown_email",
  "no_active_subscription",
  "device_signature_invalid",
] as const satisfies readonly LicenseErrorCode[];

export function isHardDenial(code: LicenseErrorCode): boolean {
  return (HARD_DENIAL_CODES as readonly string[]).includes(code);
}
