import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { SessionProvider } from '@kanjijs/auth';
import { eq } from 'drizzle-orm';
import { adminUsers } from '@/database/schema';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { LoginRequest, LoginResponse } from './contracts';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CLIENT) private db: Database,
    private session: SessionProvider,
  ) {}

  private hashPassword(password: string, salt: string): string {
    return createHash('sha256')
      .update(salt + password)
      .digest('hex');
  }

  private verifyPassword(password: string, passwordHash: string): boolean {
    const [storedHash, salt] = passwordHash.split(':');
    const computedHash = this.hashPassword(password, salt);
    return computedHash === storedHash;
  }

  async login(input: LoginRequest): Promise<LoginResponse> {
    const rows = await this.db.query.adminUsers
      .where({ email: input.email })
      .limit(1);

    const user = rows[0];
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.active) {
      throw new Error('Usuario desactivado');
    }

    const valid = this.verifyPassword(input.password, user.password_hash as string);
    if (!valid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.session.createToken(
      {
        userId: user.id as string,
        email: user.email as string,
        name: user.name as string,
        roles: [user.role as string],
        scopes: ['admin'],
      },
      60 * 60 * 24, // 24h
    );

    return {
      token,
      user: {
        id: user.id as string,
        email: user.email as string,
        name: user.name as string,
        role: user.role as string,
      },
    };
  }

  async getMe(userId: string) {
    const rows = await this.db.query.adminUsers
      .where({ id: userId })
      .limit(1);

    const user = rows[0];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      role: user.role as string,
      active: user.active as boolean,
      createdAt: user.created_at as Date,
    };
  }

  static hashPasswordStatic(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(salt + password)
      .digest('hex');
    return `${hash}:${salt}`;
  }
}
