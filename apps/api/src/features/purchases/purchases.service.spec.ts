import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';

type OrderItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_cents: number;
  total_cents: number;
};

type Order = {
  id: string;
  supplierId: string;
  status: string;
  total_cents: number;
  items: OrderItem[];
};

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'po-1',
    supplierId: 'sup-1',
    status: 'ordered',
    total_cents: 20000,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        quantity_ordered: 10,
        quantity_received: 0,
        unit_cost_cents: 1500,
        total_cents: 15000,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        variantId: 'var-2',
        quantity_ordered: 5,
        quantity_received: 0,
        unit_cost_cents: 1000,
        total_cents: 5000,
      },
    ],
    ...overrides,
  };
}

describe('PurchasesService', () => {
  let service: PurchasesService;
  let mockPurchasesRepo: Record<string, jest.Mock>;
  let mockTenant: { getUserId: jest.Mock };

  beforeEach(() => {
    mockPurchasesRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replaceItems: jest.fn(),
      updateItemReceived: jest.fn(),
      createInventoryMovement: jest.fn(),
      updateInventoryQuantity: jest.fn(),
      createReceipt: jest.fn(),
    };
    mockTenant = { getUserId: jest.fn().mockReturnValue('user-1') };

    service = new PurchasesService(
      mockPurchasesRepo as never,
      mockTenant as never,
    );
  });

  describe('findOne', () => {
    it('throws NotFoundException when the order is missing', async () => {
      mockPurchasesRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('po-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the order when found', async () => {
      const order = buildOrder();
      mockPurchasesRepo.findById.mockResolvedValue(order);

      await expect(service.findOne('po-1')).resolves.toEqual(order);
    });
  });

  describe('create', () => {
    it('computes per-item and order totals with the current user', async () => {
      mockPurchasesRepo.create.mockResolvedValue(buildOrder());

      await service.create({
        supplierId: 'sup-1',
        expected_date: 1750000000,
        notes: 'rappel',
        items: [
          { productId: 'p-1', quantity_ordered: 2, unit_cost_cents: 1000 },
          { productId: 'p-2', variantId: 'v-2', quantity_ordered: 3, unit_cost_cents: 500 },
        ],
      });

      expect(mockPurchasesRepo.create).toHaveBeenCalledWith({
        supplierId: 'sup-1',
        expected_date: 1750000000,
        notes: 'rappel',
        total_cents: 3500,
        created_by: 'user-1',
        items: [
          {
            productId: 'p-1',
            variantId: null,
            quantity_ordered: 2,
            unit_cost_cents: 1000,
            total_cents: 2000,
          },
          {
            productId: 'p-2',
            variantId: 'v-2',
            quantity_ordered: 3,
            unit_cost_cents: 500,
            total_cents: 1500,
          },
        ],
      });
    });

    it('normalizes optional fields to null', async () => {
      mockPurchasesRepo.create.mockResolvedValue(buildOrder());

      await service.create({
        supplierId: 'sup-1',
        items: [{ productId: 'p-1', quantity_ordered: 1, unit_cost_cents: 700 }],
      });

      expect(mockPurchasesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expected_date: null,
          notes: null,
          total_cents: 700,
          created_by: 'user-1',
        }),
      );
    });
  });

  describe('update', () => {
    it('replaces items and recomputes the total when items change', async () => {
      const order = buildOrder();
      mockPurchasesRepo.findById.mockResolvedValue(order);
      mockPurchasesRepo.update.mockResolvedValue(order);

      await service.update('po-1', {
        supplierId: 'sup-1',
        items: [{ productId: 'p-1', quantity_ordered: 4, unit_cost_cents: 1000 }],
      });

      expect(mockPurchasesRepo.replaceItems).toHaveBeenCalledWith('po-1', [
        {
          productId: 'p-1',
          variantId: null,
          quantity_ordered: 4,
          unit_cost_cents: 1000,
          total_cents: 4000,
        },
      ]);
      expect(mockPurchasesRepo.update).toHaveBeenCalledWith('po-1', {
        supplierId: 'sup-1',
        total_cents: 4000,
        expected_date: null,
        notes: null,
      });
    });

    it('keeps the total untouched when only order fields change', async () => {
      const order = buildOrder();
      mockPurchasesRepo.findById.mockResolvedValue(order);
      mockPurchasesRepo.update.mockResolvedValue(order);

      await service.update('po-1', { notes: 'urgente' });

      expect(mockPurchasesRepo.replaceItems).not.toHaveBeenCalled();
      expect(mockPurchasesRepo.update).toHaveBeenCalledWith('po-1', {
        notes: 'urgente',
        expected_date: null,
      });
    });

    it('throws NotFoundException when the order is missing', async () => {
      mockPurchasesRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('po-1', { notes: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('cancels the order instead of deleting it', async () => {
      const order = buildOrder();
      mockPurchasesRepo.findById.mockResolvedValue(order);
      mockPurchasesRepo.update.mockResolvedValue({ ...order, status: 'cancelled' });

      await service.remove('po-1');

      expect(mockPurchasesRepo.update).toHaveBeenCalledWith('po-1', {
        status: 'cancelled',
      });
    });
  });

  describe('receive', () => {
    it('rejects receiving a cancelled order', async () => {
      mockPurchasesRepo.findById.mockResolvedValue(
        buildOrder({ status: 'cancelled' }),
      );

      await expect(
        service.receive({
          orderId: 'po-1',
          items: [{ itemId: 'item-1', quantity_received: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects item ids that do not belong to the order', async () => {
      mockPurchasesRepo.findById.mockResolvedValue(buildOrder());

      await expect(
        service.receive({
          orderId: 'po-1',
          items: [{ itemId: 'bogus-item', quantity_received: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects receiving more than the ordered quantity', async () => {
      mockPurchasesRepo.findById.mockResolvedValue(buildOrder());

      await expect(
        service.receive({
          orderId: 'po-1',
          items: [{ itemId: 'item-1', quantity_received: 11 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marks the order as received, creates stock movements and a receipt', async () => {
      const order = buildOrder();
      mockPurchasesRepo.findById.mockResolvedValue(order);
      mockPurchasesRepo.updateItemReceived.mockImplementation(
        (itemId: string, quantity: number) => {
          const item = order.items.find((i) => i.id === itemId);
          if (item) item.quantity_received = quantity;
          return Promise.resolve(undefined);
        },
      );
      mockPurchasesRepo.update.mockResolvedValue(order);

      await service.receive({
        orderId: 'po-1',
        receipt_number: 'R-100',
        notes: 'recibido ok',
        items: [
          { itemId: 'item-1', quantity_received: 10 },
          { itemId: 'item-2', quantity_received: 5 },
        ],
      });

      expect(mockPurchasesRepo.updateItemReceived).toHaveBeenCalledWith(
        'item-1',
        10,
      );
      expect(mockPurchasesRepo.updateItemReceived).toHaveBeenCalledWith(
        'item-2',
        5,
      );

      expect(mockPurchasesRepo.createInventoryMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-1',
          variantId: null,
          type: 'in',
          quantity: 10,
          reference_type: 'purchase_receipt',
          reference_id: 'po-1',
          reason: expect.stringContaining('po-1'),
          userId: 'user-1',
        }),
      );
      expect(mockPurchasesRepo.createInventoryMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-2',
          variantId: 'var-2',
          quantity: 5,
        }),
      );
      expect(mockPurchasesRepo.updateInventoryQuantity).toHaveBeenCalledWith(
        'prod-1',
        null,
        10,
      );
      expect(mockPurchasesRepo.updateInventoryQuantity).toHaveBeenCalledWith(
        'prod-2',
        'var-2',
        5,
      );

      expect(mockPurchasesRepo.createReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'po-1',
          supplierId: 'sup-1',
          receipt_number: 'R-100',
          notes: 'recibido ok',
          created_by: 'user-1',
        }),
      );

      expect(mockPurchasesRepo.update).toHaveBeenCalledWith('po-1', {
        status: 'received',
      });
    });

    it('marks the order as partial when only some items are received', async () => {
      const order = buildOrder();
      mockPurchasesRepo.findById.mockResolvedValue(order);
      mockPurchasesRepo.updateItemReceived.mockImplementation(
        (itemId: string, quantity: number) => {
          const item = order.items.find((i) => i.id === itemId);
          if (item) item.quantity_received = quantity;
          return Promise.resolve(undefined);
        },
      );
      mockPurchasesRepo.update.mockResolvedValue(order);

      await service.receive({
        orderId: 'po-1',
        items: [{ itemId: 'item-1', quantity_received: 10 }],
      });

      expect(mockPurchasesRepo.update).toHaveBeenCalledWith('po-1', {
        status: 'partial',
      });
      expect(mockPurchasesRepo.createInventoryMovement).toHaveBeenCalledTimes(1);
    });
  });
});