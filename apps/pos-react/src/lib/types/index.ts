export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  margin?: number;
  active: boolean;
  category?: string;
  internalCode?: string;
  image?: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  barcode?: string;
  sku?: string;
  price?: number;
  costPrice?: number;
  active: boolean;
  stockItems: StockItem[];
}

export interface StockItem {
  quantity: number;
  minQuantity?: number;
  storeId: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
  sku?: string;
  image?: string;
  custom?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  loyaltyPoints?: number;
  balance?: number;
}

export type PaymentMethod = "CASH" | "DEBIT" | "CREDIT" | "QR" | "WALLET" | "TRANSFER" | "POINTS";

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

export interface SalePaymentMethod {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id: string;
  ticketNumber: number;
  total: number;
  status: "COMPLETED" | "CANCELLED";
  createdAt: number;
  items: SaleItem[];
  paymentMethods: SalePaymentMethod[];
  customerId?: string;
  customer?: Customer;
  user?: { id: string; name: string; email: string };
}

export interface SaleItem {
  id: string;
  variantId?: string;
  description: string;
  productName: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  returnedQuantity?: number;
}

export interface CashShift {
  id: string;
  initialAmount: number;
  startTime: number;
  endTime?: number;
  finalAmount?: number;
  status: "OPEN" | "CLOSED";
}

export type SaleChannel = "COUNTER" | "DELIVERY" | "TAKEAWAY";

export interface StoreConfig {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxRate: number;
  creditSurcharge: number;
  receiptHeader?: string;
  receiptFooter?: string;
}

export type ProductSortField = "name" | "price" | "createdAt";
export type ProductSortDirection = "asc" | "desc";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "cashier";
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
}
