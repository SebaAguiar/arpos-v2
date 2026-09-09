import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { jwtVerify, importSPKI } from 'jose';
import { AuthRepository } from './auth.repository';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

// Protocol claims shared with the admin signer (apps/admin-panel) and the POS
// verifier (apps/pos-react/src/lib/license.ts).
const LICENSE_ISSUER = 'arcom-admin';
const LICENSE_AUDIENCE = 'arcom-pos';

// DEV key pair matching apps/admin-panel/.env. For production the API must be
// given LICENSE_PUBLIC_KEY (SPKI PEM) and the POS VITE_LICENSE_PUBLIC_KEY with
// the same value — a mismatch rejects otherwise valid licenses.
const DEV_LICENSE_PUBLIC_KEY =
  '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAUkhabgK5W7rjvxuR3e1sa67XSieFUKXfFTPSgYzTBqQ=\n-----END PUBLIC KEY-----\n';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserPayload | null> {
    const user = await this.authRepo.findActiveByEmail(email);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    };
  }

  async login(user: UserPayload) {
    const payload = { sub: user.id, companyId: user.companyId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // License bridge: verify the EdDSA license token the POS already trusts,
  // provision/resolve the local user, and mint the standard HS256 session.
  // Mirroring the POS (lib/license.ts), expiry is ignored here — the license
  // status gates paid features, never local identity (offline-first).
  async loginWithLicense(licenseToken: string) {
    const payload = await this.verifyLicenseToken(licenseToken);
    if (!payload?.email) {
      throw new UnauthorizedException('Invalid license token');
    }

    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new UnauthorizedException('Local workspace not configured');
    }

    const user = await this.authRepo.findOrCreateFromLicense(
      payload.email,
      payload.name,
      companyId,
    );

    return this.login({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    });
  }

  // Offline-first local session: resolve a device user bound to the local
  // company without any dependency on the admin license panel. The provided
  // email is best-effort display identity; when absent we fall back to the
  // local company's default device identity. Grants a free-tier session that
  // serves the full core POS; the license only gates launcher updates and paid
  // features downstream.
  async loginWithLocalIdentity(
    email?: string,
    name?: string,
  ): Promise<ReturnType<AuthService['login']>> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new UnauthorizedException('Local workspace not configured');
    }

    const resolvedEmail = email ?? 'device@local';
    const resolvedName = name ?? 'Dispositivo local';

    const user = await this.authRepo.findOrCreateFromLicense(
      resolvedEmail,
      resolvedName,
      companyId,
    );

    return this.login({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    });
  }

  private async verifyLicenseToken(
    token: string,
  ): Promise<{ email: string; name: string } | null> {
    try {
      const publicKeyPem = this.configService.get<string>(
        'LICENSE_PUBLIC_KEY',
        DEV_LICENSE_PUBLIC_KEY,
      );
      const publicKey = await importSPKI(publicKeyPem, 'EdDSA');
      const { payload } = await jwtVerify(token, publicKey, {
        issuer: LICENSE_ISSUER,
        audience: LICENSE_AUDIENCE,
        // Ignore `exp` so grace/expired licenses still resolve identity — the
        // POS gates paid features, this endpoint only bridges identity.
        currentDate: new Date(0),
      });
      return {
        email: (payload.email as string) ?? '',
        name: (payload.name as string) ?? '',
      };
    } catch {
      return null;
    }
  }

  async getProfile(userId: string) {
    const user = await this.authRepo.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
