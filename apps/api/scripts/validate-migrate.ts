import { Client, type QueryResultRow } from 'pg';
import { PrismaClient } from '@prisma/client';

const toCents = (v: string | null | undefined): number =>
  v == null ? 0 : Math.round(Number(v) * 100);

async function main(): Promise<void> {
  const v1Url = process.env.V1_DATABASE_URL;
  const v1 = new Client({ connectionString: v1Url });
  await v1.connect();
  const prisma = new PrismaClient();

  const q = async <T extends QueryResultRow>(sql: string): Promise<T[]> => {
    const res = await v1.query<T>(sql);
    return res.rows;
  };

  const check = (label: string, a: number | null, b: number | null, tolerance = 0): void => {
    const ok = a !== null && b !== null && Math.abs(a - b) <= tolerance;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: v1=${a} v2=${b}`);
    if (!ok) process.exitCode = 1;
  };

  // sales total
  const v1Sales = await q<{ t: string | null }>('SELECT SUM(total)::text AS t FROM "Sale"');
  const v2Sales = await prisma.sale.aggregate({ _sum: { total_cents: true } });
  check('sales total_cents', v1Sales[0]?.t ? toCents(v1Sales[0].t) : null, v2Sales._sum.total_cents ?? 0);

  // sale items subtotal
  const v1Items = await q<{ t: string | null }>('SELECT SUM(subtotal)::text AS t FROM "SaleItem"');
  const v2Items = await prisma.saleItem.aggregate({ _sum: { total_cents: true } });
  check('sale_items total_cents', v1Items[0]?.t ? toCents(v1Items[0].t) : null, v2Items._sum.total_cents ?? 0);

  // sale items unitPrice*qty vs subtotal consistency (v1 internal check)
  const v1ItemMismatch = await q<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM "SaleItem" WHERE ROUND(("unitPrice"::numeric * quantity), 2) - discount::numeric - subtotal::numeric > 0.005`,
  );
  console.log('v1 sale_item unit*qty-disc vs subtotal mismatches:', v1ItemMismatch[0]?.c);

  // payments sum
  const v1Pay = await q<{ t: string | null }>('SELECT SUM(amount)::text AS t FROM "SalePayment"');
  const v2Pay = await prisma.sale.aggregate({ _sum: { total_cents: true } });
  check('payments vs sales total', v1Pay[0]?.t ? toCents(v1Pay[0].t) : null, v2Pay._sum.total_cents ?? 0);

  // canceled sales count
  const v1Cancelled = await q<{ c: string }>('SELECT COUNT(*)::text AS c FROM "Sale" WHERE canceled = true');
  const v2Cancelled = await prisma.sale.count({ where: { status: 'cancelled' } });
  check('cancelled sales count', Number(v1Cancelled[0]?.c), v2Cancelled);

  // sales with customer -> contact linkage
  const v1WithCust = await q<{ c: string }>('SELECT COUNT(*)::text AS c FROM "Sale" WHERE "customerId" IS NOT NULL');
  const v2WithContact = await prisma.sale.count({ where: { contact_id: { not: null } } });
  check('sales with customer contact', Number(v1WithCust[0]?.c), v2WithContact);

  // cash movements
  const v1Cash = await q<{ t: string | null }>('SELECT SUM(amount)::text AS t FROM "CashMovement"');
  const v2Cash = await prisma.cashMovement.aggregate({ _sum: { amount_cents: true } });
  check('cash_movements amount_cents', v1Cash[0]?.t ? toCents(v1Cash[0].t) : null, v2Cash._sum.amount_cents ?? 0);

  // stock quantities
  const v1Stock = await q<{ t: string | null }>('SELECT SUM(quantity)::text AS t FROM "StockItem"');
  const v2Stock = await prisma.inventory.aggregate({ _sum: { quantity: true } });
  check('inventory quantity', v1Stock[0]?.t ? Number(v1Stock[0].t) : null, v2Stock._sum.quantity ?? 0);

  // variant prices: v1 ProductPrice (store 4 preferred) vs v2 variant price_cents
  const v1PriceRows = await q<{ id: string; price: string }>(
    `SELECT v.id, COALESCE((SELECT p.price::text FROM "ProductPrice" p WHERE p."variantId" = v.id AND p."storeId" IS NOT NULL LIMIT 1),
                          (SELECT p.price::text FROM "ProductPrice" p WHERE p."variantId" = v.id LIMIT 1)) AS price
     FROM "ProductVariant" v`,
  );
  const v1PriceSum = v1PriceRows.reduce((acc, r) => acc + toCents(r.price), 0);
  const v2PriceSum = await prisma.productVariant.aggregate({ _sum: { price_cents: true } });
  check('variant price_cents', v1PriceSum, v2PriceSum._sum.price_cents ?? 0);

  // stock movements by type
  for (const type of ['SALE', 'PURCHASE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT']) {
    const v1c = await q<{ c: string }>(`SELECT COUNT(*)::text AS c FROM "StockMovement" WHERE type = '${type}'`);
    const v2c = await prisma.inventoryMovement.count({ where: { type: type.toLowerCase() } });
    check(`stock_movements type=${type.toLowerCase()}`, Number(v1c[0]?.c), v2c);
  }

  // contact balance vs v1 customer balance
  const v1Bal = await q<{ t: string | null }>('SELECT SUM(balance)::text AS t FROM "Customer"');
  const v2Bal = await prisma.contact.aggregate({ _sum: { balance_cents: true } });
  check('customer balance_cents', v1Bal[0]?.t ? toCents(v1Bal[0].t) : null, v2Bal._sum.balance_cents ?? 0);

  // barcode uniqueness / nulls
  const v2Barcodes = await prisma.productVariant.count({ where: { barcode: { not: null } } });
  const v1Barcodes = await q<{ c: string }>('SELECT COUNT(*)::text AS c FROM "ProductVariant" WHERE barcode IS NOT NULL');
  check('variants with barcode', Number(v1Barcodes[0]?.c), v2Barcodes);

  await prisma.$disconnect();
  await v1.end();
}

main().catch((err) => {
  console.error('VALIDATION FAILED:', err);
  process.exitCode = 1;
});
