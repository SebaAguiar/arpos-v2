import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(companyId: string, storeId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        companyId,
        storeId,
        status: 'open',
      },
      orderBy: { opened_at: 'desc' },
    });

    if (!register) {
      throw new NotFoundException('No open cash register found');
    }

    return register;
  }

  async findAll(companyId: string, storeId: string) {
    return this.prisma.cashRegister.findMany({
      where: { companyId, storeId },
      orderBy: { created_at: 'desc' },
    });
  }

  async open(
    data: { name: string; opening_amount: number },
    companyId: string,
    storeId: string,
  ) {
    const existingOpen = await this.prisma.cashRegister.findFirst({
      where: {
        companyId,
        storeId,
        status: 'open',
      },
    });

    if (existingOpen) {
      throw new ConflictException(
        'A cash register is already open. Close it before opening a new one.',
      );
    }

    const now = Math.floor(Date.now() / 1000);

    return this.prisma.cashRegister.create({
      data: {
        companyId,
        storeId,
        name: data.name,
        status: 'open',
        opening_amount: data.opening_amount,
        opened_at: now,
        created_at: now,
        updated_at: now,
      },
    });
  }

  async close(id: string, closing_amount: number) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
    });

    if (!register) {
      throw new NotFoundException(`Cash register with id ${id} not found`);
    }

    if (register.status === 'closed') {
      throw new ConflictException('Cash register is already closed');
    }

    const now = Math.floor(Date.now() / 1000);

    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'closed',
        closing_amount,
        closed_at: now,
        updated_at: now,
      },
    });
  }

  async findOne(id: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
    });

    if (!register) {
      throw new NotFoundException(`Cash register with id ${id} not found`);
    }

    return register;
  }
}
