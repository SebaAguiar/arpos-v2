# Errores Conocidos y Gotchas — ArPOS Tauri v2

Este documento lista edge cases conocidos, vulnerabilidades de rendimiento y quirks del sistema en ArPOS.

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
  sqlite3 ~/.arpos/data/app.db "VACUUM;"
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
  cat ~/.arpos/logs/tauri.log
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

- **Síntoma:** `c.get('kanji.validated.body')` retorna `undefined`.
- **Causa:** Typo en el nombre del context key o middleware no aplicado en orden correcto.
- **Solución:** Definir constantes para context keys:
  ```typescript
  export const KANJI_CTX = {
    VALIDATED_BODY: 'kanji.validated.body',
    VALIDATED_QUERY: 'kanji.validated.query',
    AUTH_USER: 'kanji.auth.user',
  } as const;
  ```
