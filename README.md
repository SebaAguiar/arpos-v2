# Arcom POS — Tauri v2

Local-first, offline-first desktop point-of-sale (POS) for Argentinian commerce. Built with **Tauri 2** (Rust shell) + **React 19** (frontend) + **NestJS 11** (local sidecar backend) + **SQLite** (embedded database) + **Zustand** (state), with optional cloud sync and **ARCA/AFIP** electronic invoicing.

> v1.0.0 — the POS is feature-complete; public launch is in progress. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the migration and launch plan.

---

## Architecture at a glance

This is a **pnpm + Nx monorepo** with five runnable apps sharing typed contracts and a Prisma store.

| App | Path | Tech | Role |
|---|---|---|---|
| **Launcher (desktop)** | `apps/arcom-launcher/` | Tauri 2 + Rust | Desktop shell; spawns/manages the NestJS sidecar process; SQLite init; auto-updater |
| **POS API (sidecar)** | `apps/api/` | NestJS 11 + Prisma | Local HTTP backend, offline-first, multi-tenant strict |
| **POS React (frontend)** | `apps/pos-react/` | React 19 + Zustand | POS UI: sales, products, inventory, reports, cash register, settings |
| **Admin panel** | `apps/admin-panel/` | NestJS + Prisma | Cloud-side commerce admin (subscriptions, data) |
| **Marketing landing** | `apps/marketing-landing/` | Astro 5 | Public site `arcom.com.ar`: pricing, downloads, support, legal |
| **Contracts** | `packages/contracts/` | Zod | Shared validation/DTO contracts, type-safe end to end |
| **Common** | `packages/common/` | TS | Shared utilities and global types |

**Philosophy:** local-first (your data lives on your device), offline-first (the POS never depends on connectivity), type-safe end-to-end (Prisma → Zod contracts → React), zero-config, and strict multi-tenancy (every query is scoped by `companyId`).

---

## Prerequisites

- **Node.js 20 LTS** (required by NestJS)
- **pnpm** `11.11.0`
- **Rust** stable toolchain (for the Tauri desktop app)
- System deps for Tauri (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

```bash
# install JS dependencies
pnpm install

# generate Prisma client
pnpm prisma:generate
```

---

## Development

Dev commands use **Nx** to run the relevant app with watch mode:

```bash
pnpm dev:pos         # run the React POS frontend (Vite, port 1420)
pnpm dev:api         # run the NestJS sidecar (local API)
pnpm dev:admin       # run the admin panel
pnpm dev:launcher    # run the Tauri desktop shell
pnpm dev:landing     # run the marketing landing (Astro)
pnpm dev:all         # run landing + admin-panel + Tauri together (no port conflicts)
pnpm dev             # run everything concurrently
```

> The desktop app expects the NestJS sidecar to be running. In real usage the Tauri launcher spawns it automatically; during development start it with `pnpm dev:api`.

### Port map

Each app binds its own port so they can all run simultaneously:

| Service | Port | Notes |
|---|---|---|
| NestJS local API (`apps/api`) | **3000** | Sidecar the Tauri launcher spawns; POS reads local data here. Fixed by the launcher (Rust) and CSP, do not change. |
| Admin panel (`apps/admin-panel`) | **3001** | Cloud/backend (license verify). Pointer from `apps/pos-react/src/services/cloud-client.ts`. |
| React POS (Vite, `apps/pos-react`) | **1420** | Tauri dev server (`devUrl`) and Playwright base URL. |
| Landing (`apps/marketing-landing`) | **4321** | Astro dev server. |

Change these overrides with the respective env vars: `VITE_API_BASE` (local API), `VITE_CLOUD_API_BASE` (cloud/admin panel).

---

## Building

```bash
pnpm build           # build API + admin + POS React + launcher
pnpm build:api       # build only the NestJS API
pnpm build:pos       # build only the React POS
pnpm build:launcher  # build the Tauri binary
pnpm build:landing   # build the marketing landing (prerendered static + serverless routes)

# verification
pnpm lint            # ESLint across all apps (zero-warning policy)
pnpm typecheck       # TypeScript strict type-check across all apps
pnpm check:landing   # astro check on the landing
```

Build-size notes and performance budgets: [`docs/context/PERFORMANCE.md`](docs/context/PERFORMANCE.md).

---

## Database & Prisma

The POS uses **SQLite** (embedded) via Prisma. Migrations live in `apps/api/prisma/migrations/`.

```bash
pnpm prisma:migrate   # run/make a SQLite migration (dev)
pnpm prisma:studio    # open Prisma Studio on the SQLite DB
pnpm seed             # seed local (writes LOCAL_COMPANY_ID / LOCAL_STORE_ID)
```

The landing and admin panel have their own Prisma schemas under their respective `apps/<name>/prisma/`.

---

## Testing

- **POS React:** Vitest (`pnpm --filter pos-react test`)
- **API:** Jest (`pnpm --filter api test`)
- **E2E:** Playwright (`pnpm e2e`)

Strategy and coverage targets: [`docs/context/TESTING.md`](docs/context/TESTING.md).

---

## ARCA / electronic invoicing

Arcom integrates with **ARCA (ex AFIP)** to emit electronic invoices (facturas A/B/C, notas de crédito/débito) with real-time CAE, off-line retry queueing, and the official QR (RG 4597). See the integration skill at `.agents/skills/arca-sdk/SKILL.md` and the module under `apps/api/src/features/invoices/`.

---

## Documentation

The **source of truth** for this project lives in [`docs/context/`](docs/context/). Read the relevant doc before touching code in a given layer.

| Doc | Covers |
|---|---|
| [`ARCHITECTURE.md`](docs/context/ARCHITECTURE.md) | Full stack, migration, module layout — **highest authority** |
| [`DECITIONS.md`](docs/context/DECITIONS.md) | Why each major decision was made (Tauri, SQLite, Zustand, NestJS…) |
| [`CONVENTIONS.md`](docs/context/CONVENTIONS.md) | Code style, patterns, commit protocol |
| [`KNOWN-ERRORS.md`](docs/context/KNOWN-ERRORS.md) | Edge cases, SQLite/Prisma/Tauri gotchas |
| [`WORK-FLOW.md`](docs/context/WORK-FLOW.md) | Implementation process + Definition of Done |
| [`GLOSSARY.md`](docs/context/GLOSSARY.md) | Domain terms (Company, Store, SyncQueue…) |
| [`TESTING.md`](docs/context/TESTING.md) | Test strategy |
| [`PERFORMANCE.md`](docs/context/PERFORMANCE.md) | Performance budgets |
| [`DEBUGGING.md`](docs/context/DEBUGGING.md) | Debugging guides |
| [`SYNC.md`](docs/context/SYNC.md) | Cloud sync (SyncQueue) design |
| [`UPDATES.md`](docs/context/UPDATES.md) | Auto-updater, distribution, rollback |
| [`CLI-INTERACTIVE.md`](docs/context/CLI-INTERACTIVE.md) | First-run / migration / settings wizards |
| [`ROADMAP.md`](docs/ROADMAP.md) | Migration phases (0-6) and launch plan |

**Repository layout:** see [`AGENTS.md`](AGENTS.md) for the full directory map and per-layer responsibilities.

---

## Releases & licensing

- Native binaries (Windows `.msi`/`-setup.exe`, macOS `.dmg`, Linux `.AppImage`/`.deb`/`.rpm`) are published to the [`SebaAguiar/arcom-releases`](https://github.com/SebaAguiar/arcom-releases) GitHub repo; the landing resolves `releases/latest` at build time to keep download buttons fresh.
- The auto-updater is wired via GitHub Releases. See [`docs/context/UPDATES.md`](docs/context/UPDATES.md).

---

## License

Proprietary. All rights reserved.
