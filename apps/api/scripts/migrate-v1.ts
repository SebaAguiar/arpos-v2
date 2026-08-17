import { Client, type QueryResultRow } from 'pg';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * One-off migration script: Xata v1 (PostgreSQL) -> Arcom v2 (SQLite).
 *
 * Reads the v1 database read-only, transforms rows into the v2 schema and
 * writes them to a local SQLite database via Prisma.
 *
 * Requires env vars:
 *   V1_DATABASE_URL  - read-only connection string to the v1 Xata PostgreSQL DB
 *   DATABASE_URL     - file:... path to a fresh SQLite DB with the v2 schema applied
 *
 * Usage:
 *   DATABASE_URL="file:./migrate-v1-test.db" V1_DATABASE_URL="postgresql://..." \
 *     npx ts-node scripts/migrate-v1.ts
 */

// ── v1 row shapes (mirrors the introspected v1 schema) ───────────────────────

interface V1Company {
  id: number;
  name: string;
  industry: string | null;
  subdomain: string | null;
  logoUrl: string | null;
  active: boolean;
  autoInvoiceArca: boolean;
  canceledAt: Date | null;
  ownerUserId: number | null;
  trialEndsAt: Date | null;
}

interface V1Client {
  id: number;
  companyName: string;
  email: string;
  phone: string | null;
  taxId: string | null;
  plan: string;
  status: string;
}

interface V1Store {
  id: number;
  companyId: number;
  name: string;
  code: string | null;
  address: string | null;
  active: boolean;
  phone: string | null;
  email: string | null;
}

interface V1User {
  id: number;
  companyId: number;
  name: string;
  email: string;
  passwordHash: string | null;
  globalRole: string;
  active: boolean;
  isPlatformAdmin: boolean;
}

interface V1Contact {
  id: number;
  companyId: number;
  name: string;
  email: string | null;
  taxId: string | null;
  taxCondition: string | null;
  documentType: string | null;
  documentNumber: string | null;
  city: string | null;
  isCustomer: boolean;
  isSupplier: boolean;
  address: string | null;
  phone: string | null;
}

interface V1Customer {
  id: number;
  contactId: number;
  paymentTermDays: number | null;
  balance: string;
}

interface V1Product {
  id: number;
  companyId: number;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  internalCode: string | null;
  active: boolean;
  productType: string | null;
  image: string | null;
  subCategory: string | null;
  supplierId: number | null;
}

interface V1ProductVariant {
  id: number;
  companyId: number;
  productId: number;
  size: string | null;
  color: string | null;
  barcode: string | null;
  sku: string | null;
  isPublic: boolean;
  active: boolean;
  cost: string;
  margin: string;
}

interface V1ProductPrice {
  id: number;
  companyId: number;
  variantId: number;
  storeId: number | null;
  price: string;
}

interface V1StockItem {
  id: number;
  companyId: number;
  variantId: number;
  storeId: number;
  quantity: number;
  minQuantity: number;
  updatedAt: Date;
}

interface V1StockMovement {
  id: number;
  companyId: number;
  variantId: number;
  type: string;
  storeFromId: number | null;
  storeToId: number | null;
  quantity: number;
  reason: string | null;
  userId: number;
  createdAt: Date;
}

interface V1Sale {
  id: number;
  companyId: number;
  storeId: number;
  userId: number;
  customerId: number | null;
  channel: string;
  createdAt: Date;
  total: string;
  netAmount: string | null;
  taxAmount: string | null;
  canceled: boolean;
  cancelReason: string | null;
}

interface V1SaleItem {
  id: number;
  companyId: number;
  saleId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: string;
  discount: string;
  subtotal: string;
}

interface V1SalePayment {
  id: number;
  companyId: number;
  saleId: number;
  method: string;
  amount: string;
  cardBrand: string | null;
  cardLast4: string | null;
  installments: number | null;
}

interface V1CashShift {
  id: number;
  companyId: number;
  storeId: number;
  userId: number;
  startTime: Date;
  endTime: Date | null;
  initialAmount: string;
  finalAmount: string | null;
  status: string;
}

interface V1CashMovement {
  id: number;
  companyId: number;
  storeId: number;
  userId: number;
  type: string;
  source: string;
  amount: string;
  description: string | null;
  createdAt: Date;
  saleId: number | null;
  cashShiftId: number | null;
}

interface V1StoreConfig {
  id: number;
  storeId: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  taxRate: string;
  creditSurchargePercentage: string;
}

interface V1Task {
  id: number;
  companyId: number;
  storeId: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueAt: Date | null;
  createdById: number;
  assignedToId: number | null;
  completedById: number | null;
  completedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const toCents = (v: string | null | undefined): number =>
  v == null ? 0 : Math.round(Number(v) * 100);

const toBps = (percentage: string | null | undefined): number =>
  percentage == null ? 0 : Math.round(Number(percentage) * 100);

const toSec = (d: Date | null | undefined): number | null =>
  d == null ? null : Math.floor(d.getTime() / 1000);

const nowSec = (): number => Math.floor(Date.now() / 1000);

const lower = (v: string): string => v.toLowerCase();

// v1 enum -> v2 lowercase string values
const ROLE_MAP: Record<string, string> = {
  OWNER: 'admin',
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  EMPLOYEE: 'cashier',
};

const PAYMENT_MAP: Record<string, string> = {
  CASH: 'cash',
  DEBIT_CARD: 'debit_card',
  CREDIT_CARD: 'credit_card',
  TRANSFER: 'transfer',
  OTHER: 'other',
  WALLET: 'wallet',
  QR: 'qr',
};

// ── main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const v1Url = process.env.V1_DATABASE_URL;
  if (!v1Url) {
    throw new Error('V1_DATABASE_URL is not set');
  }

  const client = new Client({ connectionString: v1Url });
  await client.connect();
  const prisma = new PrismaClient();

  try {
    const q = async <T extends QueryResultRow>(sql: string): Promise<T[]> => {
      const res = await client.query<T>(sql);
      return res.rows;
    };

    // ── read v1 (all reads happen before any write) ──────────────────────────
    const [clients, companies, stores, users, contacts, customers] = await Promise.all([
      q<V1Client>('SELECT id, "companyName", email, phone, "taxId", plan, status FROM "Client"'),
      q<V1Company>('SELECT id, name, industry, subdomain, "logoUrl", active, "autoInvoiceArca", "canceledAt", "ownerUserId", "trialEndsAt" FROM "Company"'),
      q<V1Store>('SELECT id, "companyId", name, code, address, active, phone, email FROM "Store"'),
      q<V1User>('SELECT id, "companyId", name, email, "passwordHash", "globalRole", active, "isPlatformAdmin" FROM "User"'),
      q<V1Contact>('SELECT id, "companyId", name, email, "taxId", "taxCondition", "documentType", "documentNumber", city, "isCustomer", "isSupplier", address, phone FROM "Contact"'),
      q<V1Customer>('SELECT id, "contactId", "paymentTermDays", balance FROM "Customer"'),
    ]);

    const [products, variants, prices, stockItems, stockMovements] = await Promise.all([
      q<V1Product>('SELECT id, "companyId", name, brand, category, description, "internalCode", active, "productType", image, "subCategory", "supplierId" FROM "Product"'),
      q<V1ProductVariant>('SELECT id, "companyId", "productId", size, color, barcode, sku, "isPublic", active, cost, margin FROM "ProductVariant"'),
      q<V1ProductPrice>('SELECT id, "companyId", "variantId", "storeId", price FROM "ProductPrice"'),
      q<V1StockItem>('SELECT id, "companyId", "variantId", "storeId", quantity, "minQuantity", "updatedAt" FROM "StockItem"'),
      q<V1StockMovement>('SELECT id, "companyId", "variantId", type, "storeFromId", "storeToId", quantity, reason, "userId", "createdAt" FROM "StockMovement"'),
    ]);

    const [sales, saleItems, salePayments] = await Promise.all([
      q<V1Sale>('SELECT id, "companyId", "storeId", "userId", "customerId", channel, "createdAt", total, "netAmount", "taxAmount", canceled, "cancelReason" FROM "Sale"'),
      q<V1SaleItem>('SELECT id, "companyId", "saleId", "variantId", quantity, "unitPrice", discount, subtotal FROM "SaleItem"'),
      q<V1SalePayment>('SELECT id, "companyId", "saleId", method, amount, "cardBrand", "cardLast4", installments FROM "SalePayment"'),
    ]);

    const [cashShifts, cashMovements, storeConfigs, tasks] = await Promise.all([
      q<V1CashShift>('SELECT id, "companyId", "storeId", "userId", "startTime", "endTime", "initialAmount", "finalAmount", status FROM "CashShift"'),
      q<V1CashMovement>('SELECT id, "companyId", "storeId", "userId", type, source, amount, description, "createdAt", "saleId", "cashShiftId" FROM "CashMovement"'),
      q<V1StoreConfig>('SELECT id, "storeId", "receiptHeader", "receiptFooter", "taxRate", "creditSurchargePercentage" FROM "StoreConfig"'),
      q<V1Task>('SELECT id, "companyId", "storeId", title, description, priority, status, "dueAt", "createdById", "assignedToId", "completedById", "completedAt", "deletedAt", "createdAt", "updatedAt" FROM "Task"'),
    ]);

    console.log('[v1] read complete:');
    console.log('  companies=%d stores=%d users=%d contacts=%d customers=%d', companies.length, stores.length, users.length, contacts.length, customers.length);
    console.log('  products=%d variants=%d prices=%d stockItems=%d stockMovements=%d', products.length, variants.length, prices.length, stockItems.length, stockMovements.length);
    console.log('  sales=%d saleItems=%d salePayments=%d', sales.length, saleItems.length, salePayments.length);
    console.log('  cashShifts=%d cashMovements=%d storeConfigs=%d tasks=%d', cashShifts.length, cashMovements.length, storeConfigs.length, tasks.length);

    // ── constant scoping: only tenant 1 migrates (matches v2 dev tenant) ────
    const COMPANY_ID = '1';
    const PRIMARY_STORE_ID = '4';
    const now = nowSec();
    const batchSize = 500;

    // ── 1. Company + entitlement snapshot ────────────────────────────────────
    const companyV1 = companies[0];
    if (!companyV1) {
      throw new Error('v1 has no companies');
    }
    const clientV1 = clients[0];
    const plan = clientV1?.plan.toLowerCase() ?? 'basic';
    const config = JSON.stringify({
      subscription: { status: 'inactive', tier: plan, updatedAt: now },
    });

    await prisma.company.createMany({
      data: [
        {
          id: COMPANY_ID,
          name: companyV1.name,
          taxId: clientV1?.taxId ?? companyV1.name,
          email: clientV1?.email ?? null,
          phone: clientV1?.phone ?? null,
          address: null,
          created_at: now,
          updated_at: now,
          config,
        },
      ],
    });

    // ── 2. Stores ─────────────────────────────────────────────────────────────
    const storeIdMap = new Map<number, string>();
    for (const s of stores) {
      storeIdMap.set(s.id, String(s.id));
    }
    await prisma.store.createMany({
      data: stores.map((s) => ({
        id: String(s.id),
        companyId: COMPANY_ID,
        name: s.name,
        address: s.address,
        phone: s.phone,
        is_active: s.active,
        created_at: now,
        updated_at: now,
      })),
    });

    // ── 3. Users ──────────────────────────────────────────────────────────────
    await prisma.user.createMany({
      data: users.map((u) => ({
        id: String(u.id),
        companyId: COMPANY_ID,
        email: u.email,
        password: u.passwordHash ?? '',
        name: u.name,
        role: ROLE_MAP[u.globalRole] ?? 'cashier',
        is_active: u.active,
        created_at: now,
        updated_at: now,
      })),
    });

    // ── 4. Contacts (v1 Contact + Customer merged) ────────────────────────────
    const customerByContact = new Map<number, V1Customer>();
    for (const c of customers) {
      customerByContact.set(c.contactId, c);
    }
    await prisma.contact.createMany({
      data: contacts.map((c) => {
        const customer = customerByContact.get(c.id);
        const type = c.isSupplier ? (c.isCustomer ? 'both' : 'supplier') : 'customer';
        return {
          id: String(c.id),
          companyId: COMPANY_ID,
          type,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          tax_id: c.taxId,
          notes: [c.taxCondition, c.documentType, c.documentNumber, c.city]
            .filter((v): v is string => v != null && v.length > 0)
            .join(', ') || null,
          is_active: true,
          balance_cents: toCents(customer?.balance),
          created_at: now,
          updated_at: now,
        };
      }),
    });

    const contactIdOfCustomer = new Map<number, number>();
    for (const c of customers) {
      contactIdOfCustomer.set(c.id, c.contactId);
    }

    // ── 5. Products (denormalized from variants/prices/stock) ────────────────
    const variantByProduct = new Map<number, V1ProductVariant[]>();
    for (const v of variants) {
      const list = variantByProduct.get(v.productId) ?? [];
      list.push(v);
      variantByProduct.set(v.productId, list);
    }

    // Prefer store-4 price, fall back to any other price row per variant.
    const priceByVariant = new Map<number, V1ProductPrice>();
    for (const pr of prices) {
      const current = priceByVariant.get(pr.variantId);
      if (!current || (current.storeId == null && pr.storeId != null)) {
        priceByVariant.set(pr.variantId, pr);
      }
    }

    const stockByVariant = new Map<number, number>();
    for (const si of stockItems) {
      if (String(si.storeId) === PRIMARY_STORE_ID) {
        stockByVariant.set(si.variantId, (stockByVariant.get(si.variantId) ?? 0) + si.quantity);
      }
    }

    await prisma.product.createMany({
      data: products.map((p) => {
        const vs = variantByProduct.get(p.id) ?? [];
        const firstVariant = vs[0];
        const metadata = JSON.stringify({
          brand: p.brand,
          category: p.category,
          productType: p.productType,
          image: p.image,
          subCategory: p.subCategory,
        });
        const price = priceByVariant.get(firstVariant?.id ?? -1);
        return {
          id: String(p.id),
          companyId: COMPANY_ID,
          storeId: PRIMARY_STORE_ID,
          code: p.internalCode ?? `PRD-${p.id}`,
          name: p.name,
          description: p.description,
          price_cents: toCents(price?.price),
          cost_cents: toCents(firstVariant?.cost),
          stock_quantity: vs.reduce((acc, v) => acc + (stockByVariant.get(v.id) ?? 0), 0),
          sku: null,
          category_id: p.category?.toLowerCase() ?? null,
          metadata,
          is_active: p.active,
          created_at: now,
          updated_at: now,
        };
      }),
    });

    // ── 6. Variants (price from ProductPrice, store 4 preferred) ─────────────
    await prisma.productVariant.createMany({
      data: variants.map((v) => {
        const price = priceByVariant.get(v.id);
        return {
          id: String(v.id),
          companyId: COMPANY_ID,
          productId: String(v.productId),
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          sku: v.sku,
          price_cents: toCents(price?.price),
          cost_cents: toCents(v.cost),
          is_active: v.active,
          created_at: now,
          updated_at: now,
        };
      }),
    });

    // ── 7. Inventory (v1 StockItem) ───────────────────────────────────────────
    const variantProductMap = new Map<number, number>();
    for (const v of variants) {
      variantProductMap.set(v.id, v.productId);
    }
    await prisma.inventory.createMany({
      data: stockItems.map((si) => ({
        companyId: COMPANY_ID,
        storeId: String(si.storeId),
        productId: String(variantProductMap.get(si.variantId) ?? 0),
        variantId: String(si.variantId),
        quantity: si.quantity,
        min_stock: si.minQuantity,
        max_stock: null,
        created_at: now,
        updated_at: toSec(si.updatedAt) ?? now,
      })),
    });

    // ── 8. Inventory movements (v1 StockMovement) ─────────────────────────────
    const batches: Prisma.InventoryMovementCreateManyInput[] = [];
    for (const sm of stockMovements) {
      batches.push({
        id: String(sm.id),
        companyId: COMPANY_ID,
        storeId: String(sm.storeFromId ?? sm.storeToId ?? 4),
        productId: String(variantProductMap.get(sm.variantId) ?? 0),
        variantId: String(sm.variantId),
        userId: String(sm.userId),
        type: lower(sm.type),
        quantity: sm.quantity,
        reason: sm.reason ?? '',
        reference_type: null,
        reference_id: null,
        created_at: toSec(sm.createdAt) ?? now,
      });
    }
    for (let i = 0; i < batches.length; i += batchSize) {
      await prisma.inventoryMovement.createMany({ data: batches.slice(i, i + batchSize) });
    }

    // ── 9. Cash registers (v1 CashShift + synthetic "Histórico") ─────────────
    await prisma.cashRegister.createMany({
      data: cashShifts.map((cs) => {
        return {
          id: String(cs.id),
          companyId: COMPANY_ID,
          storeId: String(cs.storeId),
          name: `Caja ${cs.storeId} ${toSec(cs.startTime) ?? ''}`,
          status: lower(cs.status),
          opening_amount: toCents(cs.initialAmount),
          closing_amount: toCents(cs.finalAmount) || null,
          opened_at: toSec(cs.startTime),
          closed_at: toSec(cs.endTime),
          created_at: toSec(cs.startTime) ?? now,
          updated_at: toSec(cs.endTime) ?? toSec(cs.startTime) ?? now,
        };
      }),
    });

    const orphanMovementsByStore = new Map<number, V1CashMovement[]>();
    for (const cm of cashMovements) {
      if (cm.cashShiftId == null) {
        const list = orphanMovementsByStore.get(cm.storeId) ?? [];
        list.push(cm);
        orphanMovementsByStore.set(cm.storeId, list);
      }
    }
    const syntheticRegisters: Prisma.CashRegisterCreateManyInput[] = [];
    for (const [storeId, movs] of orphanMovementsByStore) {
      const earliest = movs.reduce<number>((acc, m) => Math.min(acc, toSec(m.createdAt) ?? now), now);
      const regId = `hist-${storeId}`;
      syntheticRegisters.push({
        id: regId,
        companyId: COMPANY_ID,
        storeId: String(storeId),
        name: 'Histórico',
        status: 'closed',
        opening_amount: 0,
        closing_amount: null,
        opened_at: earliest,
        closed_at: null,
        created_at: earliest,
        updated_at: earliest,
      });
    }
    await prisma.cashRegister.createMany({ data: syntheticRegisters });

    // ── 10. Cash movements ────────────────────────────────────────────────────
    const cashMovementData: Prisma.CashMovementCreateManyInput[] = cashMovements.map((cm) => ({
      cashRegisterId: cm.cashShiftId != null ? String(cm.cashShiftId) : `hist-${cm.storeId}`,
      companyId: COMPANY_ID,
      storeId: String(cm.storeId),
      type: lower(cm.type),
      amount_cents: toCents(cm.amount),
      description: cm.description ?? '',
      created_at: toSec(cm.createdAt) ?? now,
    }));
    for (let i = 0; i < cashMovementData.length; i += batchSize) {
      await prisma.cashMovement.createMany({ data: cashMovementData.slice(i, i + batchSize) });
    }

    // ── 11. Store configs ─────────────────────────────────────────────────────
    await prisma.storeConfig.createMany({
      data: storeConfigs.map((sc) => ({
        storeId: String(sc.storeId),
        receipt_header: sc.receiptHeader,
        receipt_footer: sc.receiptFooter,
        tax_rate_bps: toBps(sc.taxRate),
        credit_surcharge_bps: toBps(sc.creditSurchargePercentage),
      })),
    });

    // ── 12. Sales (ticket number assigned sequentially per store) ─────────────
    const paymentsBySale = new Map<number, V1SalePayment[]>();
    for (const sp of salePayments) {
      const list = paymentsBySale.get(sp.saleId) ?? [];
      list.push(sp);
      paymentsBySale.set(sp.saleId, list);
    }

    const salesByStore = new Map<number, V1Sale[]>();
    for (const s of sales) {
      const list = salesByStore.get(s.storeId) ?? [];
      list.push(s);
      salesByStore.set(s.storeId, list);
    }

    const ticketBySale = new Map<number, number>();
    for (const [, list] of salesByStore) {
      const sorted = [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      sorted.forEach((s, i) => ticketBySale.set(s.id, i + 1));
    }

    const saleData: Prisma.SaleCreateManyInput[] = sales.map((s) => {
      const payments = paymentsBySale.get(s.id) ?? [];
      const mainPayment = [...payments].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
      const method = mainPayment ? (PAYMENT_MAP[mainPayment.method] ?? 'other') : 'other';
      const paymentDetails = JSON.stringify(
        payments.map((p) => ({
          method: PAYMENT_MAP[p.method] ?? 'other',
          amount_cents: toCents(p.amount),
          cardBrand: p.cardBrand,
          cardLast4: p.cardLast4,
          installments: p.installments,
        })),
      );
      return {
        id: String(s.id),
        companyId: COMPANY_ID,
        storeId: String(s.storeId),
        cash_register_id: null,
        user_id: String(s.userId),
        contact_id: s.customerId != null ? String(contactIdOfCustomer.get(s.customerId) ?? '') || null : null,
        ticket_number: ticketBySale.get(s.id) ?? 0,
        total_cents: toCents(s.total),
        discount_cents: 0,
        tax_cents: toCents(s.taxAmount),
        status: s.canceled ? 'cancelled' : 'completed',
        payment_method: method,
        payment_details: paymentDetails,
        notes: s.cancelReason,
        synced_at: null,
        created_at: toSec(s.createdAt) ?? now,
        updated_at: toSec(s.createdAt) ?? now,
      };
    });
    for (let i = 0; i < saleData.length; i += batchSize) {
      await prisma.sale.createMany({ data: saleData.slice(i, i + batchSize) });
    }

    // ── 13. Sale items (free-text items -> synthetic product) ────────────────
    const freeProductId = 'gen-0';
    await prisma.product.createMany({
      data: [
        {
          id: freeProductId,
          companyId: COMPANY_ID,
          storeId: PRIMARY_STORE_ID,
          code: 'PRD-0',
          name: 'Producto genérico',
          description: 'Items de venta sin variante asignada (v1 free-text)',
          price_cents: 0,
          cost_cents: 0,
          stock_quantity: 0,
          sku: null,
          category_id: null,
          metadata: null,
          is_active: false,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    const saleItemData: Prisma.SaleItemCreateManyInput[] = saleItems.map((si) => ({
      id: String(si.id),
      saleId: String(si.saleId),
      productId: si.variantId != null ? String(variantProductMap.get(si.variantId) ?? freeProductId) : freeProductId,
      variantId: si.variantId != null ? String(si.variantId) : null,
      quantity: si.quantity,
      unit_price_cents: toCents(si.unitPrice),
      total_cents: toCents(si.subtotal),
      discount_cents: toCents(si.discount),
    }));
    for (let i = 0; i < saleItemData.length; i += batchSize) {
      await prisma.saleItem.createMany({ data: saleItemData.slice(i, i + batchSize) });
    }

    // ── 14. Tasks ─────────────────────────────────────────────────────────────
    await prisma.task.createMany({
      data: tasks.map((t) => ({
        id: String(t.id),
        companyId: COMPANY_ID,
        storeId: String(t.storeId),
        title: t.title,
        description: t.description,
        priority: lower(t.priority),
        status: lower(t.status),
        due_at: toSec(t.dueAt),
        created_by: String(t.createdById),
        assigned_to: t.assignedToId != null ? String(t.assignedToId) : null,
        completed_by: t.completedById != null ? String(t.completedById) : null,
        completed_at: toSec(t.completedAt),
        deleted_at: toSec(t.deletedAt),
        created_at: toSec(t.createdAt) ?? now,
        updated_at: toSec(t.updatedAt) ?? now,
      })),
    });

    // ── summary ───────────────────────────────────────────────────────────────
    const count = async (model: keyof PrismaClient): Promise<number> => {
      const delegate = prisma[model] as { count: () => Promise<number> };
      return delegate.count();
    };
    console.log('[v2] write complete:');
    console.log('  companies=%d stores=%d users=%d contacts=%d', await count('company'), await count('store'), await count('user'), await count('contact'));
    console.log('  products=%d variants=%d inventory=%d movements=%d', await count('product'), await count('productVariant'), await count('inventory'), await count('inventoryMovement'));
    console.log('  cashRegisters=%d cashMovements=%d storeConfigs=%d', await count('cashRegister'), await count('cashMovement'), await count('storeConfig'));
    console.log('  sales=%d saleItems=%d tasks=%d', await count('sale'), await count('saleItem'), await count('task'));

    await prisma.$disconnect();
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error('[migrate-v1] FAILED:', err);
  process.exitCode = 1;
});
