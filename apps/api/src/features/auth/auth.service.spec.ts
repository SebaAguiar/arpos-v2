import { UnauthorizedException } from '@nestjs/common';
import { SignJWT, generateKeyPair, exportSPKI, type KeyLike } from 'jose';
import { AuthService } from './auth.service';

const ISSUER = 'arcom-admin';
const AUDIENCE = 'arcom-pos';

async function signLicense(overrides: {
  issuer?: string;
  audience?: string;
  email?: string;
  name?: string;
  privateKey: KeyLike;
}): Promise<string> {
  const validFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return new SignJWT({
    email: overrides.email ?? 'license@acme.test',
    name: overrides.name ?? 'ACME Licensee',
    planSlug: 'pro',
    planName: 'Profesional',
    maxStores: 1,
    features: {},
    validFrom: validFrom.toISOString(),
    validUntil: validUntil.toISOString(),
  })
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? AUDIENCE)
    .setSubject('cli-001')
    .setIssuedAt()
    .setExpirationTime(validUntil)
    .sign(overrides.privateKey);
}

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: { findOrCreateFromLicense: jest.Mock };
  let mockJwt: { sign: jest.Mock };
  let mockConfig: { get: jest.Mock };
  let mockTenant: { getCompanyId: jest.Mock };
  let privateKey: KeyLike;
  let publicKeyPem: string;

  beforeAll(async () => {
    const { privateKey: keyPair, publicKey } = await generateKeyPair('EdDSA');
    publicKeyPem = await exportSPKI(publicKey);
    privateKey = keyPair;
  });

  beforeEach(() => {
    mockRepo = { findOrCreateFromLicense: jest.fn() };
    mockJwt = { sign: jest.fn().mockReturnValue('minted-session-token') };
    mockConfig = { get: jest.fn().mockImplementation((key: string) => (key === 'LICENSE_PUBLIC_KEY' ? publicKeyPem : undefined)) };
    mockTenant = { getCompanyId: jest.fn().mockReturnValue('company-1') };
    service = new AuthService(
      mockRepo as never,
      mockJwt as never,
      mockConfig as never,
      mockTenant as never,
    );
  });

  it('mints a local session for a valid license token', async () => {
    const token = await signLicense({ privateKey });

    mockRepo.findOrCreateFromLicense.mockResolvedValue({
      id: 'user-1',
      email: 'license@acme.test',
      name: 'ACME Licensee',
      role: 'cashier',
      companyId: 'company-1',
    });

    const result = await service.loginWithLicense(token);

    expect(mockRepo.findOrCreateFromLicense).toHaveBeenCalledWith(
      'license@acme.test',
      'ACME Licensee',
      'company-1',
    );
    expect(mockJwt.sign).toHaveBeenCalledWith({ sub: 'user-1', companyId: 'company-1' });
    expect(result).toEqual({
      access_token: 'minted-session-token',
      user: {
        id: 'user-1',
        email: 'license@acme.test',
        name: 'ACME Licensee',
        role: 'cashier',
      },
    });
  });

  it('rejects a license token addressed to a different audience', async () => {
    const token = await signLicense({ privateKey, audience: 'another-app' });

    await expect(service.loginWithLicense(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(mockRepo.findOrCreateFromLicense).not.toHaveBeenCalled();
  });

  it('rejects a tampered license token', async () => {
    const token = await signLicense({ privateKey });
    // Flip a payload byte so the signature no longer matches.
    const [header, payload, signature] = token.split('.');
    const brokenPayload = Buffer.from(
      Buffer.from(payload, 'base64url').toString().replace('acme', 'ACME'),
    ).toString('base64url');

    await expect(
      service.loginWithLicense([header, brokenPayload, signature].join('.')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when the local workspace has no company yet', async () => {
    const token = await signLicense({ privateKey });
    mockTenant.getCompanyId.mockReturnValue('');

    await expect(service.loginWithLicense(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});