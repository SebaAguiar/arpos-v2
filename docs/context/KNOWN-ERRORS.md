# Errores Conocidos y Gotchas — Arcom Tauri v2

Este documento lista edge cases conocidos, vulnerabilidades de rendimiento y quirks del sistema en Arcom.

---

## 1. SQLite: WAL Mode y Concurrencia

- **Síntoma:** "database is locked" durante operaciones simultáneas.
- **Causa:** SQLite en WAL mode permite lecturas concurrentes, pero las escrituras son excluyentes. Si NestJS hace múltiples writes simultáneos (ej: sync + venta), puede bloquearse.
- **Solución:**
  ```typescript
  // Aumentar timeout de WAL
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000');
  ```
- **Prevención:** Serializar writes críticos (ventas) y usar batch writes para sync.

---

## 2. SQLite: Tamaño de Archivo

- **Síntoma:** `app.db` crece indefinidamente.
- **Causa:** SQLite no libera espacio automáticamente después de deletes/updates.
- **Solución:**
  ```bash
  # Ejecutar VACUUM periódicamente
  sqlite3 ~/.arcom/data/app.db "VACUUM;"
  ```
- **Prevención:** Ejecutar VACUUM en el backup automático diario.

---

## 3. Prisma: Migration Ordering

- **Síntoma:** `npx prisma migrate deploy` falla con "table already exists" o "column does not exist".
- **Causa:** Migraciones aplicadas fuera de orden, o una migración referencia una tabla/columna que aún no existe.
- **Solución:** Asegurar que las migraciones tengan timestamps secuenciales y nunca referencien objetos creados en migraciones posteriores.
- **Prevención:** Nunca modificar migraciones después de commitear. Crear nuevas migraciones para cambios de schema.

---

## 4. Prisma: SQLite vs PostgreSQL Type Mismatches

- **Síntoma:** Queries funcionan en PostgreSQL pero fallan en SQLite.
- **Causa:** Diferencias de tipos entre providers.
- **Check:**
  ```typescript
  // PostgreSQL: DECIMAL(10,2) → SQLite: INTEGER (centavos)
  // PostgreSQL: UUID → SQLite: TEXT(36)
  // PostgreSQL: TIMESTAMP → SQLite: INTEGER (ms)
  // PostgreSQL: JSONB → SQLite: TEXT (stringified)
  // PostgreSQL: SERIAL → SQLite: INTEGER (autoincrement)
  ```
- **Solución:** Usar el transformer service para convertir tipos durante la migración cloud→local.

---

## 5. Tauri: Process Manager y NestJS

- **Síntoma:** NestJS no inicia o se cierra inesperadamente.
- **Causa:** El process manager de Tauri (Rust) spawn NestJS como child process. Si Node.js no está en PATH o el puerto está ocupado, falla silenciosamente.
- **Check:**
  ```bash
  # Verificar Node.js
  node --version  # Debe ser >= 20

  # Verificar puerto
  lsof -i :3000

  # Verificar logs de Tauri
  cat ~/.arcom/logs/tauri.log
  ```
- **Solución:** Verificar que Node.js esté instalado y que el puerto 3000 esté libre.

---

## 6. Tauri: Auto-updater y Firmas

- **Síntoma:** Auto-updater no descarga actualizaciones.
- **Causa:** La firma Ed25519 no coincide o el endpoint de updates no responde.
- **Check:**
  ```bash
  # Verificar configuración de updater en tauri.conf.json
  # Verificar que la URL del endpoint sea correcta
  # Verificar que la public key coincida
  ```
- **Solución:** Verificar la configuración del updater y la firma del release.

---

## 7. React: Zustand Store Persistence

- **Síntoma:** Estado del carrito se pierde al recargar la página.
- **Causa:** Zustand stores no persisten por defecto. Necesitan middleware de persistencia.
- **Solución:**
  ```typescript
  import { persist } from 'zustand/middleware';

  export const useSalesStore = create<SalesState>()(
    persist(
      (set, get) => ({
        // ... store logic
      }),
      { name: 'sales-storage' }
    )
  );
  ```

---

## 8. React: Lazy Loading y Suspense

- **Síntoma:** Pantalla blanca al navegar entre rutas.
- **Causa:** Lazy-loaded components sin fallback de Suspense.
- **Solución:**
  ```tsx
  <Suspense fallback={<Spinner />}>
    <Routes>
      <Route path="/pos" element={<POSPage />} />
    </Routes>
  </Suspense>
  ```

---

## 9. Conversión de Datos: PostgreSQL → SQLite

- **Síntoma:** Datos corruptos o perdidos después de la migración.
- **Causa:** Conversión incorrecta de tipos (DECIMAL→INT, JSONB→TEXT, TIMESTAMP→INT).
- **Solución:** Validar cada conversión con tests:
  ```typescript
  describe('Data Transformer', () => {
    it('should convert DECIMAL price to INTEGER cents', () => {
      expect(transformPrice('99.99')).toBe(9999);
    });

    it('should convert JSONB to TEXT string', () => {
      expect(transformJsonb({ key: 'value' })).toBe('{"key":"value"}');
    });

    it('should convert TIMESTAMP to INTEGER ms', () => {
      const ts = new Date('2026-01-15T10:30:00Z');
      expect(transformTimestamp(ts.toISOString())).toBe(ts.getTime());
    });
  });
  ```

---

## 10. Offline Sync: Conflictos

- **Síntoma:** Datos duplicados o perdidos después de sincronizar.
- **Causa:** Cambios locales y remotos en la misma entidad sin resolución de conflictos.
- **Solución:** Implementar last-write-wins con timestamps:
  ```typescript
  function resolveConflict(local: SyncItem, remote: SyncItem): SyncItem {
    return local.updated_at > remote.updated_at ? local : remote;
  }
  ```

---

## 11. Offline Sync: Queue Overflow

- **Síntoma:** La cola de sync crece indefinidamente cuando el usuario está offline por mucho tiempo.
- **Causa:** No hay límite de tamaño para la cola de sync.
- **Solución:**
  ```typescript
  // Limitar cola a 10K items
  const MAX_QUEUE_SIZE = 10000;

  async enqueueChange(change: SyncQueueItem) {
    const count = await this.prisma.syncQueue.count();
    if (count >= MAX_QUEUE_SIZE) {
      // Forzar sync o descartar cambios antiguos
      await this.processOldestBatch();
    }
    // ... enqueue
  }
  ```

---

## 12. Prisma: N+1 Query Problem

- **Síntoma:** Endpoint lento a pesar de dataset pequeño. Cientos de queries por request.
- **Causa:** Cargar entidades relacionadas en un loop:
  ```typescript
  // ❌ N+1: Una query para ventas, luego N queries para cada venta
  const sales = await prisma.sale.findMany();
  for (const sale of sales) {
    sale.items = await prisma.saleItem.findMany({
      where: { saleId: sale.id }
    });
  }
  ```
- **Solución:** Usar includes o batch loading:
  ```typescript
  // ✅ Una sola query con include
  const sales = await prisma.sale.findMany({
    include: { items: true }
  });
  ```

---

## 13. React: Memory Leaks en Event Listeners

- **Síntoma:** Memoria crece continuamente sin liberarse.
- **Causa:** Event listeners no removidos en cleanup de useEffect.
- **Solución:**
  ```typescript
  useEffect(() => {
    const handler = () => { /* ... */ };
    window.addEventListener('resize', handler);

    return () => {
      window.removeEventListener('resize', handler); // Cleanup
    };
  }, []);
  ```

---

## 14. Tauri: Path Normalization Cross-Platform

- **Síntoma:** Rutas fallan en Windows pero funcionan en macOS/Linux.
- **Causa:** Hardcoded `/` path separators o asunciones de Unix.
- **Solución:** Usar `path.join()` y `dirs::home_dir()` en Rust, `path.join()` en TypeScript.

---

## 15. NestJS: Circular Dependencies

- **Síntoma:** App crashea al bootstrap con "circular dependency detected".
- **Causa:** Módulo A importa Módulo B, y Módulo B importa Módulo A.
- **Solución:** Extraer providers compartidos a un tercer módulo:
  ```typescript
  // ❌ Circular: SalesModule ↔ InventoryModule
  // ✅ Fixed: Both import SharedModule
  ```

---

## 16. React: Context Key Typos

- **Síntoma:** El DTO validado no está disponible en el handler.
- **Causa:** Typo en el nombre del parámetro o Pipe no aplicado en orden correcto.
- **Solución:** Usar Pipes de NestJS para validación automática:
  ```typescript
  // ✅ Correcto — NestJS Pipes validan y transforman automáticamente
  @Post('/')
  @UseGuards(AuthGuard)
  create(@Body(CreateSaleDto) dto: CreateSaleDto) {
    // dto está tipado y validado
  }

  // ❌ Wrong — no usar validación manual con context keys
  ```

---

## 17. Updater: Firma Ed25519 Inválida

- **Síntoma:** "Signature verification failed" al intentar actualizar.
- **Causa:** La clave pública en `tauri.conf.json` no coincide con la clave privada usada para firmar el binario. Común después de regenerar keys sin actualizar la config.
- **Check:**
  ```bash
  # Verificar que la pubkey en tauri.conf.json coincida
  cat src-tauri/tauri.conf.json | grep pubkey

  # Comparar con la generada
  cat tauri.key.pub
  ```
- **Solución:** Regenerar el binario con la clave correcta y actualizar `tauri.conf.json`.
- **Prevención:** Guardar la clave privada en GitHub Secrets y 1Password. Nunca regenerar sin documentar.

---

## 18. Offline Durante Auto-Update

- **Síntoma:** La app no actualiza porque el device está offline cuando sale la versión nueva.
- **Causa:** El background thread solo puede checkear updates con conexión a internet.
- **Check:**
  ```typescript
  // Verificar estado de conexión
  const isOnline = navigator.onLine;
  // O en Tauri:
  const isOnline = await invoke('check_network_status');
  ```
- **Solución:** Retry automático cada 1 hora. Al reconectar, se detecta la versión nueva y se descarga.
- **Prevención:** No fallar silenciosamente — loggear que el check no se pudo hacer por falta de conexión.

---

## 19. Rollback Fallido por Backup Corrupto

- **Síntoma:** `manual_rollback_to_version` falla con "Backup for X not found" o "App corrupted".
- **Causa:** El backup de la versión anterior fue eliminado, dañado, o nunca se creó.
- **Check:**
  ```bash
  # Verificar backups disponibles
  ls -la ~/.arcom/backup/

  # Verificar integridad de un backup
  file ~/.arcom/backup/arcom_1.0.0.tar.gz
  ```
- **Solución:** Si el backup local no existe, descargar la versión anterior desde GitHub Releases.
- **Prevención:** Crear backup del binario anterior ANTES de aplicar cada update. Mantener al menos 2 versiones de backup.

---

## 20. Differential Update No Disponible (Versión Muy Vieja)

- **Síntoma:** El updater descarga full binary en lugar de patch, o falla con "delta not available".
- **Causa:** La versión instalada es demasiado vieja (ej: v0.8.0) y Tauri no puede generar un delta desde esa versión.
- **Check:**
  ```bash
  # Verificar versión actual
  cat ~/.arcom/config/version.json
  ```
- **Solución:** Tauri cae automáticamente a full binary download. No hay forma de forzar delta desde versiones muy viejas.
- **Prevención:** Mantener el updater habilitado para que los usuarios se mantengan al día. Las actualizaciones incrementales (v1.0.0 → v1.0.1 → v1.0.2) siempre funcionan con delta.

---

## 21. Updater: Endpoint GitHub API No Deserializa (requiere latest.json)

- **Síntoma:** `check()` del updater no detecta versiones nuevas / falla silenciosamente; el manifest
  descargado del endpoint nunca se parsea.
- **Causa:** `tauri-plugin-updater` (verificado en v2.10.1) **no parsea el JSON de la GitHub API**.
  `RemoteRelease::deserialize` solo acepta `{version, url, signature}` (dinámico) o
  `{version, platforms: {"<os>-<arch>": {url, signature}}}` (estático). La API de GitHub devuelve
  `tag_name`/`assets[]`, y `name` ("Arcom vX.Y.Z") falla `parse_version` (solo trimea la `v` inicial).
- **Nota histórica:** era un mito del repo que el plugin "descubría automáticamente" los assets de
  GitHub. No existe tal feature en el plugin; el endpoint `api.github.com/.../releases/latest` nunca
  pudo funcionar con el formato actual.
- **Solución (implementada 2026-09):** endpoint estático
  `https://github.com/SebaAguiar/arcom-releases/releases/latest/download/latest.json`. El workflow
  `.github/workflows/release.yml` genera ese manifest con `.github/scripts/generate-latest-json.mjs`
  (enlaza cada `os-arch` con su bundle + `.sig`) y lo sube como asset de la misma release.
- **Prevención:** publicar SIEMPRE `latest.json` como asset del release publicado vía `gh release create`
  en `arcom-releases` (PAT `ARCOM_RELEASES_TOKEN`), y verificar que macOS incluya `*.app.tar.gz` + `.sig`
  (`createUpdaterArtifacts: true`); el `*.dmg` sin `.sig` no alcanza para el updater de macOS.
