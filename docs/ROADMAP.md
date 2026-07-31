# Roadmap de Features y Migración — ArPOS Tauri v2

Este documento recopila las fases de migración, features propuestas y roadmap de ArPOS v2.

---

## Roadmap General

### Fase 0: Fundación (1-2 semanas)

**Milestone:** Schema SQLite validado, Prisma adapter funcional.

- [ ] ~~Adaptar `schema.prisma` a provider SQLite~~ **DEFERRED — no prioridad ahora**
- [ ] Implementar type conversions (DECIMAL→INT, JSONB→TEXT, TIMESTAMP→INT)
- [ ] Crear migraciones SQLite
- [ ] Validar schema con datos reales
- [ ] Tests unitarios del transformer service
- [ ] Seed data para desarrollo

**Bloqueadores:** Ninguno
**Dependencias:** Prisma 5.22+

---

### Fase 1: Backend Adaptado (2-3 semanas)

**Milestone:** NestJS funciona con SQLite, endpoints críticos operativos.

- [ ] Adaptar `PrismaService` a SQLite
- [ ] Implementar `LocalTenantMiddleware` (companyId único)
- [ ] Adaptar repositories para SQLite types
- [ ] Implementar `OfflineSyncService` (cola de sync local)
- [ ] Endpoint `GET /api/health` para Tauri
- [ ] Endpoint `POST /api/setup/init-company`
- [ ] Endpoint `GET /api/setup/status`
- [ ] Tests de integración con SQLite in-memory
- [ ] Migration de datos desde PostgreSQL cloud

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

> **Nota:** Los módulos de Fase 3 están implementados (pages + stores + services + repos). ProductSearch/ProductGrid viven dentro de `POSPage`; los reportes (sales/inventory/cash) dentro de `ReportsPage`. Frontend tests con Vitest: 30 tests (stores, api-client, SummaryPanel) en `apps/pos-react/src/__tests__/`. Pendiente real de hardening: ESLint no está configurado en el repo (script `lint` roto, CI usa `tsc --noEmit`).

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
**Dependencias:** Neon PostgreSQL, WebSocket server

---

### Fase 6: Beta + Launch (2-4 semanas)

**Milestone:** Usuarios de prueba → público.

- [ ] Recopilar feedback de beta testers
- [ ] Fix bugs críticos
- [ ] Optimizar performance
- [ ] Completar documentación
- [ ] Preparar marketing landing
- [ ] Launch público

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
