import {
  ProductsService,
  type ApiProductWithInventory,
} from "../services/products.service";
import type { Product, ProductVariant, StockItem } from "@/lib/types";

function mapProduct(api: ApiProductWithInventory): Product {
  const variants: ProductVariant[] = [];

  if (api.sku || api.code) {
    const stockItems: StockItem[] = api.inventory.map((inv) => ({
      quantity: inv.quantity,
      minQuantity: inv.min_stock,
      storeId: inv.storeId,
    }));

    variants.push({
      id: `${api.id}-default`,
      barcode: api.code,
      sku: api.sku ?? undefined,
      price: api.price_cents / 100,
      costPrice: api.cost_cents != null ? api.cost_cents / 100 : undefined,
      active: api.is_active,
      stockItems,
    });
  }

  return {
    id: api.id,
    name: api.name,
    description: api.description ?? undefined,
    price: api.price_cents / 100,
    cost: api.cost_cents != null ? api.cost_cents / 100 : undefined,
    active: api.is_active,
    category: api.category_id ?? undefined,
    internalCode: api.code,
    image: undefined,
    variants,
  };
}

export const ProductsRepository = {
  async getAll(): Promise<Product[]> {
    const products = await ProductsService.list();
    return products.map(mapProduct);
  },

  async getById(id: string): Promise<Product> {
    const product = await ProductsService.get(id);
    return mapProduct(product);
  },

  async create(input: {
    code: string;
    name: string;
    description?: string;
    price_cents: number;
    cost_cents?: number;
    stock_quantity?: number;
    sku?: string;
    category_id?: string;
  }): Promise<Product> {
    const created = await ProductsService.create(input);
    return mapProduct({ ...created, inventory: [] });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price_cents: number;
      cost_cents: number;
      sku: string;
      category_id: string;
      is_active: boolean;
    }>,
  ): Promise<Product> {
    const updated = await ProductsService.update(id, data);
    return mapProduct({ ...updated, inventory: [] });
  },

  async remove(id: string): Promise<void> {
    return ProductsService.remove(id);
  },
};
