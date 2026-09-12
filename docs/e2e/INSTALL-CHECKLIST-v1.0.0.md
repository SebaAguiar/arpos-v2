# E2E Install Checklist — Arcom v1.0.0-beta.1 (self-contained sidecar)

Purpose: validate on a **clean machine with NO Node.js installed** that the published
v1.0.0-beta.1 bundles are truly self-contained: the packaged Node portable + NestJS
sidecar boot, migrate, and the POS works offline-first.

Target: Linux x86_64 (tested on Zorin/Ubuntu). Same flow applies to macOS (DMG) and
Windows — note the beta Windows bundle is **NSIS only** (WiX/MSI rejects non-numeric
prerelease versions; the stable v1.0.0 ships msi + nsis).

Release line: this is the **beta** that must pass before the definitive v1.0.0 is cut.
Source of truth: release `v1.0.0-beta.1` at
`https://github.com/SebaAguiar/arcom-releases/releases/tag/v1.0.0-beta.1`.
Beta manifests are per-tag; the fixed updater endpoint (`.../releases/latest/download/latest.json`)
only 404s during the beta phase and resumes once the stable v1.0.0 publishes.
Updater manifest: `latest.json` in the same release.

---

## 0. Pre-flight (host machine) — verify state BEFORE installing

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 0.1 | `node --version` / `which node` | NOT found (that's the point) | ☐ |
| 0.2 | `uname -m` | `x86_64` | ☐ |
| 0.3 | Free disk space (`df -h .`) | ≥ 1 GB (installer + runtime ~300 MB) | ☐ |
| 0.4 | `curl -fsI https://github.com` | HTTP 200 (or pre-fetch the installer elsewhere / USB) | ☐ |

## 1. Download + integrity

> **IMPORTANT — solo usá los links con el tag explícito `v1.0.0-beta.1` de abajo.**
> NO uses el patrón `.../releases/latest/download/...`: durante la fase beta GitHub no
> resuelve `/releases/latest` (solo sirve releases **estables**) y da **404** — es el
> comportamiento esperado y documentado, no un error.

Los nombres de asset varían por formato. Tauri nombra AppImage/deb/exe/dmg con guiones bajos
(`Arcom_1.0.0-beta.1_amd64.*`) pero el **rpm con guiones y sufijo `-1.x86_64`** (`Arcom-1.0.0-beta.1-1.x86_64.rpm`);
usar el nombre equivocado da 404 aunque la release exista. Mapa exacto (tag `v1.0.0-beta.1`):

```bash
# Linux — AppImage (simplest para Zorin/Ubuntu). Download ~142 MB + .sig:
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_amd64.AppImage
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_amd64.AppImage.sig

# Linux — deb (Debian/Ubuntu). Download ~97 MB + .sig:
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_amd64.deb
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_amd64.deb.sig

# Linux — rpm (Fedora/RHEL). Nombre con GUIONES. Download ~97 MB + .sig:
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom-1.0.0-beta.1-1.x86_64.rpm
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom-1.0.0-beta.1-1.x86_64.rpm.sig

# Windows — NSIS installer (beta NO lleva MSI):
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_x64-setup.exe
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_x64-setup.exe.sig

# macOS — DMG (Apple Silicon aarch64):
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_aarch64.dmg
curl -fLO https://github.com/SebaAguiar/arcom-releases/releases/download/v1.0.0-beta.1/Arcom_1.0.0-beta.1_aarch64.dmg.sig
```

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 1.1 | File size | AppImage ≈ 142 MB; deb/rpm ≈ 97 MB | ☐ |
| 1.2 | Signature (optional but recommended) | `minisign -Vm <asset-name> -P "<pubkey from apps/arcom-launcher/src-tauri/tauri.conf.json>"` → `Signature and comment signature verified` (usá el nombre exacto del asset; p. ej. `Arcom_1.0.0-beta.1_amd64.AppImage`) | ☐ |

## 2. Install + first launch

```bash
chmod +x Arcom_1.0.0-beta.1_amd64.AppImage
./Arcom_1.0.0-beta.1_amd64.AppImage  # FUSE needed
# Fallback if FUSE unavailable:
export APPIMAGE_EXTRACT_AND_RUN=1 && ./Arcom_1.0.0-beta.1_amd64.AppImage
```

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 2.1 | Package installs (`sudo apt install ./Arcom_1.0.0-beta.1_amd64.deb` or `sudo dnf install ./Arcom-1.0.0-beta.1-1.x86_64.rpm`) | menu entry `Arcom` appears | ☐ |
| 2.2 | First launch opens the Tauri window (no browser tab) | window shows app immediately | ☐ |
| 2.3 | Sidecar process is the **bundled** node | `ps aux \| grep runtime` shows `<install>/usr/lib/Arcom/runtime/node/bin/node` (or AppDir name); NOT a system node | ☐ |
| 2.4 | Backend is listening | `curl -s http://localhost:3000/api/health` → `200` with `{"status":"ok","db":"connected"}` (returns 200 even before the wizard creates tables — the launcher health gate requires it; a refused connection = failure) | ☐ |
| 2.5 | `curl -s http://localhost:3000/api` | JSON body (API up, not HTML) | ☐ |

## 3. First-run wizard (migration + tenant setup)

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 3.1 | Wizard appears on first run | company + store + first user fields | ☐ |
| 3.2 | Complete and save the wizard | reaches POS; SQLite file created in the app data dir (see `$XDG_DATA_HOME`/appdir) | ☐ |
| 3.3 | After setup, health check | `curl -s http://localhost:3000/api/health` → `200` (tables migrated) | ☐ |

## 4. POS smoke test (offline-first)

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 4.1 | Catalog needs at least one product | create a product (name + price), it persists | ☐ |
| 4.2 | Add product to cart, complete a sale | sale registered, cart resets | ☐ |
| 4.3 | Sale appears in history / reports | previous sale listed | ☐ |
| 4.4 | Kill the app and relaunch | data (product + sale) still present → proves persistence | ☐ |
| 4.5 | Disable Wi-Fi/ethernet, keep using POS | catalog + cart + sale still work; offline indicator visible | ☐ |

## 5. Updater sanity (BETA: endpoint intentionally down — see preamble)

During the beta phase the fixed updater endpoint 404s because GitHub `/releases/latest`
only serves **stable** releases, and only the prerelease exists. So:

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 5.1 | Menu → Check for updates (if exposed) | "Update check failed / no manifest" is **EXPECTED** in beta (not a regression). It must come back to "You're up to date" / normal flow once v1.0.0 is published | ☐ |
| 5.2 | No payload beyond the endpoint 404 | the failure is only the HTTP 404 of latest.json; no signature/parse errors | ☐ |

After the definitive v1.0.0 release: the installed `1.0.0-beta.1` app must see `1.0.0` as
an update (stable > prerelease is the supported direction; the reverse is blocked).

## 6. Failure capture

If anything fails, capture:

```bash
# Backend logs: look for the sidecar stdout/stderr (depends on launcher health check)
~/.local/share/arcom/com.arcom.desktop/logs/   # if logs are written there
dmesg | tail -20                                # any denials (AppArmor/sandbox)
```

Report: which step failed, exact command output, and whether the bundled `node`
(local <install>/usr/lib/Arcom/runtime) or a host Node was involved.

---

## Definition of Done (v1.0.0-beta.1 e2e → definitive v1.0.0)

- [ ] All boxes above checked on a Node-less machine using the **beta** bundles
- [ ] App boots, wizard completes, migrations run, POS sale persists, offline works
- [ ] No `.env`/secret surfaced in logs or filesystem
- [ ] Result reported back → apply beta-feedback fixes (if any) → bump the launcher to
      `1.0.0` and cut tag `v1.0.0` (policy: the definitive version comes out as 1.0.0)