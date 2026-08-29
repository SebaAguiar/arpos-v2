import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';

export interface LicenseTokenPayload {
  sub: string;
  email: string;
  name: string;
  planSlug: string;
  planName: string;
  maxStores: number;
  features: Record<string, boolean>;
  validFrom: string;
  validUntil: string;
}

const ISSUER = 'arcom-admin';
const AUDIENCE = 'arcom-pos';
const ALG = 'EdDSA';

function getPrivateKey(): string {
  const key = process.env.LICENSE_PRIVATE_KEY;
  if (!key) {
    throw new Error('LICENSE_PRIVATE_KEY is not configured');
  }
  return key;
}

export function getLicensePublicKey(): string {
  const key = process.env.LICENSE_PUBLIC_KEY;
  if (!key) {
    throw new Error('LICENSE_PUBLIC_KEY is not configured');
  }
  return key;
}

export async function signLicenseToken(
  payload: Omit<LicenseTokenPayload, 'validFrom' | 'validUntil'> & {
    validFrom: Date;
    validUntil: Date;
  },
): Promise<string> {
  const privateKey = await importPKCS8(getPrivateKey(), ALG);

  const token = await new SignJWT({
    email: payload.email,
    name: payload.name,
    planSlug: payload.planSlug,
    planName: payload.planName,
    maxStores: payload.maxStores,
    features: payload.features,
    validFrom: payload.validFrom.toISOString(),
    validUntil: payload.validUntil.toISOString(),
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(payload.validUntil)
    .sign(privateKey);

  return token;
}

export async function verifyLicenseToken(
  token: string,
): Promise<LicenseTokenPayload | null> {
  const publicKey = await importSPKI(getLicensePublicKey(), ALG);
  try {
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return {
      sub: payload.sub ?? '',
      email: (payload.email as string) ?? '',
      name: (payload.name as string) ?? '',
      planSlug: (payload.planSlug as string) ?? '',
      planName: (payload.planName as string) ?? '',
      maxStores: (payload.maxStores as number) ?? 1,
      features: (payload.features as Record<string, boolean>) ?? {},
      validFrom: (payload.validFrom as string) ?? '',
      validUntil: (payload.validUntil as string) ?? '',
    };
  } catch {
    return null;
  }
}
