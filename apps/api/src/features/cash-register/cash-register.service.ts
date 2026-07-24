import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CashRegisterRepository, CashRegisterWithSummary } from './cash-register.repository';

@Injectable()
export class CashRegisterService {
  constructor(private readonly cashRegisterRepo: CashRegisterRepository) {}

  async findCurrent(companyId: string, storeId: string): Promise<CashRegisterWithSummary> {
    const register = await this.cashRegisterRepo.findOpen(companyId, storeId);

    if (!register) {
      throw new NotFoundException('No open cash register found');
    }

    const { total_sales_cents, payment_summary } = await this.cashRegisterRepo.buildSummary(
      companyId,
      storeId,
      register.opened_at ?? 0,
    );

    return { ...register, total_sales_cents, payment_summary };
  }

  async findAll(companyId: string, storeId: string) {
    return this.cashRegisterRepo.findAll(companyId, storeId);
  }

  async findOne(id: string) {
    const register = await this.cashRegisterRepo.findById(id);
    if (!register) {
      throw new NotFoundException(`Cash register with id ${id} not found`);
    }
    return register;
  }

  async open(data: { name: string; opening_amount: number }, companyId: string, storeId: string) {
    const existingOpen = await this.cashRegisterRepo.findOpen(companyId, storeId);
    if (existingOpen) {
      throw new ConflictException(
        'A cash register is already open. Close it before opening a new one.',
      );
    }
    return this.cashRegisterRepo.create({ companyId, storeId, ...data });
  }

  async close(id: string, closing_amount: number) {
    const register = await this.cashRegisterRepo.findById(id);
    if (!register) {
      throw new NotFoundException(`Cash register with id ${id} not found`);
    }
    if (register.status === 'closed') {
      throw new ConflictException('Cash register is already closed');
    }
    return this.cashRegisterRepo.close(id, closing_amount);
  }
}
