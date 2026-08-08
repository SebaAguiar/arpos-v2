import {
  ProductsService,
  type ApiProductWithInventory,
} from "../services/products.service";
import type { Product, ProductVariant, StockItem } from "@/lib/types";

function mapProduct(api: ApiProductWithInventory): Product {
  let variants: ProductVariant[];

  if (api.variants && api.variants.length > 0) {
    variants = api.variants
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        size: v.size ?? undefined,
        color: v.color ?? undefined,
        barcode: v.barcode ?? undefined,
        sku: v.sku ?? undefined,
        price: v.price_cents > 0 ? v.price_cents / 100 : api.price_cents / 100,
        costPrice: v.cost_cents != null ? v.cost_cents / 100 : undefined,
        active: v.is_active,
        stockItems: v.inventory.map((inv) => ({
          quantity: inv.quantity,
          minQuantity: inv.min_stock,
          storeId: inv.storeId,
        })),
      }));
  } else {
    const stockItems: StockItem[] = api.inventory.map((inv) => ({
      quantity: inv.quantity,
      minQuantity: inv.min_stock,
      storeId: inv.storeId,
    }));

    variants = [
      {
        id: `${api.id}-default`,
        barcode: api.code,
        sku: api.sku ?? undefined,
        price: api.price_cents / 100,
        costPrice: api.cost_cents != null ? api.cost_cents / 100 : undefined,
        active: api.is_active,
        stockItems,
      },
    ];
  }

  const defaultPrice = variants[0]?.price ?? api.price_cents / 100;

  return {
    id: api.id,
    name: api.name,
    description: api.description ?? undefined,
    price: defaultPrice,
    cost: api.cost_cents != null ? api.cost_cents / 100 : undefined,
    active: api.is_active,
    category: api.category_id ?? undefined,
    internalCode: api.code,
    image: undefined,
    stockQuantity: api.stock_quantity,
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
    return mapProduct({ ...created, inventory: [], variants: [] });
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
    return mapProduct({ ...updated, inventory: [], variants: [] });
  },

  async remove(id: string): Promise<void> {
    return ProductsService.remove(id);
  },
};
