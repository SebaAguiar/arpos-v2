# Changelog

## [1.0.0] - 2026-08-01

### Changed
- Rebranded the entire product from "ArPOS" to "Arcom" (desktop app, identifiers, package names, data directories, docs). The GitHub repository `SebaAguiar/arpos-v2` keeps its name.
- Package scope changed from `@arpos/*` to `@arcom/*`; launcher directory renamed `apps/arpos-launcher` → `apps/arcom-launcher`.
- Desktop identifier changed to `com.arcom.desktop`; product name now "Arcom".

## [0.1.0] - 2026-07-31

### Added
- POS desktop app with Tauri v2 shell (Windows, macOS, Linux)
- NestJS backend sidecar with embedded SQLite (Prisma 5)
- Product catalog with variants (size, color) and pricing
- Sales flow with cart, payment methods, and cash register
- Customer management with wallet balance and contacts
- Purchase order management with receiving workflow
- Multi-store inventory with stock movements and adjustments
- Daily/weekly/monthly reports (sales, inventory, cash)
- Cash register with opening/closing and cash movements
- Company/store/users settings with roles
- Cloud sync via sync queue (offline-first, last-write-wins)
- Setup wizard endpoints (`GET /api/setup/status`, `POST /api/setup/init-company`)
- v1 to v2 data migration via `POST /api/migration/import` (MigrationModule, 409 guard, batches of 500)
- Auto-updater via Tauri plugin (GitHub Releases, signed `.sig` bundles)
- Lazy-loaded routes with chunk splitting
- User guide (`docs/user/GUIDE.md`)

### Technical
- Monorepo with pnpm workspaces and NX
- Strict TypeScript (`strict: true`, no `any`), Zod contracts, contract-first NestJS
- Repository pattern on both backend (TenantBaseEntity) and frontend (Service → Repository → Store)
- Multi-platform signed bundles: deb, rpm, appimage, msi, nsis, dmg
- 330+ API tests with Jest (SQLite in-memory integration specs)
- 30+ frontend tests with Vitest
- End-to-end testing with Playwright
- CI pipeline: lint + typecheck + tests + Rust build validation per PR
