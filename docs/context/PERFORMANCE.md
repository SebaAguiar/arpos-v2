# Presupuestos de Performance — Arcon Tauri v2

Este documento define targets concretos de performance para Arcon, cómo medirlos y qué regresiones son aceptables o no.

---

## 1. Filosofía de Performance

Arcon debe ser rápido como un POS tradicional: arranque instantáneo, queries ágiles, UI responsiva. La migración a Tauri + React + SQLite debe ser una mejora, no una regresión.

**Principio core:** El usuario nunca debe sentir que la app es lenta. El POS es crítico — cada ms de latencia en una venta impacta la experiencia del cajero.

---

## 2. Startup Performance

### 2.1 Time to First Request (TTFR)

| Escenario | Target | Máximo Aceptable |
|---|---|---|
| Cold start — Tauri window open | <2s | <5s |
| NestJS API ready (health check OK) | <3s | <8s |
| React POS renderizado | <1s | <2s |
| Total: app lista para usar | <5s | <10s |

**Qué se mide:**
- Desde que el usuario hace doble-click en el icono de Arcon hasta que el POS está operativo.
- Incluye: Tauri window init, NestJS spawn, SQLite connect, React render, first API call.

**Cómo medir:**
```bash
# Time Tauri window
time ./arcon-launcher

# Time NestJS health check
time curl http://localhost:3000/api/health

# Time React first render (Chrome DevTools → Performance tab)
```

### 2.2 NestJS Bootstrap Time

| Módulos | Target | Máximo Aceptable |
|---|---|---|
| <10 módulos | <500ms | <1s |
| 10-30 módulos | <1s | <2s |

**Cómo medir:**
```typescript
const start = performance.now();
await NestFactory.create(AppModule);
console.log(`Bootstrap took ${performance.now() - start}ms`);
```

### 2.3 SQLite Connection Time

| Escenario | Target | Máximo Aceptable |
|---|---|---|
| DB nueva (sin datos) | <100ms | <200ms |
| DB existente (<1GB) | <200ms | <500ms |
| WAL mode activation | <50ms | <100ms |

---

## 3. Request Performance

### 3.1 Request Latency (p50/p99)

| Operación | p50 Target | p99 Max |
|---|---|---|
| GET simple (sin DB) | <5ms | <20ms |
| GET con una query SQLite | <10ms | <50ms |
| POST con validación + DB write | <30ms | <150ms |
| POST con auth + validación + DB write | <50ms | <200ms |
| GET /api/health | <5ms | <10ms |

**Qué se mide:**
- Desde que el request llega al router de NestJS hasta que se envía la response.
- Incluye: middleware chain, validación, auth check, handler execution, serialización.

**Cómo medir:**
```typescript
// Middleware de timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 100) {
      logger.warn(`Slow request: ${req.method} ${req.path} — ${duration}ms`);
    }
  });
  next();
});
```

### 3.2 Validation Overhead

| Complejidad Schema | Overhead | Budget |
|---|---|---|
| Simple (3-5 campos) | <0.5ms | <1ms |
| Medium (10-20 campos, nested) | <2ms | <5ms |
| Complex (50+ campos, deep nesting) | <10ms | <20ms |

---

## 4. Memory Usage

### 4.1 RAM Baseline

| Escenario | Target | Máximo Aceptable |
|---|---|---|
| Tauri app abierta, sin DB | <80MB | <120MB |
| App con SQLite connected (idle) | <100MB | <150MB |
| App bajo load (100 ventas simultáneas) | <150MB | <200MB |
| NestJS API process (solo) | <60MB | <100MB |

**Qué se mide:**
- RSS (Resident Set Size) medido con system tools.
- No VSZ (virtual memory), que puede ser engañoso.

**Cómo medir:**
```bash
# Monitor en real-time
pidstat -r -p $(pgrep -f "arcon") 1

# Linux
cat /proc/$(pgrep -f arcon)/status | grep VmRSS

# macOS
vmmap <PID> | grep "Physical footprint"
```

### 4.2 Memory Leak Detection

Correr la app bajo carga sostenida y monitorear:
```bash
# Simular 1000 ventas
for i in {1..1000}; do curl -X POST http://localhost:3000/api/sales -d '{...}'; done

# Verificar memoria antes y después
# Si la memoria no vuelve al baseline, hay leak
```

---

## 5. Database Performance

### 5.1 Query Latency

| Tipo de Query | Target | Máximo Aceptable |
|---|---|---|
| Single row lookup by PK | <2ms | <5ms |
| Simple list (10 rows) | <5ms | <15ms |
| Complex join (3+ tables) | <15ms | <50ms |
| Write (single row insert) | <5ms | <15ms |
| Transaction (3+ operations) | <20ms | <50ms |
| Batch insert (1000 rows) | <500ms | <1s |

**Cómo medir:**
```typescript
const start = performance.now();
const result = await prisma.product.findMany({ where: { companyId } });
logger.debug(`Query took ${performance.now() - start}ms`);
```

### 5.2 SQLite WAL Performance

| Métrica | Saludable | Warning | Crítico |
|---|---|---|---|
| WAL file size | <10MB | >50MB | >100MB |
| Checkpoint lag | <1s | >5s | >30s |
| Concurrent readers | <50 | >100 | >200 |

### 5.3 Índices Requeridos

```sql
-- Queries frecuentes del POS
CREATE INDEX idx_products_company_store ON products(companyId, storeId);
CREATE INDEX idx_products_code ON products(companyId, storeId, code);
CREATE INDEX idx_sales_company_store ON sales(companyId, storeId);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(saleId);
CREATE INDEX idx_inventory_product ON inventory(productId, storeId);
CREATE INDEX idx_sync_queue_status ON sync_queue(status, created_at);
```

---

## 6. Build Performance

### 6.1 Compilation Time

| Build Type | Target | Máximo Aceptable |
|---|---|---|
| `pnpm build` (NestJS API) | <10s | <20s |
| `pnpm build` (React POS) | <15s | <30s |
| `pnpm build` (Tauri) | <60s | <120s |
| `pnpm install` (fresh) | <30s | <60s |
| CI pipeline (test + lint + build) | <2min | <5min |

### 6.2 Tauri Build Size

| Componente | Target | Máximo Aceptable |
|---|---|---|
| Tauri binary | <10MB | <20MB |
| React bundle (gzipped) | <200KB | <400KB |
| Total installer (Windows) | <80MB | <120MB |
| Total installer (macOS) | <90MB | <130MB |
| Total installer (Linux) | <75MB | <110MB |

---

## 7. Distribución Performance

### 7.1 Auto-updater

| Métrica | Target | Máximo Aceptable |
|---|---|---|
| Check for updates | <2s | <5s |
| Download update | <30s (50MB) | <60s |
| Apply update + restart | <5s | <10s |

### 7.2 Migration Wizard

| Escenario | Target | Máximo Aceptable |
|---|---|---|
| Descarga 10K productos | <10s | <30s |
| Descarga 100K ventas | <30s | <60s |
| Full migration (500K rows) | <2min | <5min |
| Validación post-migración | <5s | <15s |

---

## 8. Prevención de Regresiones

### 8.1 Checklist Pre-Commit

Antes de pushear code que toca paths críticos de performance:

- [ ] Benchmark de las rutas afectadas antes y después del cambio
- [ ] Verificar que el query count por request no haya incrementado
- [ ] Verificar que el uso de memoria es estable (±5MB)
- [ ] No hay operaciones síncronas en handlers async
- [ ] No se introdujeron N+1 queries

### 8.2 Template de Performance Audit

Al agregar una feature, documentar el impacto esperado:

```markdown
## Performance Impact

### Request Latency
- Before: 15ms (p50), 60ms (p99)
- After: 18ms (p50), 70ms (p99)
- Δ: +3ms (+20%)
- Acceptable? YES (new validation middleware)

### Memory
- Before: 100MB baseline
- After: 105MB baseline
- Δ: +5MB (new provider in DI container)
- Acceptable? YES

### Startup
- Before: 4s
- After: 4.5s
- Δ: +500ms (+12%)
- Acceptable? YES (within 5s budget)
```

---

## 9. Performance Budgets por Capa

| Capa | Startup Overhead | Request Overhead | Memory |
|---|---|---|---|
| Tauri (Rust) | <500ms | N/A | <20MB |
| NestJS API | <1s | <0.5ms | <60MB |
| Prisma + SQLite | <200ms | <0.5ms | <30MB |
| React POS | <1s (render) | N/A | <40MB |
| Zustand stores | <10ms | <0.1ms | <5MB |
| Shadcn/ui components | <100ms (lazy) | <1ms | <10MB |
