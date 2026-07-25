import {
  InventoryService,
  type ApiStockItem,
  type ApiInventoryMovement,
} from "../services/inventory.service";

export interface StockItemData {
  productId: string;
  productCode: string;
  productName: string;
  stockQuantity: number;
  costCents: number | null;
}

export interface InventoryMovementData {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: number;
  productName?: string;
  productCode?: string;
}

function mapStock(api: ApiStockItem): StockItemData {
  return {
    productId: api.productId,
    productCode: api.productCode,
    productName: api.productName,
    stockQuantity: api.stock_quantity,
    costCents: api.cost_cents,
  };
}

function mapMovement(api: ApiInventoryMovement): InventoryMovementData {
  return {
    id: api.id,
    productId: api.productId,
    type: api.type,
    quantity: api.quantity,
    reason: api.reason,
    referenceType: api.reference_type,
    referenceId: api.reference_id,
    createdAt: api.created_at,
    productName: api.productName,
    productCode: api.productCode,
  };
}

export const InventoryRepository = {
  async getStock(): Promise<StockItemData[]> {
    const items = await InventoryService.getStock();
    return items.map(mapStock);
  },

  async getMovements(filters?: {
    productId?: string;
    type?: string;
    from?: number;
    to?: number;
  }): Promise<InventoryMovementData[]> {
    const items = await InventoryService.getMovements(filters);
    return items.map(mapMovement);
  },

  async createMovement(input: {
    productId: string;
    type: string;
    quantity: number;
    reason: string;
  }): Promise<void> {
    return InventoryService.createMovement(input);
  },
};
