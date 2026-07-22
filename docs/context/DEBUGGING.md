# Guía de Debugging — ArPOS Tauri v2

Este documento cubre cómo investigar y resolver bugs en ArPOS, incluyendo dónde están los logs, cómo hacer profiling y referencia de patrones de error comunes.

---

## 1. Primeros Pasos con Debugging

### 1.1 Modo Desarrollo

```bash
# Backend (NestJS)
pnpm dev --filter api

# Frontend (React)
pnpm dev --filter pos-react

# Tauri (con dev server)
pnpm dev --filter arpos-launcher
```

### 1.2 Debug con Chrome DevTools

React y NestJS se debuggean desde Chrome:

```bash
# NestJS con inspector
node --inspect dist/apps/api/main.js

# React (Vite ya tiene HMR, usar React DevTools)
```

Abrir `chrome://inspect` o usar VS Code's "Attach to Process".

### 1.3 Debug con Tauri

```bash
# Rust debugger (VS Code + rust-analyzer)
# Abrir apps/arpos-launcher/src-tauri/ en VS Code
# Usar launch.json con "type": "lldb"
```

---

## 2. Logs y Dónde Encontrarlos

### 2.1 Logs de la Aplicación

ArPOS usa un logger inyectado por DI. Los logs van a stdout y a archivos:

```bash
# Desarrollo — todos los logs a consola
pnpm dev

# Con filtro de nivel
LOG_LEVEL=debug pnpm dev

# Niveles disponibles: error, warn, info, debug, trace
```

### 2.2 Logs de Archivo

```
~/.arpos/logs/
├── app.log          # Logs de la aplicación React
├── api.log          # Logs de NestJS
├── tauri.log        # Logs de Tauri/Rust
└── sync.log         # Logs de sincronización
```

### 2.3 Logs de HTTP Request

NestJS middleware loggea todos los requests automáticamente:

```
[2026-07-16T10:30:00Z] GET /api/products 200 42ms
[2026-07-16T10:30:01Z] POST /api/sales 201 120ms
[2026-07-16T10:30:05Z] GET /api/sales/abc 404 5ms
```

### 2.4 Logs de Prisma

Habilitar logging de queries:

```typescript
// prisma.service.ts
const prisma = new PrismaService({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query} — ${e.duration}ms`);
});
```

### 2.5 Logs de SQLite

```bash
# Verificar WAL mode
sqlite3 ~/.arpos/data/app.db "PRAGMA journal_mode;"

# Ver stats de la DB
sqlite3 ~/.arpos/data/app.db "PRAGMA stats;"

# Ver tablas
sqlite3 ~/.arpos/data/app.db ".tables"
```

---

## 3. Patrones de Error Comunes y Soluciones

### 3.1 "Provider not found" o "Cannot resolve dependency"

**Síntoma:** La app crashea al iniciar con un error de DI resolution.

**Causas probables:**
1. Provider no declarado en el array `providers` del módulo
2. Provider no exportado y el consumidor no importa el módulo
3. Dependencia circular entre módulos

**Pasos de debug:**
1. Verificar el módulo donde se consume el provider — ¿está en `imports`?
2. Verificar el módulo donde se define el provider — ¿está en `exports`?
3. Habilitar logging verbose de DI:
```bash
NESTJS_DEBUG_DI=true pnpm dev
```

**Soluciones:**
- Agregar el provider faltante al array `providers`
- Agregar `exports: [TokenOrService]` al módulo que lo define
- Importar el módulo en el módulo que lo consume

### 3.2 Contract Validation Errors

**Síntoma:** Requests fallan con 400 y error de validación, pero el input parece correcto.

**Check:**
1. ¿El schema Zod coincide con la forma real del request?
2. ¿Estás usando el Pipe correcto para validación?
3. ¿El decorador `@UseGuards()` está aplicado al handler?

```typescript
// ✅ Correcto — NestJS Pipes validan automáticamente
@Post('/')
@UseGuards(AuthGuard)
create(@Body(CreateSaleDto) dto: CreateSaleDto) {
  // dto está tipado y validado
}

// ❌ Wrong — los datos no han sido validados
@Post('/')
async create(@Body() body: any) {
  // body no está validado
}
```

### 3.3 Database Connection Errors

**Síntoma:** "Connection refused" o "Cannot connect to database"

**Check:**
1. ¿La DB está corriendo? (SQLite no necesita servidor, verificar que el archivo exista)
```bash
ls -la ~/.arpos/data/app.db
```

2. ¿La URL de conexión es correcta en `.env`?
```
DATABASE_URL=file:~/.arpos/data/app.db
```

3. ¿Prisma puede conectarse?
```bash
npx prisma db push
```

### 3.4 Authentication Errors

**Síntoma:** Login falla o JWT es rechazado.

**Pasos de debug:**
1. Verificar JWT secret — ¿el que verifica usa el mismo secret?
2. Verificar expiración del token — ¿el token sigue siendo válido?
3. Habilitar auth logging:
```bash
NESTJS_DEBUG_AUTH=true pnpm dev
```

**Problemas comunes:**
- Falta variable de entorno `JWT_SECRET` (cae en default `'dev-secret'`)
- Mismatch en OAuth redirect URI
- State parameter mismatch en OAuth flow

### 3.5 SQLite WAL Mode Issues

**Síntoma:** "database is locked" o errores de concurrencia.

**Causa:** SQLite en WAL mode permite lecturas concurrentes, pero las escrituras son excluyentes.

**Solución:**
```typescript
// Aumentar timeout de WAL
await prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000');
```

### 3.6 Tauri Process Manager Issues

**Síntoma:** NestJS no inicia o se cae después de un tiempo.

**Check:**
1. ¿Node.js está instalado y en PATH?
```bash
node --version  # Debe ser >= 20
```

2. ¿El puerto 3000 está libre?
```bash
lsof -i :3000
```

3. Verificar logs de Tauri:
```bash
cat ~/.arpos/logs/tauri.log
```

### 3.7 Offline Sync Conflicts

**Síntoma:** Datos duplicados o perdidos después de sincronizar.

**Causa:** Conflictos entre cambios locales y remotos no resueltos correctamente.

**Check:**
1. Verificar cola de sync:
```bash
sqlite3 ~/.arpos/data/app.db "SELECT * FROM sync_queue WHERE status='pending';"
```

2. Verificar logs de sync:
```bash
cat ~/.arpos/logs/sync.log
```

3. Forzar resolución manual:
```bash
# Reintentar sync fallida
curl -X POST http://localhost:3000/api/sync/retry
```

---

## 4. Profiling

### 4.1 CPU Profiling (NestJS)

```bash
# Node.js profiler
node --prof dist/apps/api/main.js
# Genera isolate-*.log — procesar con:
node --prof-process isolate-*.log > processed.txt
```

### 4.2 Memory Profiling (React)

```bash
# Chrome DevTools → Memory tab → Take heap snapshot
# Tomar snapshot antes y después de operaciones repetidas
# Comparar para encontrar objetos retenidos
```

### 4.3 Database Query Performance

Habilitar logging de queries en Prisma:
```typescript
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

Usar `EXPLAIN QUERY PLAN` para queries lentas:
```typescript
const result = await prisma.$queryRaw`
  EXPLAIN QUERY PLAN SELECT * FROM products WHERE companyId = ${companyId}
`;
```

---

## 5. Debugging con VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS API",
      "program": "${workspaceFolder}/apps/api/src/main.ts",
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "env": {
        "DATABASE_URL": "file::memory:",
        "NODE_ENV": "development"
      }
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug React POS",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/pos-react/src"
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Debug Tauri Rust",
      "cargo": {
        "args": ["build", "--manifest-path=${workspaceFolder}/apps/arpos-launcher/src-tauri/Cargo.toml"],
        "filter": { "name": "arpos-launcher", "kind": "bin" }
      }
    }
  ]
}
```

---

## 6. Usando `console.log` y `debugger`

### 6.1 Debugging Rápido

```typescript
// Print con referencia file:line
console.log('[SalesService] Creating sale:', input);

// Inspect objeto completo
console.dir(sale, { depth: null });

// Parar ejecución (solo cuando DevTools está adjunto)
debugger;
```

### 6.2 Debug Logging Condicional

```typescript
const DEBUG = process.env.DEBUG === 'true';

function createSale(input: CreateSaleInput) {
  if (DEBUG) console.log('[DEBUG] createSale input:', input);
  // ...
}
```

---

## 7. Referencia: Mensajes de Error Comunes

| Error | Significado | Acción |
|-------|-------------|--------|
| `Provider not found: Symbol(DATABASE_CLIENT)` | DI token no registrado | Agregar provider al módulo o importar el módulo que lo exporta |
| `Validation failed: body.items` | Schema Zod rechazó el input | Verificar schema vs request body |
| `database is locked` | SQLite concurrente | Aumentar busy_timeout o reducir writes |
| `JWT_EXPIRED` | Token expirado | Refrescar token o re-autenticar |
| `UNAUTHORIZED` | Auth faltante o inválida | Verificar header Authorization y formato del token |
| `Cannot bootstrap module` | Error en module graph | Verificar imports/exports por circular o missing deps |
| `ENOENT: no such file` | Archivo no encontrado | Verificar path, crear directorios si es necesario |
| `ECONNREFUSED` | API NestJS no responde | Verificar que NestJS esté corriendo en :3000 |

---

## 8. Dónde Mirar Primero

| Síntoma | Mirar Primero |
|---------|---------------|
| App crashea al iniciar | `NESTJS_DEBUG_DI=true` — verificar module graph |
| Request retorna 400 | Verificar contract schema — ¿campos requeridos presentes? |
| Request retorna 401/403 | Verificar header Authorization y JWT |
| Operaciones de DB fallan | ¿SQLite accessible? ¿Path correcto? |
| Sync no funciona | Verificar `~/.arpos/logs/sync.log` |
| POS lento | Habilitar query logging — buscar N+1 queries |
| Tauri no compila | Verificar Rust toolchain: `rustc --version` |
| Memoria crece | Heap snapshot comparison — buscar event listeners detachados |
