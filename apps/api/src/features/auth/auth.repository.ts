import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../data-access/prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, is_active: true },
    });
  }

  async findById(userId: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, companyId: true },
    });
  }

  // Local side of the license bridge: reuse the device's user when it exists
  // (idempotent on every boot/login), otherwise provision one bound to the
  // local company. The password is an unusable random hash so the account can
  // never authenticate with credentials — the license is the only identity.
  async findOrCreateFromLicense(
    email: string,
    name: string,
    companyId: string,
  ): Promise<AuthUser> {
    const existing = await this.prisma.user.findFirst({
      where: { email, companyId, is_active: true },
      select: { id: true, email: true, name: true, role: true, companyId: true },
    });
    if (existing) return existing;

    const now = Math.floor(Date.now() / 1000);
    const unusablePassword = await bcrypt.hash(randomBytes(24).toString('hex'), 10);

    return this.prisma.user.create({
      data: {
        companyId,
        email,
        password: unusablePassword,
        name,
        role: 'cashier',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      select: { id: true, email: true, name: true, role: true, companyId: true },
    });
  }
}
