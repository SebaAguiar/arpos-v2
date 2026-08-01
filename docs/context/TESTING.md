# Estrategia de Testing — Arcon Tauri v2

Este documento define cómo escribir y estructurar tests en Arcon, incluyendo unit tests, integration tests y E2E tests.

---

## 1. Filosofía de Testing

- **Testear el contract, no la implementación.** Los tests deben validar que inputs producen outputs esperados y estados de error, no que el código lo hace "de la manera correcta".
- **Aislamiento es obligatorio.** Ningún test debe depender del estado de otro. Cada test crea su propia instancia de DI y base de datos.
- **Type safety en tests.** Sin `any` en código de test tampoco. Los tests son parte de la especificación.
- **Coverage targets:** Mínimo 80% para business logic (services, middleware). 70% para componentes críticos de React. 60% para comandos Rust.

---

## 2. Setup de Test Runners

### Backend (NestJS + Jest)

```typescript
// jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
};
```

```bash
# Run tests
pnpm test

# Con coverage
pnpm test --coverage

# Watch mode
pnpm test --watch

# Specific file
pnpm test -- --testPathPattern=sales.service.spec.ts
```

### Frontend (React + Vitest)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
});
```

```bash
# Run tests
pnpm test --filter pos-react

# Con coverage
pnpm test --filter pos-react -- --coverage

# Watch mode
pnpm test --filter pos-react -- --watch
```

### E2E (Playwright)

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

```bash
# Run E2E tests
pnpm test:e2e --filter pos-e2e

# With UI
pnpm test:e2e --filter pos-e2e -- --ui
```

---

## 3. Backend / Package Testing (NestJS)

### 3.1 Unit Tests — Ubicación y Estructura

Los tests viven junto al source en `__tests__/` directories:

```
libs/api/sales/src/
├── sales.service.ts
├── sales.controller.ts
├── __tests__/
│   ├── sales.service.spec.ts
│   └── sales.controller.spec.ts
```

### 3.2 Testing Services

```typescript
// libs/api/sales/src/__tests__/sales.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from '../sales.service';
import { PrismaService } from '@arcon/prisma';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: PrismaService,
          useValue: {
            sale: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a sale with items', async () => {
    const mockSale = {
      id: 'sale-1',
      total_cents: 2000,
      items: [{ productId: 'prod-1', quantity: 2, pricePerUnit: 1000 }],
    };
    jest.spyOn(prisma.sale, 'create').mockResolvedValue(mockSale);

    const result = await service.createSale('company-1', 'store-1', {
      items: [{ productId: 'prod-1', quantity: 2, pricePerUnit: 1000 }],
      paymentMethod: 'cash',
    });

    expect(result.total_cents).toBe(2000);
    expect(prisma.sale.create).toHaveBeenCalled();
  });

  it('should reject empty cart', async () => {
    await expect(
      service.createSale('company-1', 'store-1', {
        items: [],
        paymentMethod: 'cash',
      })
    ).rejects.toThrow('Cart is empty');
  });
});
```

### 3.3 Testing Contracts (Zod)

```typescript
// libs/api/common/src/__tests__/validators.spec.ts
import { z } from 'zod';

describe('Sale Contract Validation', () => {
  const SaleSchema = z.object({
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      pricePerUnit: z.number().positive(),
    })).min(1),
    paymentMethod: z.enum(['cash', 'card', 'check', 'mixed']),
  });

  it('should validate a correct sale', () => {
    const result = SaleSchema.safeParse({
      items: [{ productId: '1', quantity: 2, pricePerUnit: 1000 }],
      paymentMethod: 'cash',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty items', () => {
    const result = SaleSchema.safeParse({
      items: [],
      paymentMethod: 'cash',
    });
    expect(result.success).toBe(false);
  });
});
```

### 3.4 Testing Database Operations (SQLite In-Memory)

```typescript
// libs/api/sales/src/__tests__/sales.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@arcon/prisma';
import { execSync } from 'child_process';

describe('SalesRepository (SQLite)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'file::memory:';
    prisma = new PrismaService();
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL');
    execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: 'file::memory:' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should insert and retrieve a sale', async () => {
    const sale = await prisma.sale.create({
      data: {
        companyId: 'company-1',
        storeId: 'store-1',
        cashRegisterId: 'cr-1',
        userId: 'user-1',
        total_cents: 2000,
        paymentMethod: 'cash',
        status: 'completed',
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    });

    expect(sale).toBeDefined();
    expect(sale.total_cents).toBe(2000);
  });
});
```

---

## 4. Frontend Testing (React + Vitest)

### 4.1 Testing Components

```typescript
// apps/pos-react/src/__tests__/components/pos/Cart.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Cart } from '../../../components/pos/Cart';
import { useSalesStore } from '../../../store/sales.store';

describe('Cart Component', () => {
  beforeEach(() => {
    useSalesStore.getState().clear();
  });

  it('should display empty cart message', () => {
    render(<Cart />);
    expect(screen.getByText(/carrito vacío/i)).toBeInTheDocument();
  });

  it('should add item to cart', () => {
    const { addItem } = useSalesStore.getState();
    addItem({ productId: '1', quantity: 2, pricePerUnit: 1000 });

    render(<Cart />);
    expect(screen.getByText(/2 artículo/i)).toBeInTheDocument();
  });

  it('should calculate total correctly', () => {
    const { addItem, total } = useSalesStore.getState();
    addItem({ productId: '1', quantity: 2, pricePerUnit: 1000 });

    expect(total).toBe(2000);
  });

  it('should remove item from cart', () => {
    const { addItem, removeItem, items } = useSalesStore.getState();
    addItem({ productId: '1', quantity: 1, pricePerUnit: 1000 });
    removeItem('1');

    expect(items).toHaveLength(0);
  });
});
```

### 4.2 Testing Stores (Zustand)

```typescript
// apps/pos-react/src/__tests__/store/sales.store.test.ts
import { useSalesStore } from '../../store/sales.store';

describe('SalesStore', () => {
  beforeEach(() => {
    useSalesStore.getState().clear();
  });

  it('should add item and update total', () => {
    const { addItem } = useSalesStore.getState();
    addItem({ productId: '1', quantity: 3, pricePerUnit: 500 });

    const { items, total } = useSalesStore.getState();
    expect(items).toHaveLength(1);
    expect(total).toBe(1500);
  });

  it('should clear cart after checkout', async () => {
    const { addItem, checkout } = useSalesStore.getState();
    addItem({ productId: '1', quantity: 1, pricePerUnit: 1000 });

    await checkout('cash');

    const { items, total } = useSalesStore.getState();
    expect(items).toHaveLength(0);
    expect(total).toBe(0);
  });
});
```

### 4.3 Testing Hooks

```typescript
// apps/pos-react/src/__tests__/hooks/useApi.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';

describe('useApi', () => {
  it('should fetch data on mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', name: 'Product 1' }]),
    });

    const { result } = renderHook(() => useApi('/api/products'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });
});
```

---

## 5. E2E Testing (Playwright)

### 5.1 Testing POS Workflow

```typescript
// apps/pos-e2e/src/pos.spec.ts
import { test, expect } from '@playwright/test';

test.describe('POS Workflow', () => {
  test('complete sale from start to receipt', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('button:has-text("Iniciar sesión")');

    // 2. Wait for POS to load
    await page.waitForURL('**/pos');

    // 3. Search product
    await page.fill('[data-testid=search]', 'Producto 1');
    await page.waitForSelector('[data-testid=product-card]');

    // 4. Add to cart
    await page.click('[data-testid=product-card] >> first');
    await expect(page.locator('[data-testid=cart-count]')).toContainText('1');

    // 5. Checkout
    await page.click('button:has-text("Cobrar")');
    await page.selectOption('[data-testid=payment-method]', 'cash');
    await page.click('button:has-text("Confirmar")');

    // 6. Verify receipt
    await expect(page.locator('[data-testid=receipt-number]')).toBeVisible();
  });

  test('should work offline', async ({ page }) => {
    await page.context().setOffline(true);
    await page.goto('/pos');

    await expect(page.locator('[data-testid=offline-indicator]')).toBeVisible();

    await page.click('[data-testid=product-card] >> first');
    await expect(page.locator('[data-testid=cart-count]')).toContainText('1');
  });
});
```

---

## 6. Coverage Targets

### 6.1 Cobertura Mínima por Paquete

| Paquete | Cobertura Mínima |
|---------|-----------------|
| `libs/api/sales/` | 85% |
| `libs/api/products/` | 80% |
| `libs/api/inventory/` | 80% |
| `libs/api/contacts/` | 80% |
| `libs/api/cash-register/` | 80% |
| `libs/api/common/` | 85% |
| `apps/pos-react/` | 70% |
| `apps/arcon-launcher/` | 60% |

### 6.2 Ejecutar Coverage

```bash
# Backend
pnpm test --coverage

# Frontend
pnpm test --filter pos-react -- --coverage

# E2E
pnpm test:e2e --coverage
```

---

## 7. Organización de Tests

```
libs/api/<name>/src/
├── services/
│   ├── sales.service.ts
│   └── __tests__/
│       └── sales.service.spec.ts
├── __tests__/
│   ├── integration.spec.ts
│   └── setup.ts

apps/pos-react/src/
├── __tests__/
│   ├── components/
│   │   └── pos/
│   │       └── Cart.test.tsx
│   ├── hooks/
│   │   └── useApi.test.ts
│   ├── store/
│   │   └── sales.store.test.ts
│   └── setup.ts

apps/pos-e2e/src/
├── pos.spec.ts
├── inventory.spec.ts
└── settings.spec.ts
```

---

## 8. Errores Comunes de Testing

| Error | Problema | Solución |
|-------|----------|----------|
| Testing implementation | Tests se rompen en refactor | Testear el contract: inputs → outputs → errors |
| Estado compartido entre tests | Tests no son aislados | Usar `beforeEach` para resetear stores/db |
| No testear error paths | Solo happy path cubierto | Testear cada validation error y service exception |
| Usar `any` en test code | Se pierde type safety | Escribir tipos completos, matchear mensajes de error |
| DB URLs hardcodeadas | Tests fallan en diferentes máquinas | Usar variable de entorno `DATABASE_URL` |
| Mockear demasiado | Tests pasan pero la app falla | Preferir integration tests sobre mocks |
