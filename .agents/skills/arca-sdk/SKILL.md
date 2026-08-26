---
name: arca-sdk
description: Use when working with ARCA (ex AFIP) electronic billing integration in Arcom. Covers @arcasdk/core setup, voucher emission, async worker architecture, error handling (timeout, business logic, ARCA downtime), certificate management, homologacion vs produccion, and fiscal integrity rules. Triggers on any mention of ARCA, AFIP, CAE, factura electronica, comprobante fiscal, or @arcasdk.
allowed-tools: Bash(npx:*) Bash(node:*) Bash(pnpm:*)
---

# ARCA SDK Integration Guide (SaaS-Ready)

Act as a Senior Technical Lead expert in Argentine fiscal integrations. When generating code or architecture for electronic billing, follow these rules strictly.

## Core Rules

1. **LIBRARY**: Use exclusively `@arcasdk/core`. Never use raw SOAP/WSAA.
2. **ARCHITECTURE**: Always design async decoupled flows. Never block the main thread waiting for ARCA.
3. **FISCAL INTEGRITY**: Before emitting, always call `getLastVoucherNumber` to compute `n+1`.
4. **AVOID DUPLICITY**: On retries after timeout, verify that the last voucher data in ARCA doesn't match the local record before attempting a new emission.
5. **ERROR HANDLING**: Implement exponential backoff for network errors; immediate stop for business logic errors (400).
6. **PRIORITY**: Always prioritize fiscal data integrity over response speed. Never assume a timeout means the invoice wasn't emitted.

## Setup

```typescript
import { Arca } from "@arcasdk/core";

const arca = new Arca({
  cuit: Number(process.env.ARCA_CUIT),
  cert: process.env.ARCA_CERT!,
  key: process.env.ARCA_KEY!,
});
```

Environment variables needed:
- `ARCA_CUIT` — CUIT of the contributor
- `ARCA_CERT` — Certificate content (from Clave Fiscal)
- `ARCA_KEY` — Private key content

## Architecture: Async Decoupled Flow

In a SaaS platform, ARCA server latency (3-60 seconds) is critical for UX. Never block the main thread.

### Optimal Flow

1. **User Action**: Client confirms a transaction (payment or budget acceptance).
2. **Local Persistence**: Record the voucher in DB with status `pending`.
3. **Immediate Response**: Server returns HTTP 202 (Accepted), freeing the UI.
4. **Worker/Scheduler**: Background process scans `pending` records at regular intervals (e.g. every 5 minutes).
5. **Fiscal Logic Execution**: Worker interacts with the SDK to request the CAE.
6. **Cycle Closure**: Record is updated with CAE, QR code, and status changed to `issued`.

This decoupled approach is the only foundation that supports robust error handling without compromising system stability.

## Error Handling: The 4 Critical Scenarios

Given the volatility of government services, the design must be defensive. **Absolute priority: Fiscal Integrity** — avoid duplicities and ensure every transaction has its corresponding legal backing.

### Case 1: ARCA Unavailability

When the service is down, implement **exponential backoff** (retries at 1, 5, and 15 minutes). Set a strict limit of **5 attempts**. If the error persists, mark the record for manual audit — don't saturate the services and allow elegant recovery when the ARCA node returns to normal.

### Case 2: Business Logic Errors

For validation errors (non-existent CUITs, invalid amounts, tax rate inconsistencies), trigger a **definitive error (400)**. Stop retries automatically and notify the user for manual correction of the source data.

### Case 3: The Timeout Dilemma (Data Synchronization)

This is the **most dangerous scenario**. If a request times out, you CANNOT assume it failed.

**Golden Rule**: Before retrying, call `getLastVoucherNumber`. However, getting the number isn't enough — you must compare that the data returned by ARCA (amount, client CUIT) matches the local attempt. If they match, sync the CAE. If they don't match or the number is earlier, proceed with emission.

### Case 4: Numbering Desynchronization and Race Conditions

Never trust an internal database counter. The system must perform a **dynamic query** of the last authorized number + 1 (`n+1`) immediately before each request.

> **Pro-Tip**: In SaaS environments with multiple workers, implement a **Distributed Lock** (e.g. using Redis) or a **Worker Singleton pattern** per CUIT/Point of Sale to guarantee that the Query -> Emission sequence is atomic and prevent numbering collisions.

## Reference Code: Production Worker

```typescript
import { Arca } from "@arcasdk/core";

const arca = new Arca({
  cuit: Number(process.env.ARCA_CUIT),
  cert: process.env.ARCA_CERT!,
  key: process.env.ARCA_KEY!,
});

async function processPendingVoucher(voucherData: any) {
  const { pointOfSale, type, totalAmount, clientCuit } = voucherData;

  // 1. Safety sync to avoid duplicates
  const lastVoucher = await arca.electronicBillingService.getLastVoucherNumber({
    salesPoint: pointOfSale,
    type: type,
  });

  // 2. Dynamic n+1 verification logic
  const nextNumber = lastVoucher + 1;

  try {
    const response = await arca.electronicBillingService.createVoucher({
      ...voucherData,
      number: nextNumber,
    });

    return { success: true, cae: response.cae, qr: response.qr };
  } catch (error) {
    // Defensive error handling per Case 1 and Case 2 protocols
    throw error;
  }
}
```

## Homologacion vs Produccion

| Feature | Homologacion | Produccion |
|---|---|---|
| CUIT de referencia | `20111111112` | CUIT Real del Contribuyente |
| Certificado (.cert) | Generado para testing | Tramite mediante Clave Fiscal |
| Integridad de Datos | Sin valor legal | Responsabilidad Fiscal Total |
| Habilitacion | Inmediata | Requiere delegacion de servicios |

## Product & Business Strategy

- **SaaS Strategy**: Offer electronic billing as a **Premium/Pro module**. This segments the market and manages the legal responsibility of issuing fiscal documents as a value-add.
- **Voucher Presentation**: For quick time-to-market, `@arcasdk/pdf` provides a functional solution. For a superior brand experience, develop custom HTML/CSS templates integrating the SaaS visual identity with mandatory data (CAE, QR, CUIT).
- **Transition to Production**: Involves a change in ARCA's trust management — requires delegation of services and real certificates.

## Arcom Architecture Context

In Arcom Tauri v2:
- **ARCA module**: `apps/pos-api/src/` (NestJS ARCA module)
- **Schema**: Voucher/invoice models in `packages/store/` (Prisma SQLite)
- **Offline-first**: Vouchers are stored locally in SQLite first, then synced to ARCA when online
- **Worker pattern**: NestJS scheduled tasks or background jobs processing pending vouchers
- **Multi-tenant**: Each store/company has its own CUIT and certificate configuration
