# Arcon Tauri — Arquitectura Detallada y Procesos de Migración

**Versión:** 1.0  
**Fecha:** 2026-07-16  
**Estado:** Propuesta de implementación  
**Objetivo:** Definir la arquitectura para la migración de Arcon a Tauri con React + SQLite, garantizando continuidad de operación para usuarios existentes y migración automática de datos.

---

## Tabla de Contenidos

1. [Principios Rectores](#1-principios-rectores)
2. [Stack Tecnológico Nuevo](#2-stack-tecnológico-nuevo)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Migración de Datos: PostgreSQL → SQLite](#5-migración-de-datos-postgresql--sqlite)
6. [Transición Transparente del Usuario](#6-transición-transparente-del-usuario)
7. [Backend Adaptado (NestJS Local)](#7-backend-adaptado-nestjs-local)
8. [Frontend React](#8-frontend-react)
9. [Tauri Runtime](#9-tauri-runtime)
10. [Sincronización Multi-Dispositivo y Cloud Opcional](#10-sincronización-multi-dispositivo-y-cloud-opcional)
11. [Estrategia de Testing](#11-estrategia-de-testing)
12. [Despliegue y Distribución](#12-despliegue-y-distribución)
13. [Documentación de Operaciones](#13-documentación-de-operaciones)

---

## 1. Principios Rectores

### 1.1 Cero Disrupción para Usuarios Existentes

**Objetivo:** Un usuario que usa Arcon hoy debe sentir que sigue usando Arcon mañana.

- **Transición automática:** Instalador detecta instalación anterior y ofrece migración de datos
- **Datos sin pérdida:** Toda la data de PostgreSQL se copia a SQLite sin necesidad de manual de usuario
- **Funcionalidad 100% idéntica:** La UX de React debe replicar Angular en puntos críticos (POS, reportes, caja)
- **Credenciales reutilizables:** Las mismas credenciales que usaba en cloud funcionan en local

### 1.2 Base de Datos Local pero Inteligente

- **SQLite embebido:** Sin instalación de Postgres, sin Docker, sin costos
- **Respaldo automático:** Backup diario a JSON comprimido (recuperable sin tecnología)
- **Sincronización opcional:** Quien quiera replicar a la nube lo puede hacer; quien no, está igual de seguro
- **Integridad referencial estricta:** Same constraints as PostgreSQL, validadas en Prisma layer

### 1.3 Reversibilidad

- **Exportador de datos:** Usuario puede exportar su DB local a SQL estándar
- **Compatibilidad cloud:** Si migra a cloud después, los datos funcionan igual
- **No hay lock-in tecnológico:** Datos abiertos, accesibles, movibles

---

## 2. Stack Tecnológico Nuevo

| Capa | Tecnología | Versión | Cambio | Razón |
|---|---|---|---|---|
| **Runtime** | Node.js | 20 LTS | ✓ Keep | Base NestJS |
| **Monorepo** | Nx | 22.3 | ✓ Keep | No requiere cambios |
| **Package manager** | pnpm | 10.23 | ✓ Keep | Lock de dependencias |
| **Backend API** | NestJS | 11 | ✓ Keep (adaptado) | Reutilizar 95% del código |
| **ORM** | Prisma | 5.22 | ↔ Adaptado | SQLite provider + migrations |
| **DB Local** | SQLite | 3.46+ | ✗ Nuevo | Embebido, sin servidor |
| **DB Sync (opt)** | Xata (PostgreSQL serverless) | 15 | ↔ Opcional | Solo si cloud está habilitado |
| **Frontend POS** | React | 19 | ✗ Nuevo | Reemplazo Angular |
| **UI Components** | Radix UI | latest | ✗ Nuevo | Headless, accesible |
| **UI Preset** | Shadcn/ui | latest | ✗ Nuevo | Built-in con TailwindCSS |
| **Styling** | TailwindCSS | 4 | ✓ Keep | Mismo sistema |
| **State Management** | Zustand | 5.x | ✗ Nuevo | Reemplazo NGRx (más simple) |
| **Routing** | React Router | 7.x | ✗ Nuevo | Lazy-loaded routes |
| **Desktop Wrapper** | Tauri | 2.x | ✗ Nuevo | Reemplazo Electron + Docker |
| **IPC (Tauri)** | Rust command module | — | ✗ Nuevo | Async Rust ↔ JS |
| **Process Manager** | Node.js child_process | — | ✗ Nuevo | Orquestar NestJS como sidecar |
| **Database Init** | Prisma CLI + Tauri plugins | — | ✗ Nuevo | Automated setup |

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de Componentes (Alto Nivel)

```
┌─────────────────────────────────────────────────────────────────┐
│                      MÁQUINA USUARIO LOCAL                       │
│                         (Windows/Mac/Linux)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TAURI RUNTIME (Rust)                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Window Manager + TrayManager + Auto-updater      │  │  │
│  │  │  IPC Bridge (Rust ↔ JS)                           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │         │                            │                    │  │
│  ├─────────┼────────────────────────────┼──────────────────┤  │
│  │         │                            │                    │  │
│  │  ┌──────▼──────────┐        ┌────────▼──────────┐        │  │
│  │  │  REACT FRONTEND  │        │  NestJS API      │        │  │
│  │  │  (Vite + SSR)    │◄──────►│  (localhost:3000)│        │  │
│  │  │  :5173 (dev)     │        │                  │        │  │
│  │  │                  │        │  Monolito        │        │  │
│  │  │ • POS Cart       │        │  - features/*    │        │  │
│  │  │ • Inventory      │        │  - data-access/* │        │  │
│  │  │ • Reports        │        │                  │        │  │
│  │  │ • Settings       │        │  Controllers ──┐ │        │  │
│  │  │ • Dashboard      │        │  Services      │ │        │  │
│  │  └──────────────────┘        └────────┬───────┼┘        │  │
│  │         │                             │       │          │  │
│  │         │ (fetch/REST/HTTP)          │       │          │  │
│  │         │                             │       │          │  │
│  │         └─────────────────────────────┘       │          │  │
│  │                                               │          │  │
│  │  ┌──────────────────────────────────────────▼┐          │  │
│  │  │  PRISMA + SQLite                          │          │  │
│  │  │  └─────► ~/.arcon/data/app.db            │          │  │
│  │  │  └─────► ~/.arcon/backup/auto_*.tar.gz  │          │  │
│  │  └──────────────────────────────────────────┘          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FILE SYSTEM                                             │  │
│  │  ~/.arcon/                                               │  │
│  │  ├── data/                      (SQLite + logs)         │  │
│  │  ├── backup/                    (Auto-backups)          │  │
│  │  ├── config/                    (App settings)          │  │
│  │  ├── sync/                      (Queue + offline cache) │  │
│  │  └── logs/                      (App & API logs)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (OPCIONAL)
                              │ HTTP HTTPS + Sync Queue
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD (Xata PostgreSQL serverless)            │
│  ├── Réplica de datos (Sync bi-direccional)                     │
│  ├── Multi-dispositivo (sincronización entre equipos)           │
│  └── Backup remoto (redundancia)                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Datos

```
ESCRITURA LOCAL (POS - Venta):
1. React UI → fetch POST /api/sales
2. NestJS Controller recibe → valida DTO → delega Service
3. Service orquesta SalesRepository → Prisma ORM
4. Prisma → SQLite (INSERT con FK, triggers)
5. Respuesta JSON → React
6. React actualiza Zustand store → re-render
7. Si está online: SyncQueue encolama cambio
8. Worker en background: replica a Xata (PostgreSQL serverless, async, sin bloquear)
9. Si está offline: cambio queda en localSync queue
10. Al reconectar: worker sincroniza batch de cambios

LECTURA LOCAL (Listado de Productos):
1. React → fetch GET /api/products?storeId=X
2. NestJS → ProductsRepository.findByStore(companyId, storeId)
3. Prisma → SELECT * FROM products WHERE companyId=X AND storeId=Y
4. Respuesta → React (vía HTTP localhost:3000)
5. Datos en caché de Zustand para no re-fetchear

MIGRACIÓN INICIAL (PostgreSQL → SQLite):
1. Usuario instala Arcon Tauri
2. Launcher detecta versión anterior en sistema
3. Ofrece: "¿Migrar datos de cloud a local?" 
4. Si sí:
   a. Launcher abre un asistente (React wizard)
   b. Usuario ingresa email + contraseña del cloud
   c. Backend NestJS (via API cloud) valida credenciales + extrae ID
   d. Se descarga full schema de PostgreSQL en lotes
   e. Cada lote se transforma a SQLite types (Decimal→Int, Json→TEXT)
   f. Prisma migrate crea schema en SQLite
   g. Data se inserta en batch (NO hay transacciones distribuidas)
   h. Se validan integridades referenciales
   i. Se crean índices
   j. Usuario ve progreso: "Migrando 45,234 productos... (paso 3 de 8)"
   k. Migración completa → Login automático con mismas credenciales
   l. Primer sync opcional: "¿Mantener sincronizado con cloud?" (Sí/No)
```

---

## 4. Estructura de Carpetas

### 4.1 Raíz del Monorepo (Sin cambios principales)

```
arcon-monorepo/
├── apps/
│   ├── api/                    # ✓ NestJS (ADAPTADO a SQLite)
│   ├── pos-react/              # ✗ NUEVO: React + Radix + Tailwind
│   ├── pos-e2e/                # (Playwright tests → pos-react)
│   ├── shop/                   # ✓ Next.js (SIN CAMBIOS)
│   ├── marketing-landing/      # ✓ Astro (SIN CAMBIOS)
│   ├── arcon-launcher/         # ✗ NUEVO: Tauri 2.x (reemplaza Electron)
│   ├── arcon-updater/          # DEPRECADO (Tauri built-in updater)
│   └── api-e2e/                # ✓ Tests siguen igual
│
├── libs/api/                   # ✓ ADAPTADA
│   ├── core/
│   │   ├── data-access-prisma/
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma    # ✓ ADAPTADO: SQLite provider + tipos
│   │   │   ├── services/
│   │   │   │   ├── prisma.service.ts    # ✓ Sin cambios sustanciales
│   │   │   │   └── offline-sync.service.ts # NUEVO: Gestión SyncQueue local
│   │   │   └── migrations/           # ✓ Prisma migrations (SQLite-ready)
│   │   │
│   │   ├── tenant/
│   │   │   ├── tenant-context.service.ts   # ✓ Adaptado: empresa única (NO multi-tenant)
│   │   │   ├── tenant.guard.ts             # ✓ Validación JWT sin multi-tenant
│   │   │   └── local-tenant.middleware.ts  # NUEVO: Inyectar companyId local
│   │   │
│   │   ├── data-access-base/
│   │   │   └── entities/
│   │   │       ├── base.entity.ts       # ✓ Idem
│   │   │       └── local-tenant-base.entity.ts # NUEVO: CRUD sin multi-tenant
│   │   │
│   │   └── feature-{domain}/
│   │       ├── {domain}.controller.ts
│   │       ├── {domain}.service.ts
│   │       └── {domain}-{repo}.repository.ts
│   │
│   └── (resto de libs: sin cambios sustanciales)
│
├── prisma/
│   ├── schema.prisma        # ✓ ADAPTADO: provider="sqlite" + tipos conversión
│   ├── migrations/          # SQLite migrations (auto-generated por Prisma)
│   └── seed.ts              # ✓ Datos iniciales (ejecutado en primer init)
│
├── docker-compose.yml       # ✗ DEPRECADO (NO se usa más)
├── Dockerfile               # ✗ DEPRECADO
│
├── workspace.json           # ✓ Nx config (se añaden nuevas apps)
├── tsconfig.base.json       # ✓ Keep
├── pnpm-workspace.yaml      # ✓ Keep
└── README.md                # ✓ Actualizar instrucciones
```

### 4.2 Estructura de `apps/pos-react/` (Nueva)

```
apps/pos-react/
├── src/
│   ├── main.tsx                    # Entry point Vite
│   ├── App.tsx                     # Root component
│   ├── index.css                   # TailwindCSS imports
│   │
│   ├── api/
│   │   ├── client.ts               # Fetch wrapper + interceptors
│   │   ├── auth.service.ts         # Login, logout, refresh
│   │   ├── sales.service.ts        # POST /api/sales, GET /api/sales
│   │   ├── products.service.ts     # CRUD productos
│   │   ├── inventory.service.ts    # Stock, movimientos
│   │   ├── contacts.service.ts     # Clientes/proveedores
│   │   ├── cash-register.service.ts
│   │   ├── reports.service.ts
│   │   └── settings.service.ts
│   │
│   ├── store/                      # Zustand stores
│   │   ├── auth.store.ts           # user, isAuth, jwt
│   │   ├── sales.store.ts          # currentCart, items, total, draft
│   │   ├── products.store.ts       # all, selected, search cache
│   │   ├── ui.store.ts             # modal visibility, sidebar state, theme
│   │   ├── offline.store.ts        # isOnline, syncStatus, conflictQueue
│   │   └── settings.store.ts       # company, store, prefs
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # useContext + store subscriber
│   │   ├── useOfflineSync.ts       # Sync status polling
│   │   ├── useApi.ts               # Fetch con retry logic
│   │   ├── usePrinter.ts           # Tauri command: print receipt
│   │   ├── useSpeechToText.ts      # Micrófono → busqueda productos
│   │   └── usePersistedState.ts    # localStorage wrapper
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── pos/
│   │   │   ├── POSPage.tsx         # Main POS cashier
│   │   │   ├── Cart.tsx            # Carrito dinámico
│   │   │   ├── ProductSearch.tsx   # Busca/categorías
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── PaymentDialog.tsx   # Efectivo, tarjeta, etc.
│   │   │   ├── ReceiptPrinter.tsx
│   │   │   └── OfflineIndicator.tsx # "Modo offline" badge
│   │   │
│   │   ├── inventory/
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── StockMovements.tsx
│   │   │   └── StockAdjustment.tsx
│   │   │
│   │   ├── products/
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductVariants.tsx
│   │   │   └── PricingManager.tsx
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactsPage.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   └── CustomerHistory.tsx
│   │   │
│   │   ├── cash-register/
│   │   │   ├── CashRegisterPage.tsx
│   │   │   ├── OpenRegisterModal.tsx
│   │   │   ├── CloseRegisterModal.tsx
│   │   │   └── CashMovements.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── SalesReport.tsx
│   │   │   ├── InventoryReport.tsx
│   │   │   └── CashReport.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── CompanyForm.tsx
│   │   │   ├── StoreForm.tsx
│   │   │   ├── UsersManager.tsx
│   │   │   ├── CloudSyncSettings.tsx    # NUEVO
│   │   │   └── BackupRestore.tsx        # NUEVO
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── FirstRunWizard.tsx       # Setup inicial
│   │   │   └── OfflinePage.tsx          # "No puedes hacer login offline"
│   │   │
│   │   ├── shared/
│   │   │   ├── Button.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Form.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── (todo Shadcn/ui)
│   │   │
│   │   └── modals/
│   │       ├── ConfirmDialog.tsx
│   │       ├── LoadingModal.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── pages/                      # React Router pages (lazy-loaded)
│   │   ├── DashboardPage.tsx
│   │   ├── POSPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── routes/
│   │   └── routes.tsx              # Route definitions (lazy)
│   │
│   ├── utils/
│   │   ├── currency.ts             # Formatear moneda
│   │   ├── dates.ts                # Formateo de fechas
│   │   ├── validators.ts           # Validaciones cliente
│   │   ├── offline-queue.ts        # Manejo de queue offline
│   │   └── error-handler.ts        # Global error handling
│   │
│   ├── types/
│   │   ├── api.ts                  # Types de respuestas API
│   │   ├── domain.ts               # Product, Sale, Contact, etc.
│   │   └── ui.ts                   # UIState, ModalState, etc.
│   │
│   └── __tests__/
│       ├── components/             # Vitest + React Testing Library
│       ├── hooks/
│       ├── utils/
│       └── integration/
│
├── public/
│   ├── icons/                      # PNG, SVG (iconos app)
│   └── help/                       # Documentación local (markdown)
│
├── vite.config.ts                  # ✓ Vite 6.x
├── vitest.config.ts                # ✓ Vitest
├── tailwind.config.ts              # ✓ TailwindCSS 4
├── tsconfig.json                   # ✓ TypeScript
├── eslintrc.cjs                    # ✓ ESLint
└── package.json
```

### 4.3 Estructura de `apps/arcon-launcher/` (Nueva - Tauri)

```
apps/arcon-launcher/
├── src-tauri/                      # Código Rust (Tauri backend)
│   ├── src/
│   │   ├── main.rs                 # Entry point
│   │   ├── lib.rs
│   │   │
│   │   ├── commands/
│   │   │   ├── process_manager.rs   # spawn/kill NestJS process
│   │   │   ├── database_manager.rs  # init DB, run migrations
│   │   │   ├── system_manager.rs    # CPU, RAM, disk usage
│   │   │   ├── updater_manager.rs   # Check for updates
│   │   │   ├── export_data.rs       # Exportar SQLite a SQL
│   │   │   ├── backup_manager.rs    # Backup/restore
│   │   │   └── cloud_sync.rs        # Trigger manual sync
│   │   │
│   │   ├── services/
│   │   │   ├── logger.rs            # File logging (datos/logs/)
│   │   │   ├── config.rs            # Lee .arcon/config/app.json
│   │   │   ├── health_check.rs      # Polling NestJS :3000/health
│   │   │   └── auto_backup.rs       # Cron-like backup scheduler
│   │   │
│   │   └── utils/
│   │       ├── paths.rs             # ~/.arcon/
│   │       └── errors.rs            # Custom error types
│   │
│   ├── Cargo.toml                  # Deps: tauri, tokio, serde, etc.
│   └── tauri.conf.json             # Tauri config (windows, security)
│
├── src/                            # Código React (Tauri frontend)
│   ├── App.tsx                     # Root (mismo que pos-react)
│   └── (igual a pos-react/src)
│
├── index.html                      # HTML entry
├── vite.config.ts                  # Vite + Tauri plugin
├── package.json
└── (eslint, tsconfig, etc.)
```

---

## 5. Migración de Datos: PostgreSQL → SQLite

### 5.1 Estrategia General

**Premisa:** Migración **sin pérdida, sin downtime percibido, reversible**.

El usuario instala Arcon Tauri. Si tiene instalación anterior, se le ofrece:

```
┌─────────────────────────────────────────────────┐
│  ¿Tienes datos en la nube?                      │
│                                                 │
│  [✓] Migrar mis datos a local (RECOMENDADO)    │
│  [ ] Empezar de cero                            │
│  [ ] Aún no sé                                  │
└─────────────────────────────────────────────────┘
```

Si elige "Migrar", aparece:

```
┌──────────────────────────────────────────────────┐
│  Ingresá tu email y contraseña de Arcon         │
│                                                  │
│  Email:    [____________________]               │
│  Password: [____________________]               │
│                                                  │
│         [ Cancelar ]    [ Siguiente ]            │
└──────────────────────────────────────────────────┘
```

Luego:

```
┌──────────────────────────────────────────────────┐
│  Migrando datos...                               │
│                                                  │
│  █████████████░░░░░░░░  60%                     │
│                                                  │
│  Productos: 45,234 ✓                            │
│  Ventas: 12,456 ✓                               │
│  Inventario: En proceso...                      │
│                                                  │
│  Tiempo estimado: 2 min 30s                     │
└──────────────────────────────────────────────────┘
```

### 5.2 Proceso Técnico Detallado

#### **Paso 1: Validación y Obtención de Datos (Cloud API)**

```typescript
// API call: POST /api/migration/export
// Realizado por NestJS (runtime local temporal)

interface ExportRequest {
  email: string;
  password: string;
}

interface ExportResponse {
  companyId: string;
  storeId: string;
  schemaVersion: number;
  tables: {
    [tableName: string]: {
      count: number;
      hasLargeFields: boolean;
    }
  }
  estimatedSizeKB: number;
  cursor?: string  // Para paginación
}
```

**Backend (NestJS cloud):**

```typescript
// cloud-api/src/features/migration/migration.controller.ts
@Post('export')
async exportData(@Body() req: ExportRequest) {
  // 1. Validar credenciales
  const user = await this.authService.validate(req.email, req.password);
  const company = await this.companiesRepository.findByUser(user.id);
  
  // 2. Generar token de descarga (válido 10 minutos)
  const token = generateExportToken(company.id, Date.now() + 10*60*1000);
  
  // 3. Retornar metadata
  return {
    companyId: company.id,
    storeId: company.stores[0].id, // Usar primera store
    tables: await this.countTablesForCompany(company.id),
    exportToken: token
  };
}
```

#### **Paso 2: Descargar Datos en Lotes (Tauri)**

```rust
// src-tauri/src/commands/database_manager.rs

#[tauri::command]
async fn download_company_data(
    company_id: String,
    export_token: String,
) -> Result<DownloadProgress, String> {
    // 1. Obtener lista de tablas
    let tables = vec![
        "companies", "stores", "users", "products", "inventory",
        "sales", "sales_items", "contacts", "cash_registers", ...
    ];
    
    // 2. Para cada tabla, descargar en batches (10K rows)
    for table in tables {
        let mut offset = 0;
        loop {
            let batch = http_client.get_batch(
                format!("/api/migration/table/{}/{}", company_id, table),
                offset,
                10000,
                &export_token
            ).await?;
            
            if batch.data.is_empty() { break; }
            
            // 3. Transformar Postgres types → SQLite types
            let transformed = transform_postgres_to_sqlite(&batch.data);
            
            // 4. Guardar en caché local (JSON)
            fs::write(
                format!("~/.arcon/sync/import_cache_{}.json", table),
                serde_json::to_string(&transformed)?
            )?;
            
            // 5. Emitir progreso al frontend
            emit_progress(format!("{}: {}/{}",
                table, offset + batch.data.len(), batch.total
            ));
            
            offset += 10000;
        }
    }
    
    Ok(DownloadProgress { status: "complete" })
}
```

#### **Paso 3: Transformación de Tipos**

**Problema:** PostgreSQL tiene tipos que SQLite no soporta.

| PostgreSQL | SQLite | Conversión | Ejemplo |
|---|---|---|---|
| `DECIMAL(10,2)` | `INTEGER` | Multiplicar × 100 (centavos) | 99.99 → 9999 |
| `UUID` | `TEXT(36)` | String UTF-8 | Igual |
| `TIMESTAMP` | `INTEGER` | Unix timestamp (ms) | Igual (parse en JS) |
| `JSONB` | `TEXT` | Stringify JSON | `{"key":"value"}` |
| `BYTEA` | `BLOB` | Base64 | Igual |
| `ENUM` | `TEXT` | Check constraint | Mantener string |
| `INT8` | `INTEGER` | Range checking | SQLite soporta BIGINT |

**Regla de oro:** Toda conversión se hace **sin pérdida de información**, reversible.

```typescript
// libs/api/core/data-access-prisma/transformer.service.ts

export class PostgresToSqliteTransformer {
  
  // Conversión por campo
  private fieldConverters: Map<string, (value: any) => any> = new Map([
    ['price', (v: string) => Math.round(parseFloat(v) * 100)], // DECIMAL → INT
    ['discount', (v: string) => Math.round(parseFloat(v) * 100)],
    ['metadata', (v: object) => JSON.stringify(v)], // JSONB → TEXT
    ['created_at', (v: string) => new Date(v).getTime()], // TIMESTAMP → INT ms
  ]);

  transformRow(table: string, row: Record<string, any>): Record<string, any> {
    const schema = this.getTableSchema(table);
    const transformed = {};
    
    for (const [key, value] of Object.entries(row)) {
      const field = schema.fields[key];
      if (!field) continue; // Skip unknown fields
      
      // Aplicar converter específico si existe
      const converter = this.fieldConverters.get(key);
      transformed[key] = converter ? converter(value) : value;
    }
    
    return transformed;
  }
}
```

#### **Paso 4: Crear Schema SQLite y Insertar Datos**

```typescript
// Tauri command

#[tauri::command]
async fn finalize_migration(
    company_id: String,
) -> Result<MigrationResult, String> {
    let db_path = get_db_path();
    
    // 1. Crear base de datos SQLite
    let db = sqlite::open(&db_path)?;
    
    // 2. Ejecutar Prisma migrations (creates schema)
    std::process::Command::new("npx")
        .args(&["prisma", "migrate", "deploy"])
        .env("DATABASE_URL", format!("file:{}", db_path))
        .output()?;
    
    // 3. Insertar datos desde caché en lotes
    for table in vec![...] {
        let data = fs::read_to_string(
            format!("~/.arcon/sync/import_cache_{}.json", table)
        )?;
        let rows: Vec<Record> = serde_json::from_str(&data)?;
        
        for chunk in rows.chunks(1000) {
            // Batch insert (1000 rows a la vez)
            db.execute_batch(
                &build_insert_statement(table, chunk)
            )?;
        }
    }
    
    // 4. Crear índices
    db.execute_batch(&INDEXES_SQL)?;
    
    // 5. Vacío (optimization)
    db.execute("VACUUM;")?;
    
    // 6. Generar checksum
    let checksum = db.execute("SELECT md5(group_concat(...)) FROM ...")?;
    
    Ok(MigrationResult {
        status: "success",
        company_id,
        local_db_path: db_path,
        rows_migrated: total_rows,
        checksum,
    })
}
```

### 5.3 Validación Post-Migración

```typescript
// Verificar integridad

interface MigrationCheck {
  table: string;
  expected_count: number;
  actual_count: number;
  mismatches: bool;
}

async function validateMigration(): Promise<MigrationCheck[]> {
  const checks = [];
  
  for (const table of ALL_TABLES) {
    const local = await db.count(table);
    const expected = EXPORT_DATA[table].count;
    
    checks.push({
      table,
      expected_count: expected,
      actual_count: local,
      mismatches: expected !== local
    });
  }
  
  // Si alguno no coincide, mostrar warning (pero continuar)
  const failures = checks.filter(c => c.mismatches);
  if (failures.length > 0) {
    logger.warn('Migration validation failed for tables:', 
      failures.map(f => f.table));
  }
  
  return checks;
}
```

### 5.4 Reversibilidad: Exportador a PostgreSQL

**Si el usuario quiere volver a cloud:**

```typescript
// Tauri command: Export SQLite to PostgreSQL compatible SQL

#[tauri::command]
async fn export_to_sql_script() -> Result<String, String> {
    // 1. Dump SQLite a SQL estándar
    let sql = std::process::Command::new("sqlite3")
        .args(&[&db_path, ".dump"])
        .output()?
        .stdout;
    
    // 2. Transformar types SQLite → PostgreSQL
    let transformed = sqlite_sql_to_postgres(&sql);
    
    // 3. Guardar a archivo descargable
    let export_path = format!("~/.arcon/backup/export_{}.sql", now());
    fs::write(&export_path, transformed)?;
    
    // 4. User puede uploadear manualmente o vía Tauri dialog
    Ok(export_path)
}
```

### 5.5 Migración One-off del Cliente (v1 → v2) — Implementada

> Las secciones 5.1–5.4 describen el **wizard del producto final** (migración para usuarios finales durante el setup). Esta sección documenta la migración **one-off del equipo** que se ejecutó para llevar los datos reales del cliente de Arcon v1 (Xata PostgreSQL) al formato v2.

**Estrategia:** expand/contract con la DB v1 intacta como rollback.

- La DB v1 (Xata) **no se toca** — se lee solo con queries read-only.
- El transform/import/validación se hace **contra SQLite local** en dev (nunca pruebas iterativas contra la nube).
- La DB **"v2" en Xata** (nueva, PostgreSQL serverless) es el cloud target de sync v2, inicializada con el schema del admin-panel (ver abajo).

**Scripts (one-off, en `apps/api/scripts/`):**

| Script | Rol |
|---|---|
| `migrate-v1.ts` | Lee v1 vía `pg` (env `V1_DATABASE_URL`, read-only), transforma y escribe a la DB de destino (env `DATABASE_URL`) |
| `validate-migrate.ts` | Checksums cruzados v1↔v2: totales, conteos por tabla, precios, stock, movimientos por tipo, saldos |

Corrida con `pnpm migrate:v1` / `pnpm validate:v1` (scripts npm en `apps/api`).

**Transformaciones aplicadas:**

| Regla v2 | Detalle |
|---|---|
| IDs | `Int` de v1 → `String` con el mismo valor (`"5"` → `"5"`); evita mapas de traducción de FK y permite cruzar datos v1/v2 durante el solapamiento |
| Dinero | `DECIMAL` → `INTEGER` centavos (`_cents`) |
| Timestamps | `DateTime` → `Int` segundos (`_at`) |
| Enums | Strings lowercase (v2 no usa enums) |
| Tablas | `@@map` snake_case |
| `Sale.payment_method` | Derivado del `SalePayment` de mayor monto; todos los pagos se preservan en `payment_details` (JSON) |
| `Customer` + `Contact` | Fusionados en `Contact` (campo `type`); `balance_cents` del `Customer` |
| `CustomerTransaction` | → `WalletTransaction` |
| `Product.storeId` | Store principal (v1 no tenía la relación en el producto) |
| `SyncQueue` | **No se migra** (5.819 filas de cola v1 sin sentido en v2) |
| SaleItems sin variante (free-text) | → producto genérico sintético `PRD-0` "Producto genérico" (inactivo) |
| `CashMovement` sin `cashShiftId` | → `CashRegister` sintético "Histórico" por store (v2 exige FK a caja) |

**Conteos migrados (cliente real "Libreria Magna", 2026-07-31):** 402 productos (403 con el genérico), 477 variantes, 440 inventory, 739 movimientos, 397 ventas, 884 items, 60 cajas (59 shifts + 1 histórica), 282 movimientos de caja, 2 tasks, 1 store config. Checksums OK (totales de ventas $1.386.373,00; caja $769.845). Única diferencia esperada: pagos vs totales de ventas difieren $6.100 — inconsistencia **pre-existente de v1** (ventas 62 y 48 con pagos mayores a su total), preservada fielmente.

**Cloud target (Xata v2):** el schema de negocio vive solo en SQLite local. La DB cloud se inicializa con el schema del **admin-panel** (`apps/admin-panel/prisma/schema.prisma`, provider PostgreSQL: `plans`, `clients`, `licenses`, `payments`, `synced_changes`, `support_tickets`) vía `prisma db push`, y el tenant se siembra con `apps/admin-panel/scripts/seed-tenant.ts` (datos del cliente vía env, sin PII en el repo). Esto está alineado con el modelo de sync implementado (`SYNC.md`): el cloud es un **relay** (`synced_changes` JSON), no un espejo del schema de negocio.

**Ladrillo reutilizable — endpoint `POST /api/migration/import`:** la misma lógica del script one-off está disponible como `MigrationService` (`apps/api/src/features/migration/`, módulo `MigrationModule`) y expuesta como endpoint público de la API local:

- Contrato Zod (`dto/import-v1.schema.ts`): `{ databaseUrl: string, primaryStoreId?: string }`.
- `@Public()` a propósito: corre durante el setup, antes de que existan company/usuario (no hay JWT posible). La credencial real es la **URL de conexión v1**; la guardia es el estado: responde `409 Conflict` si ya existe company (mismo patrón que `initCompany`).
- `companyId` y `primaryStoreId` se **derivan de v1** (o `primaryStoreId` del dto), reemplazando los hardcodes `'1'`/`'4'` del script dev — desacoplado de los datos del cliente.
- Respuesta `MigrationSummary`: `{ status, companyId, primaryStoreId, rowsMigrated, completedAt }`.
- El script dev `apps/api/scripts/migrate-v1.ts` queda como herramienta histórica/rollback; se consolidará con el service cuando se construya el wizard UI.
- **Frontend pendiente:** el wizard UI (CLI-INTERACTIVE §3) se construirá sobre este endpoint cuando exista demanda de usuarios v1.

---

## 6. Transición Transparente del Usuario

### 6.1 Instalador Inteligente

```
Arcon_SETUP.exe (Windows)

1. ¿Dónde instalar?
   └─► C:\Program Files\Arcon\  [Browse]

2. ¿Primera vez?
   ○ Sí, empezar de cero
   ○ Tengo datos en la nube
   └─► (Si: abrir wizard de migración)

3. (Descarga ~80MB Tauri + Node + dependencies)

4. Instalación finalizada
   └─► Abre automáticamente Arcon
   └─► Detona FirstRunWizard si es primera vez
```

### 6.2 FirstRunWizard (React)

```typescript
// apps/pos-react/src/components/auth/FirstRunWizard.tsx

const FirstRunWizard = () => {
  const [step, setStep] = useState<'welcome' | 'company' | 'admin' | 'done'>('welcome');
  const { createCompany } = useSettingsApi();
  
  return (
    <div className="flex h-screen items-center justify-center bg-gradient">
      {step === 'welcome' && (
        <WelcomeStep onNext={() => setStep('company')} />
      )}
      
      {step === 'company' && (
        <CompanySetupStep 
          onNext={() => setStep('admin')}
          onComplete={handleMigrationComplete}
        />
      )}
      
      {step === 'admin' && (
        <AdminUserSetupStep 
          onComplete={() => setStep('done')}
        />
      )}
      
      {step === 'done' && (
        <SuccessStep onFinish={() => navigate('/dashboard')} />
      )}
    </div>
  );
};
```

### 6.3 Equivalencia de UX

**Objetivo:** User de Angular POS no se pierde en React.

| Feature | Angular (Viejo) | React (Nuevo) | Diferencia |
|---|---|---|---|
| **Login** | Form estándar | Form idéntico (mismo auth) | ✓ Ninguna |
| **Dashboard** | Cards + widgets | Cards + widgets (Shadcn) | ✓ Ninguna (visual similar) |
| **POS Cart** | Detalle + búsqueda lado | Carrito + búsqueda lado | ✓ Layout same |
| **Productos CRUD** | Tabla + formulario modal | Tabla + formulario modal | ✓ Mismo flujo |
| **Reportes** | Tables con export | Tables con export | ✓ Mismo output |
| **Caja** | Apertura/cierre modal | Apertura/cierre modal | ✓ Mismo |
| **Inventario** | Listado + ajustes | Listado + ajustes | ✓ Mismo |
| **Atajos teclado** | Alt+P = abre POS | Alt+P = abre POS | ✓ Mantener |

**Decisión importante:** No hacer re-diseño UI while migrating. Después, optimizar UX en React con mejor interactividad.

### 6.4 Feature Flags para Rollback

```typescript
// libs/api/core/feature-flags/feature-flags.service.ts

export enum FeatureFlag {
  USE_REACT_POS = 'use_react_pos',
  USE_LOCAL_SQLITE = 'use_local_sqlite',
  ENABLE_CLOUD_SYNC = 'enable_cloud_sync',
}

export class FeatureFlagsService {
  isEnabled(flag: FeatureFlag, companyId: string): boolean {
    // Consultar DB → flag habilitado por default en desarrollo
    // pero con kill switch en producción
    const dbFlag = this.repo.getFlag(flag, companyId);
    return dbFlag?.enabled ?? this.defaults[flag];
  }
}
```

**Uso en controllers:**

```typescript
@Get('pos')
async getPOSPage(@Req() req) {
  if (!this.featureFlags.isEnabled(FeatureFlag.USE_REACT_POS)) {
    // Fallback a Angular (servir versión legacy)
    return res.redirect('/legacy/pos');
  }
  // Servir React
  return res.send(reactBundleHtml);
}
```

---

## 7. Backend Adaptado (NestJS Local)

### 7.1 Cambios Principales en NestJS

#### **A. Adaptación a SQLite (sin multi-tenant local)**

```typescript
// libs/api/core/tenant/local-tenant.middleware.ts

export class LocalTenantMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}
  
  use(req: Request, res: Response, next: NextFunction) {
    // En local, SIEMPRE usar companyId del config local
    // No depender del JWT (aunque siga siendo requerido)
    
    const localCompanyId = this.configService.get('LOCAL_COMPANY_ID');
    
    // Inyectar en request
    req['companyId'] = localCompanyId;
    req['storeId'] = this.configService.get('LOCAL_STORE_ID');
    req['userId'] = req.user.id; // Del JWT
    
    next();
  }
}
```

#### **B. Schema Prisma Adaptado**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  // url = "file:~/.arcon/data/app.db"
}

// Tabla Company (única en local, datos de configuración)
model Company {
  id                String   @id @default(cuid())
  name              String
  taxId             String   @unique
  address           String?
  email             String?
  phone             String?
  created_at        Int      @default(0) // Unix timestamp en ms
  updated_at        Int
  config            String?  // JSON: business_hours, etc.
  
  stores            Store[]
  users             User[]
  products          Product[]
  inventory         Inventory[]
  sales             Sale[]
  contacts          Contact[]
  cash_registers    CashRegister[]
  
  @@map("companies")
}

// Tipos adaptados para SQLite
model Product {
  id                String   @id @default(cuid())
  companyId         String   // FK a Company (aunque local siempre es la misma)
  storeId           String   // FK a Store
  code              String
  name              String
  description       String?
  price_cents       Int      // DECIMAL(10,2) → Int (centavos)
  cost_cents        Int?
  stock_quantity    Int      @default(0)
  sku               String?
  category_id       String?
  metadata          String?  // JSON stringificado
  is_active         Boolean  @default(true)
  created_at        Int
  updated_at        Int
  
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  store             Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  inventory         Inventory[]
  sale_items        SaleItem[]
  
  @@unique([companyId, storeId, code])
  @@map("products")
}

model Sale {
  id                String   @id @default(cuid())
  companyId         String
  storeId           String
  cash_register_id  String
  user_id           String   // Quien registró la venta
  contact_id        String?  // Cliente (opcional)
  
  total_cents       Int      // DECIMAL(10,2) → Int
  discount_cents    Int      @default(0)
  tax_cents         Int      @default(0)
  
  status            String   @default("completed") // completed, canceled, draft
  payment_method    String   // cash, card, check, mixed
  payment_details   String?  // JSON: {card_last4, auth_code, etc.}
  
  notes             String?
  synced_at         Int?     // Unix ms — null = pending sync
  
  items             SaleItem[]
  
  created_at        Int
  updated_at        Int
  
  @@index([companyId, storeId])
  @@index([created_at])
  @@map("sales")
}

// Con WAL mode para concurrencia
```

#### **C. TenantBaseEntity Adaptado**

```typescript
// libs/api/core/data-access-base/entities/local-tenant-base.entity.ts

export abstract class LocalTenantBaseEntity {
  // NO hereda automáticamente companyId
  // Cada repositorio debe inyectarlo desde Middleware
  
  abstract id: string;
  abstract created_at: number; // Unix ms
  abstract updated_at: number;
}

export abstract class LocalTenantRepository<T extends LocalTenantBaseEntity> {
  constructor(
    protected prisma: PrismaService,
    protected tenantContext: TenantContextService,
  ) {}
  
  // Helper: inyectar companyId automáticamente
  protected getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }
  
  async create(data: Partial<T>): Promise<T> {
    return this.prisma[this.modelName].create({
      data: {
        ...data,
        companyId: this.getCompanyId(),
        created_at: Date.now(),
        updated_at: Date.now(),
      }
    });
  }
  
  async findAll(filters?: Record<string, any>): Promise<T[]> {
    return this.prisma[this.modelName].findMany({
      where: {
        companyId: this.getCompanyId(),
        ...filters,
      }
    });
  }
}
```

### 7.2 Offline-First Sync Queue

```typescript
// libs/api/core/feature-sync/offline-sync.service.ts

export class OfflineSyncService {
  private queue: SyncQueueItem[] = [];
  
  // Enqueuar cambios (escritura)
  async enqueueChange(change: SyncQueueItem): Promise<void> {
    // 1. Guardar en SQLite (tabla sync_queue)
    await this.prisma.syncQueue.create({
      data: {
        action: change.action, // 'create' | 'update' | 'delete'
        entity: change.entity, // 'product' | 'sale' | etc.
        entityId: change.entityId,
        payload: JSON.stringify(change.payload),
        status: 'pending',
        created_at: Date.now(),
      }
    });
    
    // 2. Si estamos online, procesar inmediatamente
    if (this.isOnline) {
      this.processQueue();
    }
    // Si offline, esperar reconnect event
  }
  
  // Procesar queue (lectura)
  async processQueue(): Promise<void> {
    const pending = await this.prisma.syncQueue.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'asc' },
      take: 100, // Procesar de a 100
    });
    
    for (const item of pending) {
      try {
        // Enviar a cloud
        await fetch(`${CLOUD_URL}/api/sync/apply`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.jwt}` },
          body: JSON.stringify({
            action: item.action,
            entity: item.entity,
            payload: JSON.parse(item.payload),
          })
        });
        
        // Marcar como synced
        await this.prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: 'synced', synced_at: Date.now() }
        });
      } catch (error) {
        // Reintentar después
        logger.warn(`Sync failed for ${item.entity}:${item.entityId}`, error);
      }
    }
  }
  
  // Escuchar eventos de reconexión
  onOnlineStatusChange(isOnline: boolean): void {
    if (isOnline) {
      this.processQueue();
    }
  }
}
```

### 7.3 Endpoints de Setup

```typescript
// libs/api/core/feature-system/system.controller.ts

@Post('setup/init-company')
@Public() // Sin auth requerido (primera vez)
async initCompany(@Body() dto: InitCompanyDto) {
  const company = await this.companiesService.create({
    name: dto.companyName,
    taxId: dto.taxId,
  });
  
  const store = await this.storesService.create({
    companyId: company.id,
    name: 'Sucursal Principal',
  });
  
  const adminUser = await this.usersService.create({
    companyId: company.id,
    email: dto.adminEmail,
    password: dto.adminPassword,
    role: 'admin',
  });
  
  // Retornar JWT para login automático
  const token = this.authService.generateJwt(adminUser);
  
  return {
    companyId: company.id,
    storeId: store.id,
    userId: adminUser.id,
    token,
  };
}

@Get('setup/status')
@Public()
async getSetupStatus() {
  const companyCount = await this.prisma.company.count();
  
  return {
    isInitialized: companyCount > 0,
  };
}
```

### 7.4 Health Check para Tauri

```typescript
// libs/api/core/feature-system/health.controller.ts

@Get('health')
async getHealth() {
  const db = await this.prisma.$queryRaw`SELECT 1`;
  const uptime = process.uptime();
  
  return {
    status: 'ok',
    timestamp: Date.now(),
    uptime,
    db: 'connected',
  };
}
```

---

## 8. Frontend React

### 8.1 Estructura de Rutas (React Router v7)

```typescript
// apps/pos-react/src/routes/routes.tsx

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: lazy(() => import('../pages/DashboardPage')),
      },
      {
        path: 'pos',
        element: lazy(() => import('../pages/POSPage')),
      },
      {
        path: 'products',
        element: lazy(() => import('../pages/ProductsPage')),
        children: [
          { path: ':id/edit', element: lazy(() => import('../components/products/ProductForm')) },
        ]
      },
      {
        path: 'inventory',
        element: lazy(() => import('../pages/InventoryPage')),
      },
      {
        path: 'contacts',
        element: lazy(() => import('../pages/ContactsPage')),
      },
      {
        path: 'cash-register',
        element: lazy(() => import('../pages/CashRegisterPage')),
      },
      {
        path: 'reports',
        element: lazy(() => import('../pages/ReportsPage')),
      },
      {
        path: 'settings',
        element: lazy(() => import('../pages/SettingsPage')),
      },
    ]
  },
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    path: 'setup',
    element: <FirstRunWizard />,
  },
];
```

### 8.2 Estado Global (Zustand)

```typescript
// apps/pos-react/src/store/sales.store.ts

interface CartItem {
  productId: string;
  quantity: number;
  pricePerUnit: number; // En centavos
  discount?: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  applyDiscount: (discount: number) => void;
  clear: () => void;
  checkout: (paymentMethod: string) => Promise<Sale>;
}

export const useSalesStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: state.total + (item.quantity * item.pricePerUnit),
  })),
  
  removeItem: (productId) => set((state) => {
    const item = state.items.find(i => i.productId === productId);
    return {
      items: state.items.filter(i => i.productId !== productId),
      total: state.total - (item!.quantity * item!.pricePerUnit),
    };
  }),
  
  checkout: async (paymentMethod) => {
    const { items, total } = get();
    
    const response = await fetch('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        items,
        total,
        paymentMethod,
      })
    });
    
    const sale = await response.json();
    set({ items: [], total: 0 }); // Clear after checkout
    return sale;
  }
}));
```

### 8.3 Hooks Personalizados

```typescript
// apps/pos-react/src/hooks/useApi.ts

export function useApi<T>(
  url: string,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { token } = useAuth();
  const { isOnline } = useOfflineSync();
  
  const fetch = useCallback(async () => {
    if (!isOnline && !data) {
      // Offline sin caché = error
      setError(new Error('Offline y sin datos en caché'));
      return;
    }
    
    setLoading(true);
    try {
      const response = await window.fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...options?.headers,
        }
      });
      
      if (!response.ok) throw new Error(response.statusText);
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, token, isOnline, data]);
  
  useEffect(() => {
    fetch();
  }, [fetch]);
  
  return { data, loading, error, refetch: fetch };
}
```

### 8.4 Componente POS Principal

```typescript
// apps/pos-react/src/components/pos/POSPage.tsx

export function POSPage() {
  const { items, addItem, removeItem, clear, checkout } = useSalesStore();
  const { data: products } = useApi<Product[]>('/api/products');
  const { isOnline } = useOfflineSync();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  
  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];
  
  const total = items.reduce((sum, item) =>
    sum + (item.quantity * item.pricePerUnit), 0);
  
  const handleCheckout = async (paymentMethod: string) => {
    try {
      const sale = await checkout(paymentMethod);
      toast.success(`Venta #${sale.id} completada`);
      clear();
      setShowPayment(false);
    } catch (err) {
      if (!isOnline) {
        // Guardar offline
        offlineQueue.enqueue({
          type: 'sale',
          payload: { items, paymentMethod },
        });
        toast.info('Venta guardada offline. Se sincronizará cuando reconecte.');
      } else {
        toast.error('Error al procesar venta');
      }
    }
  };
  
  return (
    <div className="flex h-full gap-4">
      {/* Left: Search + Products Grid */}
      <div className="flex-1 flex flex-col">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
        
        <div className="grid grid-cols-4 gap-2 overflow-auto flex-1">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => addItem({
                productId: product.id,
                quantity: 1,
                pricePerUnit: product.price_cents,
              })}
            />
          ))}
        </div>
      </div>
      
      {/* Right: Cart Summary */}
      <div className="w-80 flex flex-col border-l">
        <div className="flex-1 overflow-auto">
          {items.length === 0 ? (
            <p className="text-center text-gray-400">Carrito vacío</p>
          ) : (
            <ul className="space-y-2 p-4">
              {items.map(item => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onRemove={() => removeItem(item.productId)}
                />
              ))}
            </ul>
          )}
        </div>
        
        <div className="border-t p-4 space-y-2">
          <div className="text-2xl font-bold">
            ${(total / 100).toFixed(2)}
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={items.length === 0}
            className="btn btn-primary w-full"
          >
            Cobrar
          </button>
          {!isOnline && <p className="text-sm text-yellow-600">Modo offline</p>}
        </div>
      </div>
      
      {showPayment && (
        <PaymentDialog
          total={total}
          onPayment={handleCheckout}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
```

---

## 9. Tauri Runtime

### 9.1 Configuración Tauri (tauri.conf.json)

```json
{
  "build": {
    "beforeBuildCommand": "pnpm -F pos-react build",
    "beforeDevCommand": "pnpm -F pos-react dev",
    "devPath": "http://localhost:5173",
    "frontendDist": "../pos-react/dist",
    "frontendPort": 5173
  },
  "app": {
    "windows": [
      {
        "title": "Arcon",
        "width": 1400,
        "height": 900,
        "minWidth": 800,
        "minHeight": 600,
        "decorations": true,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self' http://localhost:3000 http://127.0.0.1:3000"
    }
  },
  "updater": {
    "active": true,
    "endpoints": [
      "https://updates.arcon.app/releases/{{target}}/{{version}}"
    ],
    "dialog": true,
    "pubkey": "..." // Ed25519 public key
  }
}
```

### 9.2 Manejo de Procesos (Rust + Tauri)

```rust
// src-tauri/src/commands/process_manager.rs

use std::process::{Child, Command};
use tokio::sync::Mutex;

pub struct ProcessManager {
    api_process: Mutex<Option<Child>>,
}

impl ProcessManager {
    pub async fn start_api(&self) -> Result<u16, String> {
        let mut child = Command::new("node")
            .args(&[
                "dist/apps/api/main.js",
            ])
            .env("NODE_ENV", "production")
            .env("DATABASE_URL", format!(
                "file:{}",
                self.get_db_path()
            ))
            .env("PORT", "3000")
            .env("LOCAL_MODE", "true")
            .env("LOCAL_COMPANY_ID", self.get_company_id())
            .spawn()
            .map_err(|e| format!("Failed to start API: {}", e))?;
        
        // Wait for API to be ready (health check)
        for _ in 0..30 {
            if let Ok(_) = reqwest::Client::new()
                .get("http://localhost:3000/api/health")
                .send()
                .await
            {
                *self.api_process.lock().await = Some(child);
                return Ok(3000);
            }
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
        
        Err("API failed to start".to_string())
    }
    
    pub async fn stop_api(&self) -> Result<(), String> {
        if let Some(mut process) = self.api_process.lock().await.take() {
            process.kill().map_err(|e| format!("Failed to kill: {}", e))?;
        }
        Ok(())
    }
    
    fn get_db_path(&self) -> String {
        format!("{}/.arcon/data/app.db", dirs::home_dir().unwrap().display())
    }
}
```

### 9.3 Comandos Tauri (Rust → JavaScript)

```rust
// src-tauri/src/main.rs

#[tauri::command]
async fn download_company_data(
    email: String,
    password: String,
    handle: tauri::AppHandle,
) -> Result<String, String> {
    let manager = ProcessManager::global();
    
    // Emitir evento: empezar migración
    handle.emit_all("migration-started", ()).unwrap();
    
    for i in 0..100 {
        // Simular descarga
        handle.emit_all("migration-progress", json!({
            "step": i,
            "total": 100,
            "message": format!("Descargando tabla {}/100", i),
        })).unwrap();
        
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    
    Ok("Migration complete".to_string())
}

#[tauri::command]
async fn get_api_status() -> Result<ApiStatus, String> {
    let response = reqwest::get("http://localhost:3000/api/health")
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(response.json().await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn export_database() -> Result<String, String> {
    let db_path = format!("{}/.arcon/data/app.db", 
        dirs::home_dir().unwrap().display());
    
    let output = Command::new("sqlite3")
        .args(&[&db_path, ".dump"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let sql = String::from_utf8(output.stdout)
        .map_err(|e| e.to_string())?;
    
    // Transformar SQLite SQL → PostgreSQL
    let postgres_sql = transform_to_postgres(&sql);
    
    let export_path = format!("{}/.arcon/backup/export.sql", 
        dirs::home_dir().unwrap().display());
    
    std::fs::write(&export_path, postgres_sql)
        .map_err(|e| e.to_string())?;
    
    Ok(export_path)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            download_company_data,
            get_api_status,
            export_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 10. Sincronización Multi-Dispositivo y Cloud Opcional

> **Implementación vigente (Fase 5):** la especificación funcional del sistema de sync implementado (SyncQueue, CloudRelayService, WebSocket, endpoints, config por empresa, LWW) está en [`docs/context/SYNC.md`](./SYNC.md). Las subsecciones siguientes describen el diseño objetivo original.

### 10.1 Arquitectura de Sync

**Premisa:** Usuario tiene Arcon en laptop (POS) y tablet (inventario). Quiere que se sincronicen.

**Solución sin cloud:**
- Ambos equipos comparten carpeta network (~/.arcon/shared/)
- Cambios se replican automáticamente
- Conflict resolution: last-write-wins

**Solución con cloud:**
- Ambos equipos se conectan a Xata (PostgreSQL serverless)
- Cloud Relay orquesta cambios
- Sincronización bi-direccional en tiempo real

```
ESCENARIO 1: Local-Only (Sin Cloud)
────────────────────────────────────

Laptop (SQLite)                   Tablet (SQLite)
    │                                 │
    │ (cambio: venta)               │ (cambio: inventario)
    │                                 │
    └─────► \\NETWORK\shared\arcon/ ◄─┘
            ├── products.json
            ├── sales.json
            ├── inventory.json
            └── sync_log.json
            
    Ambas máquinas descarguen y mergeen cambios cada 30s


ESCENARIO 2: With Cloud (Xata PostgreSQL serverless)
──────────────────────────────────────────

Laptop (SQLite)      Cloud Relay       Tablet (SQLite)
    │                    │                  │
    │─── Sync Push ─────►│                  │
    │                    │◄── Sync Pull ───│
    │                    │                  │
    │ (offline) ◄─ queue │ (reconect) ─►│
    
    Cloud Relay (NestJS endpoint):
    1. Recibe cambios de Laptop
    2. Transforma SQLite types → PostgreSQL
    3. Guarda en PostgreSQL
    4. Notifica a Tablet vía WebSocket
    5. Tablet descarga cambios
```

### 10.2 Implementación: SyncQueue Adaptado

```typescript
// libs/api/core/feature-sync/cloud-relay.service.ts

export class CloudRelayService {
  // Configurado POR USUARIO en settings
  cloudUrl?: string;
  cloudJwt?: string;
  
  async pushChanges(changes: SyncItem[]): Promise<void> {
    if (!this.cloudUrl || !this.cloudJwt) {
      // Cloud no habilitado
      return;
    }
    
    try {
      await fetch(`${this.cloudUrl}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cloudJwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          changes,
          timestamp: Date.now(),
        })
      });
    } catch (error) {
      logger.error('Cloud push failed', error);
      // Continuar localmente sin problema
    }
  }
  
  async pullChanges(): Promise<SyncItem[]> {
    if (!this.cloudUrl || !this.cloudJwt) {
      return [];
    }
    
    try {
      const response = await fetch(`${this.cloudUrl}/api/sync/pull`, {
        headers: {
          'Authorization': `Bearer ${this.cloudJwt}`,
        }
      });
      
      const { changes } = await response.json();
      return changes;
    } catch (error) {
      logger.error('Cloud pull failed', error);
      return [];
    }
  }
  
  // Resolver conflictos (last-write-wins)
  resolveConflict(local: SyncItem, remote: SyncItem): SyncItem {
    return local.updated_at > remote.updated_at ? local : remote;
  }
}
```

### 10.3 WebSocket para Notificaciones en Tiempo Real

```typescript
// Optional: si cloud está habilitado, escuchar cambios
// (push en lugar de pull)

import io from 'socket.io-client';

export class CloudSyncWebsocket {
  private socket?: Socket;
  
  connect(cloudUrl: string, jwt: string): void {
    this.socket = io(cloudUrl, {
      auth: { token: jwt },
      transports: ['websocket'],
    });
    
    this.socket.on('sync:changes', (changes: SyncItem[]) => {
      // Cambios del servidor → aplicar localmente
      this.applyRemoteChanges(changes);
    });
  }
  
  private applyRemoteChanges(changes: SyncItem[]): void {
    changes.forEach(change => {
      // Aplicar a SQLite
      this.prisma.handleSyncChange(change);
    });
  }
}
```

---

## 11. Estrategia de Testing

### 11.1 Unit Tests (Vitest + React Testing Library)

```typescript
// apps/pos-react/src/__tests__/components/pos/Cart.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { useSalesStore } from '../../../store/sales.store';
import { Cart } from '../../../components/pos/Cart';

describe('Cart Component', () => {
  it('should add item to cart', () => {
    render(<Cart />);
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    fireEvent.click(addButton);
    
    expect(screen.getByText(/1 artículo/i)).toBeInTheDocument();
  });
  
  it('should calculate total correctly', () => {
    const store = useSalesStore.getState();
    store.addItem({ productId: '1', quantity: 2, pricePerUnit: 1000 });
    
    expect(store.total).toBe(2000);
  });
});
```

### 11.2 Integration Tests (NestJS + SQLite)

```typescript
// libs/api/sales/src/__tests__/sales.service.spec.ts

describe('SalesService (SQLite)', () => {
  let service: SalesService;
  let db: PrismaService;
  
  beforeAll(async () => {
    // Usar SQLite test database
    process.env.DATABASE_URL = 'file::memory:';
    
    const module = await Test.createTestingModule({
      providers: [SalesService, PrismaService],
    }).compile();
    
    service = module.get<SalesService>(SalesService);
    db = module.get<PrismaService>(PrismaService);
    
    // Migrar schema
    await exec('npx prisma migrate deploy');
  });
  
  it('should create sale with items', async () => {
    const sale = await service.createSale(
      'company-1',
      'store-1',
      {
        items: [
          { productId: 'prod-1', quantity: 2, pricePerUnit: 1000 },
        ],
        paymentMethod: 'cash',
      }
    );
    
    expect(sale.total_cents).toBe(2000);
    expect(sale.items).toHaveLength(1);
  });
});
```

### 11.3 E2E Tests (Playwright)

```typescript
// apps/pos-e2e/src/pos.spec.ts

test.describe('POS Workflow', () => {
  test('complete sale from start to receipt', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:5173');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('button:has-text("Iniciar sesión")');
    
    // 2. Wait for POS to load
    await page.waitForURL('**/pos');
    
    // 3. Search product
    await page.fill('[data-testid=search]', 'Producto 1');
    await page.waitForSelector('[data-testid=product-card]');
    
    // 4. Add to cart
    await page.click('[data-testid=product-card] >> first');
    expect(await page.locator('[data-testid=cart-count]')).toContainText('1');
    
    // 5. Checkout
    await page.click('button:has-text("Cobrar")');
    await page.selectOption('[data-testid=payment-method]', 'cash');
    await page.click('button:has-text("Confirmar")');
    
    // 6. Verify receipt
    await expect(page.locator('[data-testid=receipt-number]')).toBeVisible();
  });
  
  test('should work offline', async ({ page }) => {
    // Simular offline
    await page.context().setOffline(true);
    
    // Operaciones deben funcionar igual (desde caché)
    await page.goto('http://localhost:5173/pos');
    expect(await page.locator('[data-testid=offline-indicator]')).toBeVisible();
    
    // Agregar producto (debe funcionar)
    await page.click('[data-testid=product-card] >> first');
    expect(await page.locator('[data-testid=cart-count]')).toContainText('1');
  });
});
```

---

## 12. Despliegue y Distribución

### 12.1 Pipeline de Build (GitHub Actions)

**Implementación real:** `.github/workflows/release.yml` (CI en `.github/workflows/ci.yml`).

```yaml
name: Release & Sign

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: macos-latest
            args: --target aarch64-apple-darwin
          - platform: macos-latest
            args: --target x86_64-apple-darwin
          - platform: ubuntu-22.04
            args: ''
          - platform: windows-latest
            args: ''

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Build Tauri App
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: ${{ github.ref_name }}
          releaseBody: 'See: CHANGELOG.md'
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

> **Gotchas aprendidos en v0.1.0:**
> - El signing key se pasa vía `TAURI_SIGNING_PRIVATE_KEY` (con su `_PASSWORD`). El pubkey debe coincidir
>   exactamente con `tauri.conf.json → updater.pubkey`, o el updater rechaza las actualizaciones.
> - El body de la release sale de `release.yml` (`releaseBody`), no del CHANGELOG automáticamente.
> - **`bun.lock` rompe la detección de package manager en Nx** (CI detecta `bun` en vez de `pnpm` y falla
>   con `Cannot determine the version of bun`). Se eliminó; `package.json` fija `"packageManager": "pnpm@11.11.0"`.
> - WiX (Windows MSI) **no acepta `es-AR`** como locale; usar `es-ES` (bug corregido en v0.1.0).
> - El pubkey se fija en `tauri.conf.json → updater.pubkey` (ver §12.3); los secrets en GitHub Actions
>   son `TAURI_SIGNING_PRIVATE_KEY` + `_PASSWORD`.

**CI (`.github/workflows/ci.yml`):** ESLint + typecheck vía Nx (`nx run-many`), corriendo en cada push/PR.

### 12.2 Instaladores

| Plataforma | Formato | Tamaño | Descarga |
|---|---|---|---|
| **Windows** | MSI (NSIS) | ~80MB | arcon-setup-1.0.0.msi |
| **macOS** | DMG + App | ~90MB | arcon-1.0.0.dmg |
| **Linux** | AppImage / DEB | ~75MB | arcon-1.0.0.AppImage |

**El instalador hace:**
1. Detectar instalación anterior
2. Ofrecer migración de datos
3. Descargar binarios (Node.js, NestJS, Prisma)
4. Crear carpeta ~/.arcon/
5. Inicializar SQLite
6. Crear shortcut en menú Inicio / Applications

### 12.3 Auto-updater (Tauri Built-in)

El sistema de actualizaciones de Arcon usa el updater built-in de Tauri. **Canal activo: GitHub Releases**
(implementado y en producción desde v0.1.0). El backend personalizado (`releases.arcon.app`) es la Opción B
para Fase 2 — cuando se necesite rollout gradual, monitoring y A/B testing.

**Configuración real (tauri.conf.json, v0.1.0):**

```json
{
  "updater": {
    "active": true,
    "dialog": true,
    "endpoints": [
      "https://api.github.com/repos/SebaAguiar/arpos-v2/releases/latest"
    ],
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDY0OTFEQzFGNTRCQ0IzQjEKUldTeHM3eFVIOXlSWkhkMGNEWXA3R3NEcmF5RHNRUVhwQktjNlBJUUVKaDIvY3dYSjUwa1dZd3MK"
  }
}
```

> El updater consulta la API de GitHub `releases/latest` y descarga el asset firmado del target correcto.

**Flujo de actualización:**
1. Background thread checkea periódicamente (intervalo configurable)
2. Si hay nueva versión: notificación discreta al usuario
3. Descarga el bundle firmado para el target (Windows `.msi`/`.nsis`, macOS `.dmg`/`.app`, Linux `.deb`/`.AppImage`)
4. Verifica firma Ed25519 contra la pubkey embebida
5. Aplica + reinicia

**Rollback (vía GitHub Releases):** No existe un flag `broken` central; el rollback es **forward-fix**.
Ver `docs/context/UPDATES.md` §8 para el procedimiento completo (`gh release delete --cleanup-tag`,
re-publicar corrección con semver superior).

> **Especificación completa:** Ver `docs/context/UPDATES.md` para estrategia detallada de distribución, differential updates, rollback, monitoreo, CI/CD pipeline y troubleshooting.

---

## 13. Documentación de Operaciones

### 13.1 Manual del Usuario

1. **Instalación y Primer Inicio**
   - Descargar instalador
   - Migrar datos desde cloud (opcional)
   - Crear usuario admin
   - Primeras transacciones

2. **Modo Offline**
   - Funcionalidad 100% sin internet
   - SyncQueue automático
   - Indicador visual "Modo offline"

3. **Sincronización con Cloud**
   - Habilitar/deshabilitar cloud
   - Credenciales cloud
   - Resolución de conflictos

4. **Backup y Restore**
   - Backup automático diario (~/.arcon/backup/)
   - Restaurar desde backup
   - Exportar a SQL

5. **Soporte y Troubleshooting**
   - Logs en ~/.arcon/logs/
   - Health check (/api/health)
   - Contacto con soporte

### 13.2 Manual de Administrador

1. **Arquitectura del Sistema**
   - Tauri + React + NestJS + SQLite
   - Flujo de datos
   - Sincronización

2. **Instalación para Múltiples Equipos**
   - Compartir data via red (SMB/NFS)
   - Sincronizar via cloud
   - Configurar cada equipo

3. **Migración desde Electron**
   - Pasos automáticos
   - Troubleshooting
   - Rollback si es necesario

4. **Monitoreo y Mantenimiento**
   - Logs y alertas
   - Performance tunning
   - Backups

---

## Resumen de Cambios Críticos

### ✓ Lo que NO cambia para el usuario

- Funcionalidad POS 100% igual
- Mismas credenciales de login
- Mismos datos y reportes
- Misma velocidad (mejorada)

### ✗ Lo que SÍ cambia (pero es para mejor)

- **Stack tecnológico:** Angular → React, Electron → Tauri, PostgreSQL → SQLite
- **UX:** Más rápido, sin lag, sin Docker
- **Costo:** $0 en infraestructura (opcional cloud)
- **Instalación:** Un click, ~100MB, sin dependencias

### ⚠️ Consideraciones Importantes

1. **No hay cambio de arquitectura multi-tenant a nivel de DB.** Cada instalación local es una empresa única, pero el código mantiene el structure `companyId` para ser reversible a cloud.

2. **Sincronización es eventual.** Si user trabaja offline 8 horas y luego conecta, tarda 2-5 minutos sincronizar. Pero la data nunca se pierde.

3. **SQLite no es para millones de registros.** Para un POS típico (<1M transacciones/año), SQLite es más que suficiente.

4. **Require Node.js 20+** en el sistema. Tauri bundlea el runtime, pero el usuario necesita Node.js preinstalado para algunos scripts.

---

## Cronograma Estimado (Basado en TAURI-MIGRATION-PLAN.md)

| Fase | Tareas | Duración | Milestone |
|---|---|---|---|
| **Fase 0** | Prisma adapter, test schema | 1-2 sem | Schema SQLite validado |
| **Fase 1** | Backend adaptado, sync queue | 2-3 sem | NestJS funciona con SQLite |
| **Fase 2** | Tauri setup, process manager | 2-3 sem | Launcher compilable |
| **Fase 3** | React POS (6 módulos críticos) | 6-8 sem | POS funcional en React |
| **Fase 4** | Integración + empaquetado | 2-3 sem | Instaladores para 3 SO |
| **Fase 5** | Cloud sync (opcional) | 2-3 sem | Multi-dispositivo |
| **Fase 6** | Beta + launch | 2-4 sem | Usuarios de prueba → público |
| **TOTAL** | | **15-24 semanas** | **v1.0 público** |

---

## Documento Vivo

Este documento es un **blueprint detallado pero flexible**. Habrá decisiones en el camino que requieran ajustes. 

**Actualizaciones necesarias cuando:**
- Completes una fase (agregar learnings)
- Encuentres limitaciones técnicas (documentarlas)
- El scope cambie (justificar)

**Próximos pasos:**
1. Validar schema SQLite + Prisma migrations
2. Crear repo bare-bones Tauri
3. Adaptar NestJS para SQLite
4. Setup React scaffolding
5. Definir checklist de feature parity vs Angular

---

> **Documento creado:** 2026-07-16  
> **Versión:** 1.0  
> **Estado:** Ready for implementation