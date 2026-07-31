import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Client, type QueryResultRow } from 'pg';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import type { ImportV1Input } from './dto/import-v1.schema';

/**
 * Product-grade version of the one-off v1 -> v2 migration.
 *
 * The dev-only script lives at `apps/api/scripts/migrate-v1.ts`; this service
 * is the reusable building block for the Migration Wizard (see ARCHITECTURE.md
 * §5.5): reads the v1 Xata PostgreSQL database read-only, transforms rows into
 * the v2 SQLite schema and writes them through the injected PrismaService.
 *
 * The endpoint is @Public() on purpose: it runs during setup, before any
 * company or user exists. The real credential is the v1 connection URL itself.
 * The guard is the database state: it only runs against an empty database.
 */

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

export interface MigrationSummary {
  status: 'ok';
  companyId: string;
  primaryStoreId: string;
  rowsMigrated: Record<string, number>;
  completedAt: number;
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

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFromV1(dto: ImportV1Input): Promise<MigrationSummary> {
    const existingCompanies = await this.prisma.company.count();
    if (existingCompanies > 0) {
      throw new ConflictException(
        'Company already initialized; import is only allowed on an empty database',
      );
    }

    const client = new Client({ connectionString: dto.databaseUrl });
    await client.connect();

    try {
      const q = async <T extends QueryResultRow>(sql: string): Promise<T[]> => {
        const res = await client.query<T>(sql);
        return res.rows;
      };

      // ── read v1 (all reads happen before any write) ────────────────────────
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

      this.logger.log(
        `[v1] read complete: companies=${companies.length} stores=${stores.length} ` +
          `users=${users.length} products=${products.length} variants=${variants.length} ` +
          `stockItems=${stockItems.length} movements=${stockMovements.length} ` +
          `sales=${sales.length} saleItems=${saleItems.length} cashMovements=${cashMovements.length}`,
      );

      const companyV1 = companies[0];
      if (!companyV1) {
        throw new Error('v1 database has no Company rows');
      }

      // Tenant ids come from v1 (Int -> String with the same value), keeping
      // the mapping consistent with the rest of the transform.
      const companyId = String(companyV1.id);
      const primaryStoreId = dto.primaryStoreId ?? String(stores[0]?.id ?? '');
      if (!primaryStoreId) {
        throw new Error('v1 database has no Store rows');
      }

      const now = nowSec();
      const batchSize = 500;

      // ── 1. Company + entitlement snapshot ──────────────────────────────────
      const clientV1 = clients[0];
      const plan = clientV1?.plan.toLowerCase() ?? 'basic';
      const config = JSON.stringify({
        subscription: { status: 'inactive', tier: plan, updatedAt: now },
      });

      await this.prisma.company.create({
        data: {
          id: companyId,
          name: companyV1.name,
          taxId: clientV1?.taxId ?? companyV1.name,
          email: clientV1?.email ?? null,
          phone: clientV1?.phone ?? null,
          address: null,
          created_at: now,
          updated_at: now,
          config,
        },
      });

      // ── 2. Stores ───────────────────────────────────────────────────────────
      await this.prisma.store.createMany({
        data: stores.map((s) => ({
          id: String(s.id),
          companyId,
          name: s.name,
          address: s.address,
          phone: s.phone,
          is_active: s.active,
          created_at: now,
          updated_at: now,
        })),
      });

      // ── 3. Users ────────────────────────────────────────────────────────────
      await this.prisma.user.createMany({
        data: users.map((u) => ({
          id: String(u.id),
          companyId,
          email: u.email,
          password: u.passwordHash ?? '',
          name: u.name,
          role: ROLE_MAP[u.globalRole] ?? 'cashier',
          is_active: u.active,
          created_at: now,
          updated_at: now,
        })),
      });

      // ── 4. Contacts (v1 Contact + Customer merged) ──────────────────────────
      const customerByContact = new Map<number, V1Customer>();
      for (const c of customers) {
        customerByContact.set(c.contactId, c);
      }
      await this.prisma.contact.createMany({
        data: contacts.map((c) => {
          const customer = customerByContact.get(c.id);
          const type = c.isSupplier ? (c.isCustomer ? 'both' : 'supplier') : 'customer';
          return {
            id: String(c.id),
            companyId,
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

      // Prefer a store-scoped price row, fall back to any other row per variant.
      const priceByVariant = new Map<number, V1ProductPrice>();
      for (const pr of prices) {
        const current = priceByVariant.get(pr.variantId);
        if (!current || (current.storeId == null && pr.storeId != null)) {
          priceByVariant.set(pr.variantId, pr);
        }
      }

      const stockByVariant = new Map<number, number>();
      for (const si of stockItems) {
        if (String(si.storeId) === primaryStoreId) {
          stockByVariant.set(si.variantId, (stockByVariant.get(si.variantId) ?? 0) + si.quantity);
        }
      }

      await this.prisma.product.createMany({
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
            companyId,
            storeId: primaryStoreId,
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

      // ── 6. Variants (price from ProductPrice, primary store preferred) ───────
      await this.prisma.productVariant.createMany({
        data: variants.map((v) => {
          const price = priceByVariant.get(v.id);
          return {
            id: String(v.id),
            companyId,
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

      // ── 7. Inventory (v1 StockItem) ──────────────────────────────────────────
      const variantProductMap = new Map<number, number>();
      for (const v of variants) {
        variantProductMap.set(v.id, v.productId);
      }
      await this.prisma.inventory.createMany({
        data: stockItems.map((si) => ({
          companyId,
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

      // ── 8. Inventory movements (v1 StockMovement) ────────────────────────────
      const batches: Prisma.InventoryMovementCreateManyInput[] = [];
      for (const sm of stockMovements) {
        batches.push({
          id: String(sm.id),
          companyId,
          storeId: String(sm.storeFromId ?? sm.storeToId ?? Number(primaryStoreId)),
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
        await this.prisma.inventoryMovement.createMany({ data: batches.slice(i, i + batchSize) });
      }

      // ── 9. Cash registers (v1 CashShift + synthetic "Histórico") ─────────────
      await this.prisma.cashRegister.createMany({
        data: cashShifts.map((cs) => {
          return {
            id: String(cs.id),
            companyId,
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
          companyId,
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
      await this.prisma.cashRegister.createMany({ data: syntheticRegisters });

      // ── 10. Cash movements ───────────────────────────────────────────────────
      const cashMovementData: Prisma.CashMovementCreateManyInput[] = cashMovements.map((cm) => ({
        cashRegisterId: cm.cashShiftId != null ? String(cm.cashShiftId) : `hist-${cm.storeId}`,
        companyId,
        storeId: String(cm.storeId),
        type: lower(cm.type),
        amount_cents: toCents(cm.amount),
        description: cm.description ?? '',
        created_at: toSec(cm.createdAt) ?? now,
      }));
      for (let i = 0; i < cashMovementData.length; i += batchSize) {
        await this.prisma.cashMovement.createMany({ data: cashMovementData.slice(i, i + batchSize) });
      }

      // ── 11. Store configs ────────────────────────────────────────────────────
      await this.prisma.storeConfig.createMany({
        data: storeConfigs.map((sc) => ({
          storeId: String(sc.storeId),
          receipt_header: sc.receiptHeader,
          receipt_footer: sc.receiptFooter,
          tax_rate_bps: toBps(sc.taxRate),
          credit_surcharge_bps: toBps(sc.creditSurchargePercentage),
        })),
      });

      // ── 12. Sales (ticket number assigned sequentially per store) ────────────
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
          companyId,
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
        await this.prisma.sale.createMany({ data: saleData.slice(i, i + batchSize) });
      }

      // ── 13. Sale items (free-text items -> synthetic product) ────────────────
      const freeProductId = 'gen-0';
      await this.prisma.product.createMany({
        data: [
          {
            id: freeProductId,
            companyId,
            storeId: primaryStoreId,
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
        await this.prisma.saleItem.createMany({ data: saleItemData.slice(i, i + batchSize) });
      }

      // ── 14. Tasks ────────────────────────────────────────────────────────────
      await this.prisma.task.createMany({
        data: tasks.map((t) => ({
          id: String(t.id),
          companyId,
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

      const rowsMigrated: Record<string, number> = {
        companies: await this.prisma.company.count(),
        stores: await this.prisma.store.count(),
        users: await this.prisma.user.count(),
        contacts: await this.prisma.contact.count(),
        products: await this.prisma.product.count(),
        variants: await this.prisma.productVariant.count(),
        inventory: await this.prisma.inventory.count(),
        inventoryMovements: await this.prisma.inventoryMovement.count(),
        cashRegisters: await this.prisma.cashRegister.count(),
        cashMovements: await this.prisma.cashMovement.count(),
        storeConfigs: await this.prisma.storeConfig.count(),
        sales: await this.prisma.sale.count(),
        saleItems: await this.prisma.saleItem.count(),
        tasks: await this.prisma.task.count(),
      };

      this.logger.log(`[v2] write complete: ${JSON.stringify(rowsMigrated)}`);

      return {
        status: 'ok',
        companyId,
        primaryStoreId,
        rowsMigrated,
        completedAt: nowSec(),
      };
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
