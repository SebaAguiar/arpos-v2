import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: string;
}

const JWT_EXPIRY = '24h';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign({ ...payload }, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch {
    return null;
  }
}
