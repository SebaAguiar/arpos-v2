# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Comerciantes, cajeros y administradores de tiendas físicas en punto de venta (POS) de alto volumen. Operan en locales comerciales de atención directa al público donde la velocidad de cobro, la estabilidad del sistema y la operabilidad offline sin interrupciones son críticas.

## Product Purpose
Proporcionar un sistema de punto de venta (POS) y gestión comercial de escritorio, rápido, confiable y 100% autónomo. Elimina la dependencia de servidores locales complejos, contenedores Docker o conectividad continua a Internet, garantizando la continuidad operativa del negocio y la emisión de comprobantes en todo momento.

## Positioning
"Un POS desktop que funciona sin servidor, sin Docker, sin internet — con un solo clic."
Diferencial de 4 pilares:
1. Local-first real: SQLite embebido dentro del binario. Cero configuración, cero dependencias de servicios externos.
2. Sync cloud opcional: Replicación a PostgreSQL (Neon) como opción de respaldo/multi-sucursal, no como requisito para vender.
3. Desktop nativo con Tauri: Binario ligero (~80MB), bajo consumo de recursos y gestión nativa de hardware, impresión y procesos.
4. Reversibilidad total: Exportación libre a SQL estándar en cualquier momento, garantizando propiedad de los datos y cero lock-in.

## Operating Context
- Entornos de mostrador y cajas registradoras físicas con escáneres de código de barras, impresoras térmicas de tickets y lectores de medios de pago.
- Flujos de trabajo de cobro ágil (venta rápida, búsqueda de productos por código/nombre, variaciones por talle/color, cálculo de cambio, arqueo de caja diario).
- Operación en red local multi-caja o terminales independientes con posible pérdida intermitente de conexión a Internet.
- Mercado inicial: Argentina (facturación electrónica ARCA/AFIP), con proyección de expansión a LATAM.

## Capabilities and Constraints
- **Capacidades confirmadas:** POS con carrito y cobro ágil, catálogo de productos con variantes (talle/color), control de inventario por sucursal, arqueo y cierre de caja, facturación fiscal ARCA/AFIP, respaldos automáticos a JSON comprimido, sync opcional vía SyncQueue.
- **Restricciones técnicas:** Arquitectura Multi-tenant estricta (`companyId`/`storeId`), SQLite con transacciones estrictas y precios almacenados en enteros (centavos), TypeScript strict (`any` prohibido), backend NestJS 11 local embebido en Tauri 2.x.
- **Datos no decididos / Variables:** Nombre comercial definitivo (nombre actual "ArPOS" es provisorio debido a homónimos en el mercado).

## Brand Commitments
- **Voz de marca:** Cercana pero profesional, inspirando confianza operativa y robustez tecnológica.
- **Estética e identidad visual:**
  - Tono visual: Minimalista, profesional, fondos oscuros (dark mode por defecto con fondos casi negros `#0f0f0f` / `#1a1a1a` y alto contraste en texto; toggle a light mode).
  - Sistema de UI: Shadcn/ui + Radix UI sobre TailwindCSS 4.
  - Paleta de grises: Slate.
  - Color de acento provisorio: Orange (`#e54d2e`).
  - Bordes y formas: Radius Medium.
  - Tipografía: Stack tipográfico del sistema (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif).
- **Pendientes de marca:** Isologotipo (pendiente de diseño).

## Evidence on Hand
- `docs/context/ARCHITECTURE.md` — Especificación técnica completa de la arquitectura Tauri + React + NestJS + SQLite.
- `docs/context/CONVENTIONS.md` — Convenciones estrictas de código, contratos Zod y patrones de repositorio.
- `docs/context/KNOWN-ERRORS.md` — Registro de edge cases de base de datos local, Tauri e hilos de ejecución.
- `docs/context/DECITIONS.md` — Justificación de arquitectura (Tauri vs Electron, SQLite vs Postgres, Zustand vs Redux).

## Product Principles
1. **La venta no se detiene nunca:** El sistema debe cobrar y registrar transacciones sin importar el estado de la red o la nube.
2. **Cero fricción de instalación:** Descargar, ejecutar y operar. Sin dependencias de software de terceros (sin Docker, sin servidores de DB independientes).
3. **Soberanía y reversibilidad de datos:** El usuario es el único dueño de sus datos, con exportación libre y sincronización cloud transparente cuando decida activarla.
4. **Velocidad táctil y visual:** Interfaz clara, de alto contraste y escaneable que minimice clics y tiempos de atención en mostrador.

## Accessibility & Inclusion
- Contraste elevado para legibilidad en pantallas de mostrador bajo diversas condiciones de luz.
- Navegación nativa por teclado completa en la vista de cobro POS (shortcuts para búsqueda, cobro, selección de medios de pago y emisión de ticket).
- Componentes Radix UI accesibles por defecto (cumplimiento de estándares ARIA e interacción por teclado).
