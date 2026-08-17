# Convenciones de Código — Arcom Tauri v2

Este documento define los estándares de código, patrones arquitectónicos, directrices de testing y protocolo de commits para el proyecto Arcom.

---

## 1. Estilo de Código y Convenciones de Nombres

### TypeScript (todas las capas)

- **Archivos:** `kebab-case` para utilidades (`currency.ts`, `offline-queue.ts`), `PascalCase` para componentes React (`POSPage.tsx`, `Cart.tsx`).
- **Clases:** `PascalCase` (`SalesService`, `PrismaService`, `OfflineSyncService`).
- **Funciones y métodos:** `camelCase` (`createSale`, `findById`, `processQueue`).
- **Constantes:** `UPPER_SNAKE_CASE` (`LOCAL_COMPANY_ID`, `DATABASE_URL`, `MAX_RETRY_ATTEMPTS`).
- **Interfaces y tipos:** `PascalCase` con nombres descriptivos (`CartItem`, `SyncQueueItem`, `MigrationResult`).
- **Symbol tokens:** `Symbol('TOKEN_NAME')` para DI tokens en NestJS.
- **Decoradores:** `PascalCase` con `@` prefix (`@Injectable`, `@Controller`, `@Get`, `@Post`).

### React (apps/pos-react)

- **Componentes:** `PascalCase` (`POSPage.tsx`, `ProductCard.tsx`, `PaymentDialog.tsx`).
- **Hooks:** `camelCase` con prefix `use` (`useAuth.ts`, `useOfflineSync.ts`, `useApi.ts`).
- **Stores Zustand:** `camelCase` con suffix `store` (`auth.store.ts`, `sales.store.ts`, `ui.store.ts`).
- **Props interfaces:** `PascalCase` con suffix `Props` (`CartProps`, `ProductCardProps`).

### Rust (apps/arcom-launcher/src-tauri)

- **Archivos:** `snake_case` (`process_manager.rs`, `database_manager.rs`).
- **Funciones:** `snake_case` (`start_api`, `get_db_path`).
- **Structs:** `PascalCase` (`ProcessManager`, `ApiStatus`, `MigrationResult`).
- **Constants:** `SCREAMING_SNAKE_CASE` (`DB_PATH`, `API_PORT`).

### Prisma (prisma/)

- **Modelos:** `PascalCase` (`Company`, `Product`, `Sale`).
- **Camels:** `snake_case` (`created_at`, `price_cents`, `company_id`).
- **Relaciones:** PascalCase en el schema (`company Store @relation(...)`).

### Estrictitud de Tipos

- **`any` está terminantemente prohibido.** Todas las APIs, contratos, providers y tipos de retorno deben ser explícitos.
- **`unknown` está prohibido** en APIs públicas — usar uniones o genéricos.
- **Sin `any` implícito.** Habilitar `strict: true` y `noImplicitAny: true` en tsconfig.

### Organización de Imports

Agrupar imports en este orden, separados por línea en blanco:
1. Built-ins de Node.js / Bun
2. Paquetes de terceros (react, zod, prisma, @tauri-apps)
3. Paquetes internos (`@arcom/*`)
4. Imports relativos (../, ./)

---

## 2. Patrones Arquitectónicos

### [DO] Patrones Permitidos y Recomendados

- **NestJS modular:** Cada feature vive en un módulo. Los módulos definen `imports`, `controllers`, `providers`, `exports`.
- **Prisma para acceso a DB:** Todas las queries pasan por Prisma. Raw SQL solo en migraciones.
- **Zustand para state management:** Un store por dominio (auth, sales, products, ui, offline).
- **Thin controllers:** Controllers manejan solo HTTP (parsear input, llamar service, retornar response).
- **Error typing:** Usar clases de error custom. Nunca retornar strings crudos como errores.
- **Contract-first:** Definir schemas Zod primero, después la implementación.
- **Offline-first:** Toda operación debe funcionar offline. Sync es secundario.

### [DONT] Patrones Prohibidos

- **Raw SQL en business logic:** DDL o DML fuera de migraciones está prohibido. Usar Prisma query builder.
- **`any` en contratos o services:** Cada request/response debe ser un schema Zod tipado.
- **Configuración hardcodeada:** Variables de entorno van por `ConfigModule.forRoot()`, nunca `process.env` directamente en services.
- **`console.log` en producción:** Usar el logger inyectado por DI.
- **Estado global mutable:** Zustand stores son inmutables. No mutar state directamente.
- **Llamadas a DB en loops:** Usar batch queries o joins, no N+1 queries.

---

## 3. Guías de Testing

**Para estrategia completa de testing, consultar `/docs/context/TESTING.md`.**

### TypeScript/Bun Tests (Backend)
- Escribir tests junto al source con sufijo `.spec.ts` o `.test.ts`.
- Usar **Vitest** para React y **Jest** para NestJS.
- Testear contracts: inputs → expected outputs → error states.

### React Tests (Frontend)
- Usar **Vitest + React Testing Library**.
- Tests de componentes en `__tests__/` directories.
- Testear interacciones (clicks, forms, navigation).

### Coverage Targets
- `libs/api/*/src/` — 80% mínimo para business logic.
- `apps/pos-react/src/` — 70% para componentes críticos (POS, Cart, Payment).
- `apps/arcom-launcher/src-tauri/` — 60% para comandos Rust.

### Running Tests
```bash
# Backend (NestJS)
pnpm test

# Frontend (React)
pnpm test --filter pos-react

# Con coverage
pnpm test --coverage

# Watch mode
pnpm test --watch

# E2E (Playwright)
pnpm test:e2e --filter pos-e2e
```

---

## 4. Protocolo de Commits

Todos los commits deben seguir **Conventional Commits**. Los mensajes deben escribirse en **inglés**.

### Formato
```
<type>(<scope>): <short description in present tense>

[Optional body describing the reasoning behind the change]
```

### Tipos Válidos
| Tipo | Cuándo usar |
|------|-------------|
| `feat` | Nueva funcionalidad visible para el usuario |
| `fix` | Corrección de bug |
| `perf` | Mejora de rendimiento sin cambio de comportamiento |
| `refactor` | Cambio interno sin cambio de comportamiento ni bug fix |
| `test` | Agregar o modificar tests |
| `docs` | Solo cambios en documentación |
| `chore` | Mantenimiento (dependencias, build tooling, config) |

### Scopes Válidos
| Scope | Qué cubre |
|-------|-----------|
| `api` | NestJS backend, controllers, services, Prisma |
| `pos-react` | React frontend, components, stores, hooks |
| `arcom-launcher` | Tauri Rust, process manager, commands |
| `prisma` | Schema, migrations, seed data |
| `common` | Utilidades compartidas, tipos globales |
| `deps` | Actualización de dependencias |

### Ejemplos
```
feat(api): add offline sync queue for sales

Sales created while offline are now queued in the sync_queue table
and automatically synced when the connection is restored.

Closes #42
```

```
fix(pos-react): handle empty cart checkout gracefully

Previously clicking "Cobrar" with an empty cart caused an unhandled
error. Now it shows a validation message instead.
```

```
refactor(prisma): convert price fields from DECIMAL to INTEGER cents

All price_cents fields are now stored as INTEGER (cents) instead of
DECIMAL(10,2). This fixes floating point issues with currency.
```
