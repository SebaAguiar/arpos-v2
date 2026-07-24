import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { CreateSaleInput } from './dto/create-sale.schema';

export type { CreateSaleInput };

export interface SaleFilters {
  from?: number;
  to?: number;
  status?: string;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
}

@Injectable()
export class SalesService {
  constructor(private readonly salesRepo: SalesRepository) {}

  async findAll(filters?: SaleFilters) {
    return this.salesRepo.findAll(filters);
  }

  async findOne(id: string) {
    const sale = await this.salesRepo.findById(id);
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  async create(input: CreateSaleInput) {
    return this.salesRepo.create(input);
  }

  async getStats(from?: number, to?: number): Promise<SaleStats> {
    return this.salesRepo.getStats(from, to);
  }

  async getSalesByPaymentMethod(from?: number, to?: number) {
    return this.salesRepo.getSalesByPaymentMethod(from, to);
  }
}
