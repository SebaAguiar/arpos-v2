# Changelog

## [0.1.0] - 2026-07-29

### Added
- POS desktop app with Tauri v2 shell
- NestJS backend sidecar with SQLite (Prisma)
- Product catalog with variants and inventory
- Sales flow with cart, payment methods, and cash register
- Customer management with wallet balance
- Purchase order management with receiving workflow
- Offline-first architecture with sync queue
- Auto-updater via Tauri plugin (GitHub Releases)
- Lazy-loaded routes with chunk splitting

### Technical
- Monorepo with pnpm workspaces and NX
- Multi-platform bundles: deb, rpm, appimage, msi, nsis, dmg
- 275+ API tests with Jest
- End-to-end testing with Playwright
