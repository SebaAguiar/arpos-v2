# Flujo de Trabajo — ArPOS Tauri v2

Este documento describe los pasos para implementar cambios, la checklist de Definition of Done (DoD) y el proceso de build/deploy de ArPOS.

---

## 1. Pasos para Implementar un Cambio

1. **Verificar estado del sandbox:** Correr `git status` y `git diff` antes de editar para asegurar que no hay cambios inesperados.

2. **Definir contracts primero:** Si se agrega un nuevo endpoint de API, escribir los schemas Zod primero. Los contracts definen request (body, query, params) y response (status codes + shapes).

3. **Module wiring (NestJS):**
   - Agregar el módulo nuevo al paquete o app apropiada.
   - Declarar `controllers`, `providers` y `exports` explícitamente.
   - Importar módulos dependientes.

4. **Service implementation:**
   - Agregar business logic en un service class decorated con `@Injectable()`.
   - Inyectar dependencias via constructor.
   - Mantener controllers thin — solo parsean input, llaman services, retornan responses.

5. **Controller & Routes:**
   - Agregar controller decorated con `@Controller('/path')`.
   - Usar `@Get()`, `@Post()`, `@Put()`, `@Delete()` para route handlers.
   - Aplicar `@Contract()` para validación.

6. **React Components (si aplica):**
   - Crear componentes en `apps/pos-react/src/components/`.
   - Usar Shadcn/ui como base.
   - Conectar a Zustand stores para state.

7. **Database Migrations (si aplica):**
   - Generar migración con `npx prisma migrate dev`.
   - Revisar el SQL generado antes de aplicar.
   - Correr `npx prisma migrate deploy` para producir.

8. **Tests:** Correr la suite de tests:
   ```bash
   # Backend
   pnpm test

   # Frontend
   pnpm test --filter pos-react

   # Con coverage
   pnpm test --coverage
   ```

9. **Verificación local:** Correr la app y testear el endpoint:
   ```bash
   pnpm dev
   curl http://localhost:3000/api/health
   ```

10. **Regenerar OpenAPI (si contracts cambiaron):**
    ```bash
    pnpm nx run api:generate-openapi
    ```

---

## 2. Definition of Done (DoD) Checklist

- [ ] Contracts definidos con Zod schemas (request body, query, params, response).
- [ ] Todos los inputs validados through contract middleware (sin validación manual en handlers).
- [ ] Auth middleware aplicado a rutas protegidas.
- [ ] Sin `any` types en source files — todos los types son explícitos.
- [ ] Services son inyectables y testeables en aislamiento.
- [ ] Database migrations generadas (si schema cambió).
- [ ] Tests pasan para el paquete afectado.
- [ ] App compila sin errores de TypeScript.
- [ ] Commit message en inglés siguiendo Conventional Commits.
- [ ] No hay console.log en código de producción.

---

## 3. Build / Deploy Phase

### 3.1 Building Packages

```bash
# Build all
pnpm build

# Build específico
pnpm nx build api
pnpm nx build pos-react

# Watch mode (desarrollo)
pnpm nx serve api
pnpm nx serve pos-react
```

### 3.2 Building Tauri

```bash
# Development
pnpm nx serve arpos-launcher

# Production (genera instalador)
pnpm nx build arpos-launcher

# Output:
# apps/arpos-launcher/src-tauri/target/release/bundle/
#   ├── windows/
#   │   └── nsis/ArPOS_1.0.0_x64-setup.exe
#   ├── macos/
#   │   └── dmg/ArPOS_1.0.0_aarch64.dmg
#   └── linux/
#       └── appimage/ArPOS_1.0.0_amd64.AppImage
```

### 3.3 Publishing

```bash
# 1. Update version
pnpm version patch  # or minor, major

# 2. Update CHANGELOG.md

# 3. Commit and tag
git add .
git commit -m "chore: release v1.0.0"
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Push
git push origin main --tags

# 5. Build y upload artifacts
# (Automatizado via GitHub Actions)
```

### 3.4 Release Checklist

- [ ] Todos los tests pasan
- [ ] Todos los packages compilan exitosamente
- [ ] Changelog actualizado
- [ ] Version bump en todos los package.json
- [ ] Tags pusheados a GitHub
- [ ] Installers generados para Windows, macOS, Linux
- [ ] GitHub Release creado con artifacts

---

## 4. CI/CD Pipeline (GitHub Actions)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx run-many -t lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx run-many -t test

  build:
    needs: [lint, test]
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx build arpos-launcher
      - uses: actions/upload-artifact@v3
        with:
          name: arpos-${{ matrix.os }}
          path: apps/arpos-launcher/src-tauri/target/release/bundle/
```
