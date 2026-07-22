import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, type?: string) {
    return this.prisma.contact.findMany({
      where: {
        companyId,
        is_active: true,
        ...(type ? { type } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async create(
    data: {
      type?: string;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      tax_id?: string;
      notes?: string;
    },
    companyId: string,
  ) {
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

  async update(
    id: string,
    data: Partial<{
      type: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      tax_id: string;
      notes: string;
      is_active: boolean;
    }>,
  ) {
    await this.findOne(id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }
}
