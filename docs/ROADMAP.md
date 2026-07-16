# Roadmap de Features y Migración — ArPOS Tauri v2

Este documento recopila las fases de migración, features propuestas y roadmap de ArPOS v2.

---

## Roadmap General

### Fase 0: Fundación (1-2 semanas)

**Milestone:** Schema SQLite validado, Prisma adapter funcional.

- [ ] Adaptar `schema.prisma` a provider SQLite
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

**Milestone:** Launcher compilable, NestJS como sidecar funcional.

- [ ] Setup proyecto Tauri 2.x
- [ ] Implementar `ProcessManager` (spawn/kill NestJS)
- [ ] Implementar `DatabaseManager` (init DB, run migrations)
- [ ] Implementar `SystemManager` (CPU, RAM, disk)
- [ ] Implementar `UpdaterManager` (check for updates)
- [ ] Implementar `BackupManager` (backup/restore)
- [ ] Implementar `ExportData` (SQLite → SQL export)
- [ ] Configurar `tauri.conf.json` (windows, security, updater)
- [ ] Auto-updater con GitHub Releases

**Bloqueadores:** Fase 1 completada
**Dependencias:** Tauri 2.x, Rust toolchain, Node.js 20+

---

### Fase 3: React POS (6-8 semanas)

**Milestone:** POS funcional en React con feature parity vs Angular.

**Módulos críticos (en orden):**

#### 3.1 Auth + Layout (1 semana)
- [ ] LoginPage
- [ ] FirstRunWizard
- [ ] MainLayout, Sidebar, Header
- [ ] Zustand auth store
- [ ] useAuth hook

#### 3.2 POS / Carrito (2 semanas)
- [ ] POSPage (main cashier)
- [ ] ProductSearch
- [ ] ProductGrid
- [ ] Cart
- [ ] PaymentDialog
- [ ] ReceiptPrinter
- [ ] OfflineIndicator
- [ ] Zustand sales store

#### 3.3 Productos (1 semana)
- [ ] ProductsPage
- [ ] ProductForm
- [ ] ProductVariants
- [ ] PricingManager
- [ ] Zustand products store

#### 3.4 Inventario (1 semana)
- [ ] InventoryPage
- [ ] StockMovements
- [ ] StockAdjustment

#### 3.5 Reportes (1 semana)
- [ ] ReportsPage
- [ ] SalesReport
- [ ] InventoryReport
- [ ] CashReport

#### 3.6 Caja (1 semana)
- [ ] CashRegisterPage
- [ ] OpenRegisterModal
- [ ] CloseRegisterModal
- [ ] CashMovements

#### 3.7 Configuración (1 semana)
- [ ] SettingsPage
- [ ] CompanyForm
- [ ] StoreForm
- [ ] UsersManager
- [ ] CloudSyncSettings
- [ ] BackupRestore

**Bloqueadores:** Fase 1 completada
**Dependencias:** React 19, Shadcn/ui, Zustand 5, React Router 7

---

### Fase 4: Integración + Empaquetado (2-3 semanas)

**Milestone:** Instaladores para Windows, macOS, Linux.

- [ ] Integrar React POS con NestJS API
- [ ] Integrar Tauri con React POS
- [ ] Configurar build pipeline (Vite + Tauri)
- [ ] Generar installers (MSI, DMG, AppImage)
- [ ] Testing cross-platform
- [ ] Performance tuning
- [ ] Documentación de usuario

**Bloqueadores:** Fases 2 y 3 completadas
**Dependencias:** Tauri bundler, platform-specific toolchains

---

### Fase 5: Cloud Sync (2-3 semanas)

**Milestone:** Multi-dispositivo funcional.

- [ ] Implementar CloudRelayService (push/pull)
- [ ] Implementar conflict resolution (last-write-wins)
- [ ] WebSocket para notificaciones en tiempo real
- [ ] Configuración de sync en Settings
- [ ] Testing de offline→online transitions
- [ ] Documentación de sync

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
