# Sincronización Cloud — ArPOS Tauri v2

Este documento especifica el sistema de sincronización de ArPOS (Fase 5 del ROADMAP): cómo los POS locales (SQLite) replican datos a un servidor cloud y viceversa, de forma opcional y offline-first.

---

## 1. Principios

- **Cloud es opcional.** ArPOS funciona 100% local. La sincronización es una feature que el usuario habilita en Settings.
- **Offline-first.** Todo cambio local se encola en `SyncQueue`. Si cloud no está configurado, los cambios quedan en la cola (estado `pending`) hasta que el usuario conecta el cloud. **Nunca** se marcan como `synced` sin haber sido confirmados por el cloud.
- **Last-write-wins (LWW).** El conflicto se resuelve comparando timestamps: gana el cambio cuyo `updated_at` sea más reciente. Un cambio remoto se ignora (skip) si el registro local ya tiene `updated_at >= change.updatedAt`.
- **Tenant aislado.** Todo acceso a la cola y a la configuración cloud es por `companyId` + `storeId` vía `TenantContextService`. No hay datos cruzados entre empresas.
- **Multi-dispositivo.** Múltiples POS pueden apuntar al mismo cloud. El WebSocket notifica cambios remotos para hacer pull inmediato, sin esperar el polling de 30s.

---

## 2. Arquitectura

```
┌─────────────────────────┐         ┌──────────────────────────┐
│ POS local (SQLite)      │  HTTP   │ Cloud relay              │
│                         │ ──────► │ POST /api/sync/apply     │  (push)
│ SyncQueue               │         │                          │
│ SyncService             │  HTTP   │ GET /api/sync/changes    │  (pull)
│ CloudRelayService       │ ◄────── │                          │
│                         │         │                          │
│                         │  WS     │ sync:changes             │  (evento)
│ socket.io-client        │ ◄────── │ notifica cambios remotos │
└─────────────────────────┘         └──────────────────────────┘
```

- **Push:** `SyncService.processPending()` lee los primeros `BATCH_SIZE` (100) items `pending` y llama `CloudRelayService.pushToCloud()` por cada uno. Si el push HTTP retorna OK, el item se marca `synced`.
- **Pull:** `GET {cloud_url}/api/sync/changes?since={ts}` trae los cambios posteriores al último `synced_at` local. Cada cambio se aplica con `applyRemoteChange()`.
- **WebSocket:** `CloudRelayService.connectWebSocket()` abre un socket a `{cloud_url}` con el JWT en `auth`. Al recibir el evento `sync:changes`, dispara el handler registrado por `SyncService.onModuleInit()` → `pullFromCloud()`.

### 2.1 Cola (`SyncQueue`)

| Campo | Descripción |
|---|---|
| `action` | `create` \| `update` \| `delete` |
| `entity` | `sale`, `product`, `inventory`, `contact`, `cash_register`, `user`, `store`, `wallet_transaction` |
| `entity_id` | ID del registro en el origen |
| `payload` | JSON con el snapshot completo del cambio |
| `status` | `pending` \| `synced` \| `error` |
| `error_message` | Detalle del último fallo de push |

- Tope de cola: `MAX_QUEUE_SIZE = 10_000`. Al alcanzarlo se procesa el batch más viejo antes de encolar.
- `enqueueChange()` valida `action` y `entity` contra las listas permitidas y dispara `processPending()` tras encolar.

### 2.2 Límites y retry

- `BATCH_SIZE = 100` items por pasada de `processPending()`.
- Si un push falla, el item pasa a `error` con mensaje; no se reintenta automáticamente (el usuario puede reintentar desde Settings con "Subir cambios").
- `cleanupSynced` / `cleanupPending` borran items con más de `older_than_days` (default 30).

---

## 3. Configuración cloud

Se persiste en el JSON de `company.config` (columna `config` de `companies`), bajo las claves:

```json
{
  "cloud": { "url": "https://relay.example.com", "jwt": "<token>" },
  "subscription": { "status": "active", "tier": "pro", "expiresAt": 1735689600 }
}
```

- `saveCloudConfig(url, jwt)` actualiza `cloud` **preservando** la `subscription` existente.
- `saveSubscription(info)` actualiza `subscription` preservando `cloud`.
- `clearCloudConfig()` borra la clave `cloud` (mantiene `subscription`) y desconecta el WebSocket.
- `getConfigInfo()` retorna `{ cloud_configured, cloud_url, subscription }`. `cloud_configured` es verdadero si hay `cloud.url` o el env `CLOUD_URL`.
- Fallback: si no hay config en DB, se usan los env vars `CLOUD_URL` y `CLOUD_JWT`.

### 3.1 Endpoints HTTP (`SyncController`)

| Método | Ruta | Descripción | Guard |
|---|---|---|---|
| `GET` | `/api/sync/status` | Estadísticas de la cola (pending/synced/error) | — |
| `GET` | `/api/sync/pending?limit=` | Items pendientes | — |
| `GET` | `/api/sync/config` | Configuración cloud actual | — |
| `POST` | `/api/sync/config` | Guarda `cloud_url`/`cloud_jwt` y/o `subscription` | — |
| `POST` | `/api/sync/process` | Procesa batch pendiente | — |
| `POST` | `/api/sync/disconnect` | Borra config cloud y desconecta WS | — |
| `POST` | `/api/sync/reconnect` | Reabre WS y hace pull inmediato | `SubscriptionGuard` |
| `POST` | `/api/sync/pull` | Pull de cambios desde último sync | `SubscriptionGuard` |
| `POST` | `/api/sync/cleanup/synced` | Borra items synced viejos | — |
| `POST` | `/api/sync/cleanup/pending` | Borra items pending viejos | — |

**`SubscriptionGuard`** (aplica a `pull` y `reconnect`): lee `company.config` → `subscription`, exige `status === 'active'` y valida que `expiresAt` no haya pasado.

---

## 4. Aplicación de cambios remotos (`applyRemoteChange`)

`CloudRelayService.applyRemoteChange(change)` muta el SQLite local aplicando el snapshot remoto. Reglas por entidad:

| Entidad | Comportamiento |
|---|---|
| `product` | create: `product.create`; update: `product.update` (LWW). Crea variantes anidadas si el payload las trae. |
| `inventory` | Upsert por `productId + storeId` con LWW; si no existe el producto local, registra `error`. |
| `contact` | create/update por LWW. |
| `sale` | create: crea la venta con sus `items[]`; si el producto de un item no existe, lo crea primero (datos mínimos) y **decrementa su stock**. `user_id` faltante/inexistente → crea un **usuario placeholder** (ver §4.1) o fallback `'system'`. |
| `user` | create/update por LWW. |
| `cash_register` | create/update por LWW. |
| `wallet_transaction` | create por LWW; valida que el `contact_id` exista localmente (si no, error). |
| `store` | create/update por LWW. |

**LWW:** un cambio se **skippea** (no se aplica) si `existing.updated_at >= change.updatedAt`. El resultado se reporta como `skipped`, no como error.

### 4.1 Usuario placeholder

Una venta remota puede referenciar un `user_id` que aún no existe localmente. En ese caso se crea un usuario sintético:

- `email`: `sync-{userId}@local.arpos`
- `role`: `cashier`
- `is_active`: `false`
- `password`: placeholder no utilizable (constante `SPEC_ENTITY_PLACEHOLDER_PASSWORD`)

### 4.2 Resultado del pull

`PullResult = { pulled, applied, skipped, errors[] }`. Los errores por cambio se acumulan en `errors` (con mensaje) y no abortan el resto del lote.

---

## 5. Frontend (React)

Patrón Service → Store → Smart Component (ver AGENTS.md §4.6):

- `services/sync.service.ts` — `getStatus`, `processPending`, `pullFromCloud`, `getConfig`, `saveConfig`, `disconnect`, `reconnect`.
- `stores/sync.store.ts` — estado global (pending/synced/failed, `cloudConfig`, `subscription`, `lastPullResult`) + acciones. Persiste `subscription` en `localStorage` (`arpos-sync`). Polling de `fetchStatus` cada 30s.
- `components/settings/CloudSyncSettings.tsx` — smart component que conecta el store, muestra estado de conexión, botones Subir/Descargar, y form de URL + JWT.
- `pages/SettingsPage.tsx` — monta `<CloudSyncSettings />` y la tarjeta de Suscripción.

---

## 6. Seguridad

- El JWT viaja en `Authorization: Bearer` para HTTP y en `auth.token` para el WebSocket.
- El cloud nunca recibe la configuración: solo el POS local guarda URL + JWT.
- La suscripción protege `pull`/`reconnect` (no el push): un POS vencido no descarga, pero puede seguir encolando.
- La DB local guarda el JWT en texto plano dentro de `company.config` (SQLite). Es aceptable porque la DB es local al equipo y el JWT se puede revocar; no almacenar contraseñas de usuarios ahí.

---

## 7. Errores conocidos y gotchas

- **WAL lock:** `applyRemoteChange` de `sale` hace múltiples escrituras (sale + items + stock). En SQLite embebido, escrituras concurrentes pueden tirar `DB locked` (se reporta como error del cambio, no aborta el lote). Ver `docs/context/KNOWN-ERRORS.md`.
- **`user_id` no nullable:** en `sales` el campo es obligatorio en Prisma; un sale remoto sin `user_id` usa el usuario `'system'`.
- **Payloads con fechas en segundos:** todos los `created_at`/`updated_at`/`synced_at` se manejan en **segundos Unix**, no milisegundos. El frontend multiplica por 1000 al mostrarlos.
- **LWW sin reloj físico compartido:** si dos dispositivos tienen relojes desincronizados, LWW puede elegir "mal". Aceptado para v1; revisar `updated_at` del servidor como fuente en v2.
- **Polling + WebSocket:** el polling de `fetchStatus` (30s) solo refresca estadísticas; los datos llegan por pull (manual, `reconnect`, o evento WS).

---

## 8. Testing

- Unit: `cloud-relay.service.spec.ts` (push HTTP, pull con create/skip-outdated/errors, sale con items + decrement stock, placeholder user, wallet transaction, config save/clear) y `sync.service.spec.ts` (offline-first sin cloud configurado, encolado, batch).
- Comando: `pnpm --filter api test`.
- Pendiente: E2E de transiciones offline → online (marcar en `docs/ROADMAP.md` Fase 5).
