# Glosario de Términos — ArPOS Tauri v2

Este documento define las entidades de dominio, términos técnicos y conceptos arquitectónicos utilizados en el código y documentación de ArPOS.

---

## 1. Entidades de Dominio

- **Company:** Empresa o negocio que utiliza ArPOS. En modo local, cada instalación tiene una única Company. Conserva el campo `companyId` para ser reversible a cloud.
- **Store (Sucursal):** Unidad física o lógica dentro de una Company. Cada Store tiene inventario, caja y ventas independientes.
- **Product (Producto):** Artículo o servicio que se vende. Tiene código, nombre, precio (en centavos), costo, stock y categoría.
- **ProductVariant (Variante):** Variación de un producto (talle, color, tamaño). Permite múltiples precios y stocks por variante.
- **Sale (Venta):** Transacción completada entre un usuario y un cliente. Registra items, total, descuento, impuestos, método de pago y estado.
- **SaleItem (Ítem de Venta):** Línea individual dentro de una venta: producto, cantidad, precio unitario y descuento.
- **Contact (Contacto):** Cliente o proveedor. Puede estar asociado a ventas (clientes) o compras (proveedores).
- **CashRegister (Caja):** Registro de apertura/cierre de caja. Asociada a un usuario, una Store y un turno.
- **CashMovement (Movimiento de Caja):** Entrada o salida de dinero en una caja (venta, retiro, depósito, ajuste).
- **Inventory (Inventario):** Stock actual de un producto en una Store. Se actualiza con cada venta y movimiento.
- **InventoryMovement (Movimiento de Inventario):** Registro de entrada, salida o ajuste de stock de un producto.
- **User (Usuario):** Persona que opera ArPOS. Tiene email, contraseña hasheada y rol (admin, cashier, inventory).
- **SyncQueue (Cola de Sincronización):** Cola de cambios pendientes de sincronizar con cloud. Almacena la acción (create/update/delete), entidad, payload y estado (pending/synced/error).

---

## 2. Términos Técnicos

- **Tauri:** Framework de escritorio que empaqueta una app web (React) con un backend Rust. Reemplaza Electron en ArPOS v2. Genera instaladores nativos para Windows, macOS y Linux.
- **Rust:** Lenguaje de programación used en el backend de Tauri para gestión de procesos, filesystem, actualizaciones y comandos nativos.
- **NestJS:** Framework de backend Node.js con arquitectura modular, DI y TypeScript. Reutilizado del 95% del código existente de ArPOS v1.
- **Prisma:** ORM para TypeScript que genera tipos desde un schema. En ArPOS v2 usa SQLite como provider local.
- **SQLite:** Base de datos embebida, sin servidor. Almacena toda la data localmente en `~/.arpos/data/app.db`.
- **WAL (Write-Ahead Logging):** Modo de journaling de SQLite que permite lecturas concurrentes durante escrituras. Habilitado por defecto en ArPOS.
- **React:** Librería de UI para el frontend del POS. Reemplaza Angular en ArPOS v2.
- **Zustand:** Biblioteca de state management para React. Reemplaza NGRx. Más simple, menos boilerplate.
- **Shadcn/ui:** Biblioteca de componentes UI construida sobre Radix UI y TailwindCSS. Componentes copy-paste, no una librería instalada.
- **Radix UI:** Primitivas de UI headless (sin estilos) para construir componentes accesibles.
- **TailwindCSS:** Framework de CSS utility-first. Mismo sistema que ArPOS v1.
- **React Router:** Router para React con lazy-loaded routes y layouts anidados.
- **Vite:** Build tool para React. Dev server ultrarrápido con HMR.
- **Prisma Migrate:** Herramienta de migración de schema de Prisma. Genera SQL desde el schema.prisma.
- **Prisma Studio:** IDE visual para inspeccionar y editar la base de datos.

---

## 3. Términos Arquitectónicos

- **Local-first:** Paradigma donde la app funciona 100% offline con datos locales. La nube es opcional, no requerida.
- **Offline-first:** Similar a local-first. La app prioriza el funcionamiento sin conexión y sincroniza cuando reconnecta.
- **Cloud sync (Sincronización con nube):** Funcionalidad opcional que replica datos locales a PostgreSQL cloud (Neon) y viceversa.
- **SyncQueue:** Cola de cambios pendientes de sincronizar. Cada escritura local se encola y se procesa cuando hay conexión.
- **Last-write-wins:** Estrategia de resolución de conflictos donde el cambio más reciente (por timestamp) sobrescribe al anterior.
- **Migration wizard:** Asistente React que guía al usuario en la migración de datos desde cloud (PostgreSQL) a local (SQLite).
- **FirstRunWizard:** Asistente de primer uso que configura Company, Store y usuario admin.
- **Feature flag:** Interruptor que habilita/deshabilita funcionalidades en runtime. Ejemplo: `USE_REACT_POS`, `ENABLE_CLOUD_SYNC`.
- **Process manager:** Componente Rust (Tauri) que spawn/kill el proceso NestJS como sidecar.
- **Health check:** Endpoint `GET /api/health` que verifica que NestJS y SQLite están operativos.
- **Auto-updater:** Mecanismo de Tauri que descarga e instala actualizaciones desde GitHub Releases.
- **Monorepo:** Estructura de repositorio con múltiples apps/packages en un solo repo. ArPOS usa pnpm workspaces + Nx.
- **Nx:** Herramienta de monorepo que gestiona builds, tests y dependencias entre apps/packages.

---

## 4. Términos de Persistencia

- **`~/.arpos/`:** Directorio raíz de datos de ArPOS en la máquina del usuario.
  - `data/app.db` — Base de datos SQLite principal
  - `backup/` — Backups automáticos diarios (JSON comprimido)
  - `config/` — Configuración de la aplicación
  - `sync/` — Cola de sincronización y caché offline
  - `logs/` — Logs de la aplicación y API
- **Decimal → Int (centavos):** Conversión de precios de PostgreSQL DECIMAL(10,2) a SQLite INTEGER. Ejemplo: $99.99 → 9999 centavos.
- **JSONB → TEXT:** Conversión de campos JSON de PostgreSQL a texto string en SQLite.
- **TIMESTAMP → INTEGER (ms):** Conversión de timestamps de PostgreSQL a milisegundos Unix en SQLite.
- **UUID → TEXT(36):** UUIDs de PostgreSQL se almacenan como texto en SQLite.

---

## 5. Términos de UI/UX

- **POS (Point of Sale / Punto de Venta):** Pantalla principal donde el cajero registra ventas. Carrito + búsqueda de productos + cobro.
- **Carrito (Cart):** Lista de productos seleccionados para una venta. Muestra cantidad, precio y total.
- **Cobrar (Checkout):** Proceso de finalizar una venta: seleccionar método de pago y confirmar.
- **Recibo (Receipt):** Comprobante de venta impreso o digital.
- **Modo offline (Offline mode):** Estado visual que indica que la app funciona sin conexión a internet.
- **Dashboard:** Panel principal con métricas: ventas del día, productos más vendidos, alertas de stock.
- **Inventario:** Vista de stock actual, movimientos y ajustes.
- **Reportes:** Sección de análisis: ventas por período, inventario, caja.
- **Settings (Configuración):** Sección de configuración: empresa, sucursales, usuarios, sync cloud, backup.
