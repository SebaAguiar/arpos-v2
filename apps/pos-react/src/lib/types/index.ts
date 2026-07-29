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

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_cents: number;
  total_cents: number;
  product: { id: string; name: string; code: string };
  variant?: { id: string; size?: string; color?: string; sku?: string };
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  storeId: string;
  supplierId: string;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  expected_date?: number;
  notes?: string;
  total_cents: number;
  created_by: string;
  created_at: number;
  updated_at: number;
  supplier: { id: string; name: string };
  items: PurchaseOrderItem[];
  receipts?: Array<{
    id: string;
    receipt_number?: string;
    notes?: string;
    created_at: number;
    creator: { id: string; name: string };
  }>;
}

export interface PurchaseReceipt {
  id: string;
  orderId: string;
  supplierId: string;
  receipt_number?: string;
  notes?: string;
  created_at: number;
}

export interface SyncStatus {
  pending: number;
  synced: number;
  error: number;
  lastSyncedAt: number | null;
}

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export interface PullResult {
  pulled: number;
  applied: number;
  skipped: number;
  errors: string[];
}

export interface SubscriptionInfo {
  status: "active" | "inactive" | "none";
  tier?: string;
  cloudUrl?: string;
  cloudJwt?: string;
  expiresAt?: number;
}

export interface CloudConfig {
  url: string;
  jwt: string;
}

export interface WalletTransaction {
  id: string;
  contactId: string;
  type: "credit" | "debit";
  amount_cents: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: number;
}

export interface WalletBalance {
  contactId: string;
  balance_cents: number;
}

export interface CreditDebitInput {
  amount_cents: number;
  notes?: string;
}
