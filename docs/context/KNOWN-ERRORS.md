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

## 22. Tauri: bundle.targets no acepta mapa por-OS; macOS requiere el target 'app'

- **Síntoma:** config con `"targets": {"linux": [...], "macOS": [...], "windows": [...]}` falla en
  `tauri build` a los ~2 segundos: `error on bundle > targets ... is not valid under any of the schemas
  listed in the 'anyOf' keyword`. Y con `createUpdaterArtifacts: true` pero `targets` plano sin `"app"`,
  el log de macOS avisa `no updater-enabled targets were built. Please enable one of these targets:
  app, appimage, msi, nsis` y NO genera `.app.tar.gz` ni `.sig` (solo el `.dmg`).
- **Causa:** el schema de `bundle.targets` es `string | string[]` (array plano). Además el bundler
  conserva el `.app` (necesario para el bundle updater de macOS) sólo si `"app"` está en la lista; con
  sólo `"dmg"` el `.app` se empaqueta y se limpia.
- **Solución (2026-09):** array plano `["deb","rpm","appimage","msi","nsis","dmg","app"]`. El bundler
  filtra silenciosamente por OS: macOS arma `dmg` + `app` (y con `createUpdaterArtifacts` genera
  `Arcom.app.tar.gz` + `.sig`), Linux/Windows ignoran los targets ajenos.
- **Verificación:** descargar el job macOS de GitHub Actions y confirmar `bundle/macos/Arcom.app`,
  `Arcom.app.tar.gz` y su `.sig`; el `.dmg` nunca lleva `.sig` (no es target updater-enabled).

## 23. CI/Windows: EBUSY por `prisma generate` concurrentes al mismo output dir

- **Síntoma:** job de build en `windows-latest` falla en `pnpm install` con
  `EBUSY: resource busy or locked, copyfile .../query_engine_bg.<provider>.js ->
  packages/prisma-schema/generated/query_engine_bg.js`. Intermitente (a veces pasa).
- **Causa:** dos workspaces hermanos (ej. `admin-panel` y `marketing-landing`) corren `postinstall` de
  `prisma generate --schema .../schema.prisma` **en paralelo** (pnpm 9) escribiendo al MISMO
  `packages/prisma-schema/generated`. En Linux/macOS el filesystem tolera la escritura concurrente; en
  Windows hay file locking → `EBUSY`. Ninguna app debe generar el client Prisma concurrentemente.
- **Solución (2026-09):** eliminar el `postinstall` redundante de `marketing-landing` (no importa
  `@prisma/client`); el generate queda en `admin-panel` y en el step explícito "Generate Prisma client"
  (`pnpm --filter api exec prisma generate`).
- **Prevención:** un monorepo debe tener UN único `prisma generate` por instalación, nunca dos
  `postinstall` apuntando al mismo `generated/`. Cuidado también con el mismo patrón en `marketing-landing`
  y `admin-panel` en cualquier CI.

## 24. GitHub Actions: trampa de `${VAR:+flag}` con booleanos como strings

- **Síntoma:** TODA release publicada salía como prerelease, aunque el tag fuera `v1.0.0`. El endpoint
  `releases/latest/download/latest.json` del updater devolvía 404 porque GitHub no resuelve `latest`
  con releases prerelease.
- **Causa:** `PRERELEASE=${{ contains(github.ref_name, '-beta') || ... }}` siempre produce la string
  `"false"` o `"true"` (nunca vacía). `${PRERELEASE:+--prerelease}` expande la flag cuando la variable
  NO está vacía → todas las releases llevaban `--prerelease`.
- **Solución (2026-09):** comparación explícita
  `if [ "$PRERELEASE" = "true" ]; then PRERELEASE_FLAG="--prerelease"; fi`. Y recuperar releases ya
  publicadas con `gh release edit <tag> --repo <repo> --prerelease=false`.
- **Prevención:** en GitHub Actions los booleans de expression `${{ ... }}` son strings. Nunca usés
  `${VAR:+flag}` sobre un valor que venga de una expression booleana.

## 25. ESLint: caches de build escaneados + re-exports con react-refresh

- **Síntoma A:** `pnpm lint` local falla con cientos de errores en `apps/marketing-landing/.vercel/` y
  `.astro/` (`no-explicit-any`, `no-empty-object-type`, `triple-slash-reference`, etc.).
- **Causa A:** `.vercel/` y `.astro/` son caches de build que ya están en `.gitignore`, pero la flat
  config `eslint.config.mjs` no los excluía → `eslint .` los escaneaba igual. En CI no aparece porque el
  checkout es limpio; es un problema de DX local.
- **Síntoma B:** `pos-react` fallaba el lint con `react-refresh/only-export-components` pese a usar
  `--max-warnings 0`. Se intentó "re-exportar" helpers (`export { computeLabelStep } from "./utils"`)
  y la regla SIGUE marcando warning: los re-exports de valores cuentan como exports no-componentes.
  El patrón correcto es que los consumers importen del módulo donde vive el helper.
- **Solución (2026-09):** agregar `**/.vercel/**` y `**/.astro/**` a `ignores` de `eslint.config.mjs`;
  mover constantes/funciones puras a `salesChartUtils.ts` e importarlas desde ahí (no re-exportarlas).
- **Prevención:** los ignores de eslint deben cubrir todo lo gitignored por build (`.vercel`, `.astro`,
  `.next`, `dist`); un archivo de componentes sólo debe exportar componentes y sus prop types.

## 26. nx + pnpm: `../../node_modules/.bin/<cmd>` NO existe (bins no hoisted)

- **Síntoma:** `nx run marketing-landing:build|check|preview` falla con
  `/bin/sh: ../../node_modules/.bin/astro: No existe el fichero o el directorio`, aunque
  `pnpm exec astro build` funciona. También `astro build`/`astro check` directos fallan con
  `Parse failure: Expected ',', got 'ident'` si la config tiene un error de sintaxis.
- **Causa:** con `cwd: apps/marketing-landing`, la ruta `../../node_modules/.bin/astro` resuelve al
  `node_modules` de la RAÍZ. pnpm NO hoista los bins de dependencias de un paquete a la raíz de forma
  fiable: `astro` (dependency de marketing-landing) sólo vive en
  `apps/marketing-landing/node_modules/.bin`. Los targets `build`/`preview`/`check` de landing NO
  estaban en CI (`ci.yml`) ni en `root.build`, por eso el bug pasó desapercibido.
- **Solución (2026-09):** los `command` de los targets de `project.json` usan `npx astro build|preview|check`
  (mismo patrón que ya usaba `dev`). Además se reparó una coma faltante en
  `apps/marketing-landing/astro.config.mjs` entre las keys `server` y `vite` que rompía el parse.
- **Prevención:** nunca hardcodear `../../node_modules/.bin/<cmd>` en `project.json`; usar
  `npx <cmd>`/`pnpm exec <cmd>`. Validar cambios de un proyecto no cubierto por CI con sus targets
  explícitos (`pnpm check:landing`, `pnpm exec nx build marketing-landing`).

## 27. pnpm v11: verify-deps flapping con `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`

**Síntoma:** comandos recursivos (`pnpm --filter X ...`, `pnpm run`, `pnpm exec`) fallan
intermitentemente con `[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY]` y stack interno
`runDepsStatusCheck ... pnpm install --production`. Incluso `pnpm exec true` falla.

**Causa raíz:** antes de correr un comando recursivo, pnpm 11 ejecuta un `pnpm install --production`
de reconciliación. En este monorepo el `postinstall` de `apps/admin-panel`
(`prisma generate --schema ../../packages/prisma-schema/prisma/schema.prisma`) depende del CLI de
prisma (devDependency): en modo `--production` ese CLI no está, el postinstall falla y el comando
entrante aborta (o aborta el purge de modules con "no TTY"). El verify además es **auto-dañante**: su
paso prod purga devDeps de admin-panel y degrada el estado hasta que se relinkea.

**Solución estructural (2026-09):** el `postinstall` de admin-panel es ahora
`prisma generate ... || true`. El generate solo es necesario en dev (donde prisma sí está y corre
normal); en prod el exit code 0 deja pasar el verify en vez de abortarlo.

**Mitigaciones (validadas):**
- Antes del build local: `CI=true pnpm install --config.confirm-modules-purge=false`. Esto recarga el
  marker del workspace y deja el verify como no-op (los builds posteriores pasan). En CI de GitHub no
  hay problema: frozen install fresco + `CI=true`.
- Nunca cachear `--production` en el estado local: Si `NODE_ENV` quedó exportado, pnpm fuerza
  `--production` en installs (usar env por comando, no exportar).
- Para ejecutar scripts del proyecto que no requieren verify (p. ej. el pack del sidecar), invocarlos
  **directo con `node`**, no vía `pnpm run`. El `.mjs` calcula `repoRoot` desde `__dirname`, así que
  es inmune al CWD.
- **beforeBuildCommand:** tauri ejecuta el comando con CWD = carpeta del paquete launcher (evidenciado
  en Linux y Windows) y en Windows lo corre con **cmd.exe** (no bash). NO usar `$(git rev-parse ...)`:
  el `$()`/comillas de bash no se expanden en cmd y `node` recibe un path literal
  (`Cannot find module ...\"$(git`). Usar ruta **relativa al CWD del launcher**:
  `node scripts/build-sidecar.mjs`.
- **Windows: `spawnSync pnpm ENOENT` en Node:** `pnpm` en Windows es un shim `.cmd`; `child_process`
  sin `shell: true` no lo ejecuta (tampoco `.bat`/`.cmd`). El `execFileSync("pnpm", [...])` del pack de
  sidecar pasa `{ shell: true }` para que cmd resuelva el shim.

## 28. Windows MSI: pre-release de versión no numérica → `failed to bundle project`

- **Síntoma:** al buildear Windows con una versión pre-release (`1.0.0-beta`), `tauri build`
  falla con `failed to bundle project: optional pre-release identifier in app version must be
  numeric-only and cannot be greater than 65535 for msi target`.
- **Causa:** el target MSI (WiX) no admite identificadores pre-release no numéricos; NSIS,
  AppImage, dmg y tar.gz sí los toleran.
- **Solución (2026-09):** en `release.yml`, si el tag tiene pre-release (`*-*`) y el runner es
  Windows, el build pasa `tauri build --bundles nsis`. Los tags estables siguen produciendo
  `msi + nsis`. El `.msi` simplemente no se incluye en el manifiesto del prerelease
  (generate-latest-json sólo agrega la entrada si el asset existe).
- **Prevención:** localmente, al buildear un prerelease en Windows usar `tauri build --bundles
  nsis`, o versiones numéricas tipo `1.0.0-1`.
