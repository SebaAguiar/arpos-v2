import {
  InventoryService,
  type ApiStockItem,
  type ApiInventoryMovement,
  type ApiInventoryReport,
} from "../services/inventory.service";

export interface StockItemData {
  productId: string;
  productCode: string;
  productName: string;
  stockQuantity: number;
  costCents: number | null;
  minStock: number | null;
  categoryId: string | null;
  lastMovementAt: number | null;
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
    minStock: api.min_stock,
    categoryId: api.category_id,
    lastMovementAt: api.last_movement_at,
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

export interface InventoryReportData {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  byCategory: Array<{
    category: string | null;
    count: number;
    value: number;
  }>;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    productCode: string;
    stockQuantity: number;
    cost: number | null;
    price: number;
  }>;
  outOfStockProducts: Array<{
    productId: string;
    productName: string;
    productCode: string;
    cost: number | null;
    price: number;
  }>;
}

function mapReport(api: ApiInventoryReport): InventoryReportData {
  return {
    totalProducts: api.totalProducts,
    totalStockValue: api.totalStockValueCents / 100,
    lowStockCount: api.lowStockCount,
    outOfStockCount: api.outOfStockCount,
    byCategory: api.byCategory.map((c) => ({
      category: c.category,
      count: c.count,
      value: c.valueCents / 100,
    })),
    lowStockProducts: api.lowStockProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productCode: p.productCode,
      stockQuantity: p.stockQuantity,
      cost: p.costCents != null ? p.costCents / 100 : null,
      price: p.priceCents / 100,
    })),
    outOfStockProducts: api.outOfStockProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productCode: p.productCode,
      cost: p.costCents != null ? p.costCents / 100 : null,
      price: p.priceCents / 100,
    })),
  };
}

export const InventoryRepository = {
  async getStock(): Promise<StockItemData[]> {
    const items = await InventoryService.getStock();
    return items.map(mapStock);
  },

  async getReport(): Promise<InventoryReportData> {
    const data = await InventoryService.getReport();
    return mapReport(data);
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
