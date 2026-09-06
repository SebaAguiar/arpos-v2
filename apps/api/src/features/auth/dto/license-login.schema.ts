import { z } from 'zod';

// Bridge between the POS license identity (EdDSA-signed by the admin) and the
// local sidecar session (HS256 auth_token). The license token is the identity
// the POS already trusts offline; this endpoint turns it into the API session.
export const LicenseLoginSchema = z.object({
  licenseToken: z.string().min(1, 'License token is required'),
});

export type LicenseLoginInput = z.infer<typeof LicenseLoginSchema>;