import { SalesService, type ApiSale, type ApiSaleStats, type ApiPaymentMethodBreakdown, type ApiTopProduct } from "../services/sales.service";
import type { Sale, SaleItem, PaymentMethod } from "@/lib/types";

function mapSale(api: ApiSale): Sale {
  const items: SaleItem[] = (api.items ?? []).map((item) => ({
    id: item.id,
    variantId: item.variantId ?? undefined,
    description: item.product?.name ?? item.name ?? "",
    productName: item.product?.name ?? item.name ?? "",
    quantity: item.quantity,
    unitPrice: item.unit_price_cents / 100,
    subtotal: item.total_cents / 100,
  }));

  return {
    id: api.id,
    ticketNumber: api.ticket_number,
    total: api.total_cents / 100,
    status: api.status === "completed" ? "COMPLETED" : "CANCELLED",
    createdAt: api.created_at,
    items,
    paymentMethods: [
      {
        method: api.payment_method as PaymentMethod,
        amount: api.total_cents / 100,
      },
    ],
    customerId: api.contact_id ?? undefined,
    user: api.user,
  };
}

export const SalesRepository = {
  async getAll(filters?: {
    from?: number;
    to?: number;
    status?: string;
  }): Promise<Sale[]> {
    const sales = await SalesService.list(filters);
    return sales.map(mapSale);
  },

  async getStats(filters?: {
    from?: number;
    to?: number;
  }): Promise<ApiSaleStats> {
    return SalesService.getStats(filters);
  },

  async getByPaymentMethod(filters?: {
    from?: number;
    to?: number;
  }): Promise<ApiPaymentMethodBreakdown[]> {
    return SalesService.getByPaymentMethod(filters);
  },

  async getById(id: string): Promise<Sale> {
    const sale = await SalesService.get(id);
    return mapSale(sale);
  },

  async getTopProducts(filters?: {
    from?: number;
    to?: number;
    limit?: number;
  }): Promise<ApiTopProduct[]> {
    return SalesService.getTopProducts(filters);
  },

  async create(input: {
    items: Array<{
      productId?: string;
      name?: string;
      quantity: number;
      unit_price_cents: number;
    }>;
    total_cents: number;
    discount_cents?: number;
    tax_cents?: number;
    payment_method: string;
    contact_id?: string;
    notes?: string;
    cash_register_id?: string;
  }): Promise<Sale> {
    const created = await SalesService.create(input);
    return mapSale(created);
  },
};
