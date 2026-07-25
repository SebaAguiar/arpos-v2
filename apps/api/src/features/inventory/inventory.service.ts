import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryRepository, StockItem, InventoryMovementData } from './inventory.repository';
import { CreateMovementInput } from './dto/create-movement.schema';
import { ListMovementsInput } from './dto/list-movements.schema';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async listStock(companyId: string, storeId: string): Promise<StockItem[]> {
    return this.inventoryRepo.getStock(companyId, storeId);
  }

  async listMovements(
    companyId: string,
    storeId: string,
    filters: ListMovementsInput,
  ): Promise<InventoryMovementData[]> {
    return this.inventoryRepo.getMovements(companyId, storeId, filters);
  }

  async createMovement(
    input: CreateMovementInput,
    companyId: string,
    storeId: string,
    userId?: string,
  ): Promise<void> {
    const quantityDelta = this.calculateDelta(input.type, input.quantity);

    if (input.type === 'exit' || input.type === 'adjustment') {
      const stock = await this.inventoryRepo.getStock(companyId, storeId);
      const product = stock.find((s) => s.productId === input.productId);

      if (!product) {
        throw new NotFoundException(`Product ${input.productId} not found`);
      }

      if (product.stock_quantity + quantityDelta < 0) {
        throw new BadRequestException(
          `Insufficient stock for "${product.productName}": has ${product.stock_quantity}, needs ${Math.abs(quantityDelta)}`,
        );
      }
    }

    await this.inventoryRepo.createMovement({
      companyId,
      storeId,
      productId: input.productId,
      userId,
      type: input.type,
      quantity: quantityDelta,
      reason: input.reason,
    });

    await this.inventoryRepo.adjustStock(input.productId, quantityDelta);
  }

  private calculateDelta(type: string, quantity: number): number {
    switch (type) {
      case 'entry':
        return Math.abs(quantity);
      case 'exit':
        return -Math.abs(quantity);
      case 'adjustment':
        return quantity;
      default:
        throw new BadRequestException(`Unknown movement type: ${type}`);
    }
  }
}
