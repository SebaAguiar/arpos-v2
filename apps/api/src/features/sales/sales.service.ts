import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { CreateSaleInput } from './dto/create-sale.schema';
import { SyncService } from '../sync/sync.service';
import { WalletService } from '../wallet/wallet.service';

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
  constructor(
    private readonly salesRepo: SalesRepository,
    private readonly syncService: SyncService,
    private readonly walletService: WalletService,
  ) {}

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
    if (input.payment_method === 'wallet' && !input.contact_id) {
      throw new BadRequestException('contact_id is required when payment method is wallet');
    }

    const sale = await this.salesRepo.create(input);

    if (input.payment_method === 'wallet' && input.contact_id) {
      try {
        await this.walletService.internalDebit(
          input.contact_id,
          sale.total_cents,
          'sale',
          sale.id,
          `Payment for sale ticket #${sale.ticket_number}`,
        );
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Wallet debit failed',
        );
      }
    }

    await this.syncService.enqueueChange('create', 'sale', sale.id, {
      total_cents: sale.total_cents,
      payment_method: sale.payment_method,
      status: sale.status,
      user_id: sale.user_id,
    });

    return sale;
  }

  async getStats(from?: number, to?: number): Promise<SaleStats> {
    return this.salesRepo.getStats(from, to);
  }

  async getSalesByPaymentMethod(from?: number, to?: number) {
    return this.salesRepo.getSalesByPaymentMethod(from, to);
  }

  async getTopProducts(from?: number, to?: number, limit = 10) {
    return this.salesRepo.getTopProducts(from, to, limit);
  }
}
