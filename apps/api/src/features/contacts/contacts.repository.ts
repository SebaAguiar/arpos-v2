import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { Contact } from '@prisma/client';
import { CreateContactInput } from './dto/create-contact.schema';
import { UpdateContactInput } from './dto/update-contact.schema';

@Injectable()
export class ContactsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async findAll(type?: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        companyId: this.getCompanyId(),
        is_active: true,
        ...(type ? { type } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({ where: { id } });
  }

  async create(data: CreateContactInput, companyId: string): Promise<Contact> {
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.contact.create({
      data: {
        ...data,
        companyId,
        created_at: now,
        updated_at: now,
      },
    });
  }

  async update(id: string, data: UpdateContactInput): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }

  async softDelete(id: string): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }
}
