# Changelog

## [1.0.0-beta.3] - 2026-09-14

### Fixed
- POS no longer locks out free-tier/local users with "Sesión expirada" once
  their auth_token expires: the api-client now re-mints a local identity
  session from the persisted login email (falling back after the license
  bridge), transparently retrying the request once.
- Profile menu "Configuración" now navigates to `/settings`. The dead
  "Mi cuenta" item was removed since no profile route exists.

## [1.0.0-beta.2] - 2026-09-13

### Fixed
- Launcher no longer crashes with "resource path ... doesn't exist" (exit 101)
  after an install: the bundled runtime's `.bin` dirs (absolute symlinks into
  the pnpm staging dir, left dangling after the move) are now pruned before
  bundling.
- POS login no longer blocks entry when the license service rejects the email
  (e.g. no cloud/admin reachable at :3001, or 4xx from the license endpoint):
  a hard identity rejection now degrades to a local free-tier session while
  keeping paid/cloud gates closed.

## [1.0.0-beta] - 2026-09-12

### Added
- Self-contained installer: the NestJS backend sidecar and a portable Node 20 runtime
  are bundled as installer resources, so the app runs on machines with no Node.js
  installed and no cloned repository.

### Changed
- Installed app resolves the runtime from its own install dir instead of the repo.

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
