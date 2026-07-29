import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { CreateOrderInput } from './dto/create-order.schema';
import { UpdateOrderInput } from './dto/update-order.schema';
import { ReceiveOrderInput } from './dto/receive-order.schema';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly purchasesRepo: PurchasesRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll(status?: string) {
    return this.purchasesRepo.findAll(status);
  }

  async findOne(id: string) {
    const order = await this.purchasesRepo.findById(id);
    if (!order) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }
    return order;
  }

  async create(input: CreateOrderInput) {
    const userId = this.tenantContext.getUserId();
    const items = input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity_ordered: item.quantity_ordered,
      unit_cost_cents: item.unit_cost_cents,
      total_cents: item.quantity_ordered * item.unit_cost_cents,
    }));
    const total_cents = items.reduce((sum, item) => sum + item.total_cents, 0);

    return this.purchasesRepo.create({
      supplierId: input.supplierId,
      expected_date: input.expected_date ?? null,
      notes: input.notes ?? null,
      total_cents,
      created_by: userId,
      items,
    });
  }

  async update(id: string, input: UpdateOrderInput) {
    await this.findOne(id);

    if (input.items) {
      const items = input.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity_ordered: item.quantity_ordered,
        unit_cost_cents: item.unit_cost_cents,
        total_cents: item.quantity_ordered * item.unit_cost_cents,
      }));
      const total_cents = items.reduce((sum, item) => sum + item.total_cents, 0);

      await this.purchasesRepo.replaceItems(id, items);
      return this.purchasesRepo.update(id, {
        ...input,
        total_cents,
        expected_date: input.expected_date ?? null,
        notes: input.notes ?? null,
      });
    }

    return this.purchasesRepo.update(id, {
      ...input,
      expected_date: input.expected_date ?? null,
      notes: input.notes ?? null,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.purchasesRepo.update(id, { status: 'cancelled' });
  }

  async receive(input: ReceiveOrderInput) {
    const order = await this.findOne(input.orderId);
    if (order.status === 'cancelled') {
      throw new BadRequestException('Cannot receive a cancelled order');
    }

    const userId = this.tenantContext.getUserId();

    const validItems = input.items.filter((ri) =>
      order.items.some((i) => i.id === ri.itemId),
    );

    if (validItems.length !== input.items.length) {
      throw new BadRequestException('Some items do not match the order');
    }

    for (const ri of validItems) {
      const item = order.items.find((i) => i.id === ri.itemId);
      if (!item) continue;

      const newReceived = item.quantity_received + ri.quantity_received;
      if (newReceived > item.quantity_ordered) {
        throw new BadRequestException(
          `Cannot receive more than ordered for item. Ordered: ${item.quantity_ordered}, Already received: ${item.quantity_received}, Trying to receive: ${ri.quantity_received}`,
        );
      }

      await this.purchasesRepo.updateItemReceived(ri.itemId, newReceived);

      await this.purchasesRepo.createInventoryMovement({
        productId: item.productId,
        variantId: item.variantId,
        type: 'in',
        quantity: ri.quantity_received,
        reference_type: 'purchase_receipt',
        reference_id: input.orderId,
        reason: `Purchase receipt for order ${input.orderId}`,
        userId,
      });

      await this.purchasesRepo.updateInventoryQuantity(
        item.productId,
        item.variantId,
        ri.quantity_received,
      );
    }

    await this.purchasesRepo.createReceipt({
      orderId: input.orderId,
      supplierId: order.supplierId,
      receipt_number: input.receipt_number ?? null,
      notes: input.notes ?? null,
      created_by: userId,
    });

    const updatedOrder = await this.purchasesRepo.findById(input.orderId);
    if (!updatedOrder) return null;

    const allReceived = updatedOrder.items.every(
      (i) => i.quantity_received >= i.quantity_ordered,
    );
    const anyReceived = updatedOrder.items.some(
      (i) => i.quantity_received > 0,
    );
    const status = allReceived ? 'received' : anyReceived ? 'partial' : 'ordered';

    return this.purchasesRepo.update(input.orderId, { status });
  }
}
