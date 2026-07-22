import { TenantContextService } from '../tenant/tenant-context.service';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseRepository<T extends BaseEntity> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tenantContext: TenantContextService,
    protected readonly modelName: string,
  ) {}

  protected getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async create(data: Partial<T>): Promise<T> {
    const now = Date.now();
    return (this.prisma as any)[this.modelName].create({
      data: {
        ...data,
        companyId: this.getCompanyId(),
        created_at: now,
        updated_at: now,
      },
    });
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    return (this.prisma as any)[this.modelName].findMany({
      where: {
        companyId: this.getCompanyId(),
        ...filters,
      },
    });
  }

  async findById(id: string): Promise<T | null> {
    return (this.prisma as any)[this.modelName].findFirst({
      where: {
        id,
        companyId: this.getCompanyId(),
      },
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return (this.prisma as any)[this.modelName].update({
      where: { id },
      data: {
        ...data,
        updated_at: Date.now(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any)[this.modelName].delete({
      where: { id },
    });
  }
}
