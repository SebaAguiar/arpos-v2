import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserInput } from './dto/create-user.schema';
import { UpdateUserInput } from './dto/update-user.schema';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  private sanitize(user: User): SafeUser {
    const { password: _, ...safe } = user;
    return safe;
  }

  async findAll(filters?: { role?: string; is_active?: boolean }): Promise<SafeUser[]> {
    const where: Record<string, unknown> = {
      companyId: this.getCompanyId(),
    };

    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return users.map((u) => this.sanitize(u));
  }

  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId: this.getCompanyId() },
    });
    return user ? this.sanitize(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, companyId: this.getCompanyId() },
    });
  }

  async create(data: CreateUserInput): Promise<SafeUser> {
    const now = Math.floor(Date.now() / 1000);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        companyId: this.getCompanyId(),
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        created_at: now,
        updated_at: now,
      },
    });

    return this.sanitize(user);
  }

  async update(id: string, data: UpdateUserInput): Promise<SafeUser> {
    const updateData: Record<string, unknown> = {
      updated_at: Math.floor(Date.now() / 1000),
    };

    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.sanitize(user);
  }

  async softDelete(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });

    return this.sanitize(user);
  }
}
