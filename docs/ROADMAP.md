# Roadmap de Features y Migración — Arcon Tauri v2

Este documento recopila las fases de migración, features propuestas y roadmap de Arcon v2.

---

## Roadmap General

### Fase 0: Fundación (1-2 semanas)

**Milestone:** Schema SQLite validado, Prisma adapter funcional. **COMPLETADA** (2026-08-08)

- [x] Adaptar `schema.prisma` a provider SQLite (`apps/api/prisma/schema.prisma`, `provider = "sqlite"`)
- [x] Implementar type conversions (DECIMAL→INT, JSONB→TEXT, TIMESTAMP→INT) — `apps/api/src/common/transformers/` (`cents`, `json`, `timestamp`)
- [x] Crear migraciones SQLite — 9 migraciones (22-jul → 03-ago)
- [x] Validar schema con datos reales — `migrate deploy` + seed sobre DB limpia en `/tmp`: 396 sales, 880 sale_items, 893 inventory_movements, FKs íntegros
- [x] Tests unitarios del transformer service — 30 tests pasando (3 suites)
- [x] Seed data para desarrollo — `seed.ts` enriquecido (386→396 sales, 30 días, picos horarios)

> **Nota (2026-08-08):** La Fase 0 se completó de facto mientras se resolvían las Fases 1-4 (el schema SQLite era prerequisito de todo). Validación de cierre: DB limpia en `/tmp`, 9 migraciones aplicadas sin error, seed sin errores, conteos coherentes, y `apps/api/.env` restaurado tras la validación (el seed escribe `LOCAL_COMPANY_ID`/`LOCAL_STORE_ID`).

**Bloqueadores:** Ninguno
**Dependencias:** Prisma 5.22+

---

### Fase 1: Backend Adaptado (2-3 semanas)

**Milestone:** NestJS funciona con SQLite, endpoints críticos operativos. **COMPLETADA** (2026-07-31)

- [x] Adaptar `PrismaService` a SQLite
- [x] Implementar `LocalTenantMiddleware` (companyId único)
- [x] Adaptar repositories para SQLite types
- [x] Implementar `OfflineSyncService` (cola de sync local)
- [x] Endpoint `GET /api/health` para Tauri
- [x] Endpoint `POST /api/setup/init-company`
- [x] Endpoint `GET /api/setup/status`
- [x] Tests de integración con SQLite in-memory
- [x] Migration de datos desde PostgreSQL cloud

> **Nota (2026-07-31):** Migración one-off del cliente "Libreria Magna" completada de Arcon v1 (Xata) → v2 (SQLite local + cloud relay). Detalles y conteos en `ARCHITECTURE.md` §5.5. **Backend del Migration Wizard listo:** `POST /api/migration/import` (`MigrationService`, `@Public()`, 409 si ya hay company) — ladrillo reutilizable para el wizard. **Resta el wizard UI** (CLI-INTERACTIVE §3) que consumirá este endpoint; se construye cuando exista demanda de usuarios v1.

**Bloqueadores:** Fase 0 completada
**Dependencias:** NestJS 11, Prisma 5.22, SQLite 3.46

---

### Fase 2: Tauri Setup (2-3 semanas)

**Milestone:** Launcher compilable, NestJS como sidecar funcional. **COMPLETADA** (2026-07-30)

- [x] Setup proyecto Tauri 2.x
- [x] Implementar `ProcessManager` (spawn/kill NestJS)
- [x] Implementar `DatabaseManager` (init DB, run migrations)
- [x] Implementar `SystemManager` (CPU, RAM, disk)
- [x] Implementar `UpdaterManager` (check for updates)
- [x] Implementar `BackupManager` (backup/restore)
- [x] Implementar `ExportData` (SQLite → SQL export)
- [x] Configurar `tauri.conf.json` (windows, security, updater)
- [x] Auto-updater con GitHub Releases (config + plugin listos; release/CI pendiente en Fase 4)

> **Nota:** Corregidos mismatches de rutas — el launcher referenciaba `apps/pos-api`/`--filter pos-api`, pero la app real es `apps/api`/`--filter api`. Verificado: `cargo check` ✓, `tauri build --no-bundle` ✓ (binario release), `beforeBuildCommand` ✓ (build api + pos-react), `beforeDevCommand` (dev.sh) ✓ (API en :3000 + Vite en :1420).

**Bloqueadores:** Fase 1 completada
**Dependencias:** Tauri 2.x, Rust toolchain, Node.js 20+

---

### Fase 3: React POS (6-8 semanas)

**Milestone:** POS funcional en React con feature parity vs Angular. **COMPLETADA** (2026-07-31)

**Módulos críticos (en orden):**

#### 3.1 Auth + Layout (1 semana)
- [x] LoginPage
- [x] FirstRunWizard
- [x] MainLayout, Sidebar, Header
- [x] Zustand auth store
- [x] useAuth hook

#### 3.2 POS / Carrito (2 semanas)
- [x] POSPage (main cashier)
- [x] ProductSearch
- [x] ProductGrid
- [x] Cart
- [x] PaymentDialog
- [x] ReceiptPrinter
- [x] OfflineIndicator
- [x] Zustand sales store

#### 3.3 Productos (1 semana)
- [x] ProductsPage
- [x] ProductForm
- [x] ProductVariants
- [x] PricingManager
- [x] Zustand products store

#### 3.4 Inventario (1 semana)
- [x] InventoryPage
- [x] StockMovements
- [x] StockAdjustment

#### 3.5 Reportes (1 semana)
- [x] ReportsPage
- [x] SalesReport
- [x] InventoryReport
- [x] CashReport

#### 3.6 Caja (1 semana)
- [x] CashRegisterPage
- [x] OpenRegisterModal
- [x] CloseRegisterModal
- [x] CashMovements

#### 3.7 Configuración (1 semana)
- [x] SettingsPage
- [x] CompanyForm
- [x] StoreForm
- [x] UsersManager
- [x] CloudSyncSettings
- [x] BackupRestore

> **Nota:** Los módulos de Fase 3 están implementados (pages + stores + services + repos). ProductSearch/ProductGrid viven dentro de `POSPage`; los reportes (sales/inventory/cash) dentro de `ReportsPage`. Frontend tests con Vitest: 30 tests (stores, api-client, SummaryPanel) en `apps/pos-react/src/__tests__/`. Hardening de lint completado (2026-07-31): ESLint flat config (`eslint.config.mjs`) + `typescript-eslint` + react-hooks/react-refresh para los 3 apps; `pnpm lint` y `pnpm typecheck` verdes (api, pos-react, admin-panel); CI ejecuta ambos. Prisma clients con custom output por app (`admin-panel` → `src/generated/prisma`) para evitar pisarse en el store de pnpm.

**Bloqueadores:** Fase 1 completada
**Dependencias:** React 19, Shadcn/ui, Zustand 5, React Router 7

---

### Fase 4: Integración + Empaquetado (2-3 semanas)

**Milestone:** Instaladores para Windows, macOS, Linux.

- [x] Integrar React POS con NestJS API (services + api-client, CORS 1420/5173)
- [x] Integrar Tauri con React POS (bridge completo: 22 commands tipados, Service → Repository → Store)
- [x] Configurar build pipeline (Vite + Tauri)
- [x] Generar installers — deb ✓, rpm ✓, AppImage ✓ (validados localmente 2026-07-31); msi/nsis y dmg via CI matrix en `release.yml`
- [x] Testing cross-platform — matrix ubuntu/macos/windows en `release.yml` + job `build-launcher` en `ci.yml` (valida Rust en cada PR)
- [x] Performance tuning — `html2pdf.js` es lazy-import (975KB solo carga al imprimir); `chunkSizeWarningLimit: 1000`; bundle inicial ~284KB (< 300KB verificado en CI)
- [x] Documentación de usuario — `docs/user/GUIDE.md` (instalación, primer arranque, POS, productos, inventario, reportes, caja, settings, backup, troubleshooting)

> **Nota AppImage local:** requiere `patchelf` y FUSE real. En contenedores/CI sin FUSE, linuxdeploy falla con "failed to run linuxdeploy" — ejecutar con `--appimage-extract-and-run`. En GitHub Actions runners (ubuntu-latest) FUSE funciona, no requiere workaround.

> **Nota firmas:** los `.sig` (updater) se generan automáticamente en CI cuando `TAURI_SIGNING_PRIVATE_KEY` está seteado. Apple code-signing/notarización y Windows code-signing quedan como follow-up (requieren certificados).

> **Nota release v0.1.0 (2026-07-31):** primer release estable disparado con `git tag v0.1.0` → `release.yml` (matrix 3 SO + firmas). Los secrets `TAURI_SIGNING_PRIVATE_KEY` + `_PASSWORD` y la pubkey de `tauri.conf.json` ya estaban configurados desde el 29-jul. Bug de CI encontrado y corregido en el camino: `bun.lock` huérfano hacía que NX detectara bun (fallaba `pnpm lint`/`typecheck` en runners sin bun) → eliminado + `packageManager: pnpm@11.11.0` fijado. Detalles en `UPDATES.md` §10.

**Bloqueadores:** Fases 2 y 3 completadas
**Dependencias:** Tauri bundler, platform-specific toolchains

---

### Fase 5: Cloud Sync (2-3 semanas)

**Milestone:** Multi-dispositivo funcional.

- [x] Implementar CloudRelayService (push/pull)
- [x] Implementar conflict resolution (last-write-wins)
- [x] WebSocket para notificaciones en tiempo real
- [x] Configuración de sync en Settings
- [x] Testing de offline→online transitions
- [x] Documentación de sync

**Bloqueadores:** Fase 4 completada
**Dependencias:** Xata (PostgreSQL serverless), WebSocket server

---

### Fase 6: Beta + Launch (2-4 semanas)

**Milestone:** Usuarios de prueba → público.

- [ ] Recopilar feedback de beta testers
- [ ] Fix bugs críticos
- [ ] Optimizar performance
- [ ] Completar documentación
- [ ] Launch público

**Landing page de Arcon** (v1 existe en repo `arpos` con Astro — migrar a v2 + rebrandear a Arcon):

- [ ] Migrar `apps/marketing-landing` de v1 (Astro) al monorepo v2 y rebrandear a Arcon
- [ ] Botones de descarga por SO (deb/rpm/AppImage/dmg/msi/exe) apuntando a los assets de `SebaAguiar/arcon-releases`; resolver `releases/latest` en build-time
- [ ] Pasarela de pagos con **MercadoPago subscriptions** (requiere backend externo para checkout + webhooks; NO usar `apps/api` — es sidecar local offline-first)
- [ ] Apartado de **issues/reportes**: GitHub Issues del repo público `arcon-releases` con issue templates; enlaces desde la landing y la app

**Bloqueadores:** Fase 5 completada
**Dependencias:** Beta testers, infraestructura de updates

---

## Cronograma Estimado

| Fase | Duración | Milestone |
|---|---|---|
| **Fase 0** | 1-2 sem | Schema SQLite validado |
| **Fase 1** | 2-3 sem | NestJS funciona con SQLite |
| **Fase 2** | 2-3 sem | Launcher compilable |
| **Fase 3** | 6-8 sem | POS funcional en React |
| **Fase 4** | 2-3 sem | Instaladores para 3 SO |
| **Fase 5** | 2-3 sem | Multi-dispositivo |
| **Fase 6** | 2-4 sem | Beta → público |
| **TOTAL** | **15-24 sem** | **v1.0 público** |

---

## Features Futuras (Post v1.0)

### v1.1
- [ ] Multi-idioma (i18n)
- [ ] Temas personalizables
- [ ] Reportes PDF exportables
- [ ] Integración con impresoras térmicas
- [ ] Modo kiosco

### v1.2
- [ ] App móvil (React Native o Tauri mobile)
- [ ] WebSocket real-time para multi-device
- [ ] Analytics dashboard
- [ ] Integración con pasarelas de pago
- [ ] Modo offline extendido (PWA)

### v2.0
- [ ] Multi-tenant real (PostgreSQL opcional)
- [ ] Marketplace de plugins
- [ ] API pública para integraciones
- [ ] Client SDK generado desde OpenAPI

---

## Prioridades

| Feature | Prioridad | Dependencias |
|---|---|---|
| POS funcional | 🔴 CRÍTICA | Fase 3 |
| Migración de datos | 🔴 CRÍTICA | Fase 0-1 |
| Offline-first | 🟡 ALTA | Fase 1-3 |
| Cloud sync | 🟢 MEDIA | Fase 5 |
| Auto-updater | 🟢 MEDIA | Fase 2 |
| Multi-dispositivo | 🔵 BAJA | Fase 5 |
| App móvil | 🔵 BAJA | Post v1.0 |

---

## Documento Vivo

Este roadmap es un **plan flexible**. Habrá decisiones en el camino que requieran ajustes.

**Actualizaciones necesarias cuando:**
- Completés una fase (agregar learnings)
- Encuentres limitaciones técnicas (documentarlas)
- El scope cambie (justificar)
