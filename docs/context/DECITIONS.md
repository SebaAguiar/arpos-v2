# Decisiones Técnicas — ArPOS Tauri v2

Este documento registra las decisiones arquitectónicas y técnicas tomadas durante la migración de ArPOS, incluyendo alternativas consideradas y trade-offs.

---

## 1. NestJS como Backend (Reutilización)

- **Decisión:** Reutilizar NestJS como backend, adaptándolo a SQLite.
- **Justificación:** El 95% del código NestJS existente (controllers, services, repositories) funciona con cambios mínimos. Prisma soporta SQLite como provider, lo que permite reutilizar la capa de ORM casi intacta.
- **Alternativas consideradas:**
  - *Reescribir en Hono/Bun:* Rechazado porque duplicaría 6+ meses de trabajo sin beneficio claro para un POS local.
  - *Mantener PostgreSQL obligatorio:* Rechazado porque requiere Docker/servidor, incompatible con "un click instalar".
- **Trade-off:** NestJS es más pesado que Hono, pero el esfuerzo de migración a otro framework no justifica el cambio para una app de escritorio.

---

## 2. Prisma + SQLite (vs Drizzle, vs PostgreSQL)

- **Decisión:** Usar Prisma con provider SQLite para la base de datos local.
- **Justificación:** Prisma ya existe en el proyecto v1. El cambio de provider de PostgreSQL a SQLite es un cambio de configuración + migraciones, no de framework. SQLite es embebido (sin servidor), ideal para desktop.
- **Alternativas consideradas:**
  - *Drizzle ORM:* Rechazado porque requiere reescribir todas las queries y no hay benefit real para un POS.
  - *PostgreSQL local (WAL mode):* Rechazado porque requiere instalación de PostgreSQL, incompatible con "sin dependencias".
  - *Better-sqlite3 directo:* Rechazado porque pierde el schema management y migraciones de Prisma.
- **Trade-off:** Prisma genera un cliente más pesado que better-sqlite3, pero la gestión de schema y migraciones lo justifican.

---

## 3. React + Radix UI + Shadcn/ui (vs Angular, vs Vue)

- **Decisión:** Reemplazar Angular por React 19 con Shadcn/ui como librería de componentes.
- **Justificación:** React tiene mejor ecosistema para Tauri, menor bundle size, y Shadcn/ui ofrece componentes accesibles y customizables sin dependencia de librería externa.
- **Alternativas consideradas:**
  - *Mantener Angular:* Rechazado porque Tauri tiene mejor soporte para React, y Angular es más pesado para desktop.
  - *Vue 3:* Rechazado porque el ecosistema de Shadcn/ui y Radix es más maduro para React.
  - *Material UI:* Rechazado porque es más pesado y menos customizable que Shadcn/ui.
- **Trade-off:** React requiere reescribir la UI (6-8 semanas), pero la experiencia de usuario y el ecosistema lo justifican.

---

## 4. Zustand (vs NGRx, vs Redux)

- **Decisión:** Usar Zustand para state management en React.
- **Justificación:** Zustand es más simple que NGRx/Redux, con menos boilerplate y mejor DX. Para un POS, el state management es relativamente simple (carrito, auth, UI state).
- **Alternativas consideradas:**
  - *NGRx:* No disponible para React (es Angular).
  - *Redux Toolkit:* Rechazado porque es más pesado y tiene más boilerplate que Zustand.
  - *Jotai/Recoil:* Rechazados porque Zustand es más estable y tiene mejor DX para este caso de uso.
- **Trade-off:** Zustand tiene menos features que Redux, pero para un POS local es más que suficiente.

---

## 5. Tauri 2.x (vs Electron, vs Docker)

- **Decisión:** Usar Tauri 2.x como runtime de escritorio, reemplazando Electron.
- **Justificación:** Tauri genera binarios más pequeños (~80MB vs ~200MB), tiene mejor rendimiento, y el backend Rust permite gestión nativa de procesos, filesystem y actualizaciones.
- **Alternativas consideradas:**
  - *Electron:* Rechazado porque genera binarios más pesados, usa más memoria, y no tiene backend nativo.
  - *Docker + web:* Rechazado porque requiere instalación de Docker, incompatible con "un click instalar".
  - *Neutralinojs:* Rechazado porque es menos maduro que Tauri.
- **Trade-off:** Tauri requiere conocimiento de Rust, pero el resultado (binarios pequeños, rendimiento nativo) lo justifica.

---

## 6. SQLite Local-First (vs PostgreSQL obligatorio)

- **Decisión:** SQLite como base de datos principal, con sync opcional a PostgreSQL cloud.
- **Justificación:** SQLite es embebido (sin servidor), cero configuración, ideal para desktop. Para un POS típico (<1M transacciones/año), SQLite es más que suficiente.
- **Alternativas consideradas:**
  - *PostgreSQL obligatorio:* Rechazado porque requiere Docker/servidor, incompatible con la propuesta de valor.
  - *IndexedDB:* Rechazado porque no soporta relaciones complejas ni integridad referencial.
  - *MongoDB Local:* Rechazado porque es overkill para un POS y no soporta transacciones ACID.
- **Trade-off:** SQLite no escala a millones de registros, pero para el caso de uso de un POS local es ideal.

---

## 7. React Router v7 (vs Next.js, vs TanStack Router)

- **Decisión:** Usar React Router v7 para el routing del frontend.
- **Justificación:** React Router es el estándar de facto para React, con lazy-loaded routes y layouts anidados. Next.js es overkill para una app de escritorio (SSR no es necesario).
- **Alternativas consideradas:**
  - *Next.js:* Rechazado porque SSR/SSG no es necesario en una app de escritorio.
  - *TanStack Router:* Rechazado porque es más nuevo y tiene menos documentación.
  - *Wouter:* Rechazado porque es demasiado minimalista para las necesidades del POS.
- **Trade-off:** React Router es más pesado que Wouter, pero tiene más features y mejor ecosistema.

---

## 8. Nx para Monorepo (vs Turborepo, vs Lerna)

- **Decisión:** Usar Nx para gestionar el monorepo.
- **Justificación:** Nx ya existe en el proyecto v1, tiene dependency graph, caching de builds, y soporte para múltiples frameworks.
- **Alternativas consideradas:**
  - *Turborepo:* Rechazado porque es más simple pero tiene menos features que Nx.
  - *Lerna:* Rechazado porque está deprecated.
  - *pnpm workspaces solo:* Rechazado porque no tiene dependency graph ni caching.
- **Trade-off:** Nx es más pesado que Turborepo, pero la compatibilidad con el proyecto existente lo justifica.

---

## 9. Sincronización Opcional (vs Obligatoria)

- **Decisión:** La sincronización con cloud es opcional, no requerida.
- **Justificación:** El usuario debe poder usar ArPOS 100% offline sin costo de infraestructura. La sincronización es un add-on para quienes necesitan multi-dispositivo.
- **Alternativas consideradas:**
  - *Sync obligatoria:* Rechazado porque requiere internet y servidor cloud.
  - *P2P sync:* Rechazado porque es más complejo y propenso a conflictos.
  - *Solo local:* Rechazado porque algunos usuarios necesitan multi-dispositivo.
- **Trade-off:** Sync opcional agrega complejidad al código (colas, conflictos), pero da flexibilidad al usuario.

---

## 10. Tasa de Conversión Decimal → Centavos

- **Decisión:** Almacenar precios como INTEGER (centavos) en SQLite, con conversión desde PostgreSQL DECIMAL(10,2).
- **Justificación:** SQLite no tiene tipo DECIMAL. Almacenar en centavos evita problemas de punto flotante y es el patrón estándar para dinero en bases de datos.
- **Alternativas consideradas:**
  - *TEXT con parseFloat:* Rechazado porque es lento y propenso a errores de redondeo.
  - *REAL/DOUBLE:* Rechazado por problemas de punto flotante con dinero.
  - *Decimal.js en aplicación:* Rechazado porque agrega dependencia innecesaria.
- **Trade-off:** Requiere conversión al mostrar (dividir por 100), pero elimina problemas de precisión monetaria.
