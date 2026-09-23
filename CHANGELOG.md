# Changelog

## [1.0.0-beta.10] - 2026-09-23

### Fixed
- POS cart no longer exceeds available stock: product and variant quantities are clamped to the stock known at add time (in add-to-cart, plus/increment buttons and explicit quantity updates), so a sale can no longer be assembled with more units than are in inventory. Custom items remain unbounded.

### Changed
- OTA updates: `latest.json` is now also published to a stable anchor release in `arcom-releases` so the updater endpoint `/releases/latest/download/latest.json` resolves even though app releases ship as prereleases. In-app updates now work for every beta.

## [1.0.0-beta.9] - 2026-09-23

### Added
- Linked account onboarding: first-run setup wizard now supports looking up and linking active subscription accounts, pre-filling admin email and plan info.
- Dynamic store limits: store creation limits are now evaluated dynamically using `maxStores` from the DB-defined/issued license.
- Desktop header update button: added `UpdateButton` directly to the top header bar and uncoupled app updates from license validation.

## [1.0.0-beta.8] - 2026-09-22

### Fixed
- The launcher now runs SQLite migrations before starting the bundled backend. Previously a clean install (or one whose database was never migrated) booted the sidecar against an empty database: with no `companies` table and therefore no tenant row, every authenticated flow failed with "Sesión expirada" (HTTP 401 "Local workspace not configured") shortly after login. The launcher now fails closed with a clear error instead of starting a backend that cannot serve requests.

## [1.0.0-beta.7] - 2026-09-22

### Added
- Product variant stock support: product variants now own individual stock quantities, and inventory reports aggregate stock and cost across active variants.
- Product container pricing: allowed optional zero top-level product price when variants exist.

### Fixed
- Improved 401 session mint single-flight deduplication to avoid SQLite WAL write contention on concurrent unauthenticated API calls.

## [1.0.0-beta.6] - 2026-09-15

### Fixed
- Fixed modifier key parsing in `useHotkeys` hook by normalizing modifier names to lowercase. Hotkey combinations like `Alt+P` no longer trigger on single un-modified keypresses (such as `p`).
- Fixed Tauri build issues in dev mode by ensuring placeholder bundle resource directories are created in `build.rs`.

## [1.0.0-beta.5] - 2026-09-15

### Fixed
- The desktop app no longer talks to whatever process answers on port 3000.
  The launcher previously reported 3000 (its old default) as the backend port
  until the first start, so a production POS would adopt a foreign process
  squatting on localhost:3000 (e.g. a leftover development backend) and never
  spawn its own isolated sidecar. The process manager now reports port 0 until
  the backend binds a real ephemeral port, the webview CSP allows any
  127.0.0.1/localhost port, and the frontend stops falling back to the fixed
  development port inside the desktop shell.

## [1.0.0-beta.4] - 2026-09-14

### Fixed
- Backend API is now reachable only through a secure local channel: the
  sidecar binds an ephemeral port and shares it to the POS UI over IPC along
  with a 32-byte random token, validated by a global NestJS guard. A foreign
  process that occupies port 3000 before the sidecar can no longer impersonate
  the backend (which previously caused silent login failures / data routing
  against the wrong process).
- The bundled app no longer fails database setup on clean machines: the
  launcher previously resolved the Prisma CLI and schema against build-time
  paths (`CARGO_MANIFEST_DIR`), and the CLI wasn't bundled at all (it was a
  devDependency). `prisma` is now a runtime dependency, the build-sidecar
  reinstalls it standalone (running its postinstall scripts so the native
  engines ship) and strips dev databases/seed from the bundle, and
  `DatabaseManager` runs `prisma migrate deploy` with the bundled Node binary
  against the user data dir.

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
