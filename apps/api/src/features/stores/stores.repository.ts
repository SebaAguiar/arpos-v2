import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { Store } from '@prisma/client';
import { CreateStoreInput } from './dto/create-store.schema';
import { UpdateStoreInput } from './dto/update-store.schema';

@Injectable()
export class StoresRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async findAll(): Promise<Store[]> {
    return this.prisma.store.findMany({
      where: { companyId: this.getCompanyId() },
      orderBy: { created_at: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.store.count({
      where: { companyId: this.getCompanyId() },
    });
  }

  async findById(id: string): Promise<Store | null> {
    return this.prisma.store.findFirst({
      where: { id, companyId: this.getCompanyId() },
    });
  }

  async create(data: CreateStoreInput): Promise<Store> {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.store.create({
      data: {
        companyId: this.getCompanyId(),
        name: data.name,
        address: data.address,
        phone: data.phone,
        created_at: now,
        updated_at: now,
      },
    });
  }

  async update(id: string, data: UpdateStoreInput): Promise<Store> {
    return this.prisma.store.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }

  async softDelete(id: string): Promise<Store> {
    return this.prisma.store.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }
}
