# ArPOS Tauri — Estrategia Completa de Actualizaciones

**Versión:** 1.0  
**Fecha:** 2026-07-16  
**Estado:** Production-Ready  
**Objetivo:** Sistema robusto de actualización automática, manual, versionado, con rollback y mínimo downtime.

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura de Updates](#2-arquitectura-de-updates)
3. [Versionado Semántico](#3-versionado-semántico)
4. [Tauri Updater Built-in](#4-tauri-updater-built-in)
5. [Backend de Distribución](#5-backend-de-distribución)
6. [Flujo de Actualización](#6-flujo-de-actualización)
7. [Differential Updates](#7-differential-updates)
8. [Rollback & Recovery](#8-rollback--recovery)
9. [Notificaciones al Usuario](#9-notificaciones-al-usuario)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Monitoreo y Telemetría](#11-monitoreo-y-telemetría)
12. [Troubleshooting](#12-troubleshooting)

---

## Tipos Compartidos

Los siguientes tipos se definen una sola vez y se reutilizan a lo largo de todo el documento.

```typescript
// apps/arpos-launcher/src/types/updates.ts

export type UpdateStatus = 'beta' | 'stable' | 'broken' | 'rollback';

export type UpdateNotificationType = 'available' | 'downloading' | 'ready' | 'critical';

export interface UpdateInfo {
  version: string;
  notes: string;
  needsUpdate: boolean;
  critical: boolean;
  rollbackTo: string | null;
}

export interface UpdateCheckResponse {
  needsUpdate: true;
  version: string;
  url: string;
  signature: string;
  notes: string;
  critical: boolean;
  rollbackTo: string | null;
} | {
  needsUpdate: false;
}

export interface UpdateDownloadEventStarted {
  event: 'Started';
  data: {
    contentLength: number | null;
  };
}

export interface UpdateDownloadEventProgress {
  event: 'Progress';
  data: {
    chunkSize: number;
    contentLength: number | null;
  };
}

export interface UpdateDownloadEventFinished {
  event: 'Finished';
}

export type UpdateDownloadEvent =
  | UpdateDownloadEventStarted
  | UpdateDownloadEventProgress
  | UpdateDownloadEventFinished;

export interface UpdateReportDto {
  deviceId: string;
  fromVersion: string;
  toVersion: string;
  status: 'success' | 'failed';
  error?: string;
  downloadTimeMs?: number;
  installTimeMs?: number;
}

export interface RollbackDto {
  brokenVersion: string;
  targetVersion: string;
  reason: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export interface VersionManifest {
  version: string;
  name: string;
  notes: string;
  pub_date: string;
  critical: boolean;
  rollback_to: string | null;
  platforms: Record<string, {
    url: string;
    signature: string;
    with_elevated_task: boolean;
  }>;
}

export interface UpdateState {
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  progress: number;
  notificationType: UpdateNotificationType;
  setUpdateAvailable: (info: UpdateInfo) => void;
  setCritical: (info: UpdateInfo) => void;
  setDownloading: (downloading: boolean) => void;
  setProgress: (progress: number) => void;
  clearUpdate: () => void;
}
```

---

## 1. Resumen Ejecutivo

### Opción A: GitHub Releases (Recomendado - Simple)

✓ Uso GitHub como CDN  
✓ Actualizaciones automáticas desde GitHub  
✓ Versioning integrado  
✓ Histórico de releases  
✗ No hay control fino de rollout (todos actualizan igual)  

### Opción B: Backend Personalizado (Flexible - Complejo)

✓ Control total: rollout gradual, rollback inmediato, A/B testing  
✓ Rollout por región, por plan, por versión anterior  
✓ Estadísticas detalladas  
✗ Necesita backend + almacenamiento S3  
✗ Más caro en infraestructura  

### Opción C: Mixta (Balance)

✓ GitHub como primario (simple)  
✓ Backend personalizado como fallback (control)  
✓ Mejor de ambos mundos  

---

## 2. Arquitectura de Updates

### Flujo General

```
┌───────────────────────────────────────────────────────────┐
│                  ArPOS v1.0.0 (Usuario)                   │
│            ┌────────────────────────────────────┐          │
│            │ Check updates cada 1h (background) │          │
│            └────────────────┬───────────────────┘          │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
                    (HTTPS a releases server)
                              │
        ┌─────────────────────┴──────────────────┐
        │                                        │
        ▼                                        ▼
   ┌─────────────┐                        ┌────────────┐
   │   GitHub    │                        │  Backend   │
   │  Releases   │    Fallback            │ Personaliz│
   │   (v1.0.1)  │◄──────────────┐        │   (v1.0.1)│
   │             │               │        │            │
   └─────────────┘               │        └────────────┘
        │                        │
        └────────────┬───────────┘
                     │
        ¿Nueva versión disponible?
                     │
        ┌────────────────────────┐
        │ SÍ: v1.0.1 found       │
        │ Descargar diff         │
        │ Aplicar patch          │
        │ Reiniciar              │
        │ ✓ v1.0.1 running       │
        │                        │
        │ (2-5 minutos total)    │
        └────────────────────────┘
```

### Componentes del Sistema

```
ArPOS v1.0.0 (Tauri app)
├── Updater thread (background)
│   ├── Check version endpoint
│   ├── Compare versions
│   ├── Download diff si hay nueva
│   └── Apply patch + restart
│
├── Fallback logic
│   ├── Si GitHub falla → intenta backend
│   ├── Si ambos fallan → retry en 1h
│   └── User puede forzar check manual
│
└── Telemetría (opcional)
    ├── "v1.0.0 → v1.0.1 update started"
    ├── "Download: 15.2 MB in 45s"
    ├── "Restart at 2026-07-16 14:30:42 UTC"
    └── Reportar a backend si success/fail
```

---

## 3. Versionado Semántico

### Esquema de Versionado

```
v MAJOR . MINOR . PATCH

v1.0.0  = Lanzamiento inicial
v1.0.1  = Bugfix / seguridad (backward compatible)
v1.1.0  = Feature nueva (backward compatible)
v2.0.0  = Breaking change (migration requerida)
```

### Tipos de Actualización

| Tipo | Versión | Ejemplo | Update | Restart |
|---|---|---|---|---|
| **Hotfix** | Patch | v1.0.0 → v1.0.1 | Differential (1-5 MB) | Automático |
| **Feature** | Minor | v1.0.0 → v1.1.0 | Full (80-100 MB) | Manual (user avisa) |
| **Breaking** | Major | v1.0.0 → v2.0.0 | Full + migration | Forzado + wizard |

### Version Manifest

```json
{
  "version": "1.0.1",
  "name": "ArPOS v1.0.1",
  "notes": "Hotfix: ARCA sync bug, POS cart performance",
  "pub_date": "2026-07-16T14:30:00Z",
  "platforms": {
    "linux-x86_64": {
      "url": "https://releases.arpos.app/arpos_1.0.1_amd64.AppImage",
      "signature": "...",
      "with_elevated_task": false
    },
    "darwin": {
      "url": "https://releases.arpos.app/arpos_1.0.1_universal.dmg",
      "signature": "...",
      "with_elevated_task": false
    },
    "windows-x86_64": {
      "url": "https://releases.arpos.app/ArPOS_1.0.1_x64_en-US.msi",
      "signature": "...",
      "with_elevated_task": false
    }
  },
  "critical": false,
  "rollback_to": "1.0.0"
}
```

---

## 4. Tauri Updater Built-in

### Configuración Base (tauri.conf.json)

```json
{
  "updater": {
    "active": true,
    "dialog": true,
    "windows": true,
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6...",
    "endpoints": [
      "https://releases.arpos.app/update/{{target}}/{{current_version}}"
    ]
  }
}
```

**Explicación de campos:**

- `active`: Habilita updater
- `dialog`: Muestra dialog de actualización al usuario
- `windows`: Instala app en C:\Program Files\ArPOS (en lugar de roaming)
- `pubkey`: Public key Ed25519 para firmar updates (crítico para seguridad)
- `endpoints`: URLs donde verificar nuevas versiones

### Generación de Keys (Una sola vez)

```bash
# En arpos-launcher/
npx tauri signer generate --key-path tauri.key

# Genera:
# - tauri.key (PRIVADA - never commit!)
# - tauri.key.pub (PÚBLICA - agregar a tauri.conf.json)
```

**CRÍTICO:** Guardar `tauri.key` en:
- GitHub Secrets (para CI/CD)
- 1Password / Vault (backup)
- NO en repo

### Tauri Update Command (JavaScript)

```typescript
// arpos-launcher/src/services/updater.service.ts

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/api/process';
import type { UpdateInfo, UpdateDownloadEvent } from '../types/updates';

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const update = await check();

    if (update?.needsUpdate) {
      console.log(`New version available: ${update.version}`);
      console.log(`Release notes: ${update.body}`);

      return {
        version: update.version,
        notes: update.body,
        needsUpdate: true,
        critical: false,
        rollbackTo: null,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to check for updates', error);
    return null;
  }
}

export async function downloadAndInstall(
  onProgress?: (progress: number) => void,
): Promise<void> {
  const update = await check();

  if (!update?.needsUpdate) {
    throw new Error('No update available');
  }

  await update.downloadAndInstall((event: UpdateDownloadEvent) => {
    switch (event.event) {
      case 'Started':
        console.log('Download started');
        onProgress?.(0);
        break;

      case 'Progress':
        if (event.data.contentLength !== null) {
          const percent = (event.data.chunkSize / event.data.contentLength) * 100;
          console.log(`Downloaded ${percent.toFixed(1)}%`);
          onProgress?.(percent);
        }
        break;

      case 'Finished':
        console.log('Download finished');
        onProgress?.(100);
        break;
    }
  });

  await relaunch();
}
```

### Auto-Check en Background

```typescript
// arpos-launcher/src/App.tsx

import { useEffect } from 'react';
import { checkForUpdates } from './services/updater.service';

export function App() {
  useEffect(() => {
    checkForUpdates();

    const interval = setInterval(() => {
      checkForUpdates();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return <MainApp />;
}
```

---

## 5. Backend de Distribución

### Opción A: GitHub Releases (Simple)

#### Setup en GitHub

```bash
# En arpos-launcher/

# 1. Tag new version
git tag v1.0.1

# 2. Push tag
git push origin v1.0.1

# 3. GitHub Actions builds + uploads to releases
# ↓ Automático via CI/CD
```

#### Tauri.conf.json

```json
{
  "updater": {
    "endpoints": [
      "https://releases.github.com/repos/arpos/launcher/releases/latest"
    ]
  }
}
```

**Ventajas:**
- Cero setup
- GitHub lo maneja todo
- Free CDN

**Desventajas:**
- Sin control fino de rollout
- Todos actualizan al mismo tiempo

---

### Opción B: Backend Personalizado (Flexible)

#### Arquitectura

```
ArPOS Backend (NestJS)
│
├── GET /api/updates/check
│   ├── Input: { os, arch, current_version, device_id }
│   ├── Query: DeviceVersion table
│   ├── Logic: Determinar si hay update
│   └── Output: UpdateCheckResponse
│
├── GET /api/updates/download/:version/:platform
│   └── Redirige a S3 (o stream binario)
│
└── POST /api/updates/report
    ├── Input: UpdateReportDto
    └── Guardar analytics
```

#### Controller (NestJS)

```typescript
// apps/pos-api/src/features/updates/updates.controller.ts

import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import type { UpdateCheckResponse, UpdateReportDto } from '../../types/updates';

@Controller('api/updates')
export class UpdatesController {
  constructor(private updatesService: UpdatesService) {}

  @Get('check')
  async checkForUpdates(
    @Query('os') os: string,
    @Query('arch') arch: string,
    @Query('current_version') version: string,
    @Query('device_id') deviceId: string,
  ): Promise<UpdateCheckResponse> {
    const update = await this.updatesService.findUpdate(
      os,
      arch,
      version,
      deviceId,
    );

    if (!update) {
      return { needsUpdate: false };
    }

    return {
      needsUpdate: true,
      version: update.version,
      url: `https://releases.arpos.app/download/${update.id}`,
      signature: update.signature,
      notes: update.releaseNotes,
      critical: update.critical,
      rollbackTo: update.rollbackTo,
    };
  }

  @Post('report')
  async reportUpdate(
    @Body() dto: UpdateReportDto,
  ): Promise<{ ok: true }> {
    await this.updatesService.recordUpdate(dto);
    return { ok: true };
  }
}
```

#### Service (NestJS)

```typescript
// apps/pos-api/src/features/updates/updates.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateReportDto } from '../../types/updates';

interface AppVersionRecord {
  id: string;
  version: string;
  signature: string;
  releaseNotes: string | null;
  critical: boolean;
  rollbackTo: string | null;
  publishedAt: Date;
}

@Injectable()
export class UpdatesService {
  constructor(private prisma: PrismaService) {}

  async findUpdate(
    os: string,
    arch: string,
    currentVersion: string,
    deviceId: string,
  ): Promise<AppVersionRecord | null> {
    const latestVersion = await this.prisma.appVersion.findFirst({
      where: {
        status: 'stable',
        platform: os,
        architecture: arch,
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (!latestVersion) {
      return null;
    }

    if (!this.isNewerVersion(latestVersion.version, currentVersion)) {
      return null;
    }

    const shouldUpdate = await this.checkRolloutPolicy(
      deviceId,
      latestVersion.version,
    );

    if (!shouldUpdate) {
      return null;
    }

    return latestVersion;
  }

  private isNewerVersion(remote: string, local: string): boolean {
    const remoteParts = remote.split('.').map(Number);
    const localParts = local.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const r = remoteParts[i] ?? 0;
      const l = localParts[i] ?? 0;
      if (r > l) return true;
      if (r < l) return false;
    }

    return false;
  }

  private async checkRolloutPolicy(
    deviceId: string,
    targetVersion: string,
  ): Promise<boolean> {
    const release = await this.prisma.appVersion.findFirst({
      where: { version: targetVersion },
    });

    if (!release) return false;

    const hoursSinceRelease = Math.floor(
      (Date.now() - release.publishedAt.getTime()) / (1000 * 60 * 60),
    );

    if (hoursSinceRelease < 24) {
      return this.hashDeviceId(deviceId) % 100 < 5;
    }

    if (hoursSinceRelease < 72) {
      return this.hashDeviceId(deviceId) % 100 < 25;
    }

    return true;
  }

  private hashDeviceId(deviceId: string): number {
    let hash = 0;
    for (const char of deviceId) {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async recordUpdate(dto: UpdateReportDto): Promise<void> {
    await this.prisma.updateReport.create({
      data: {
        deviceId: dto.deviceId,
        fromVersion: dto.fromVersion,
        toVersion: dto.toVersion,
        status: dto.status,
        error: dto.error,
        downloadTimeMs: dto.downloadTimeMs,
        installTimeMs: dto.installTimeMs,
        timestamp: new Date(),
      },
    });

    const failureRate = await this.calculateFailureRate(dto.toVersion);
    if (failureRate > 10) {
      await this.alertOps(`High failure rate for v${dto.toVersion}`);
    }
  }

  private async calculateFailureRate(version: string): Promise<number> {
    const total = await this.prisma.updateReport.count({
      where: { toVersion: version },
    });

    if (total === 0) return 0;

    const failures = await this.prisma.updateReport.count({
      where: { toVersion: version, status: 'failed' },
    });

    return (failures / total) * 100;
  }

  private async alertOps(message: string): Promise<void> {
    console.error(`[ALERT] ${message}`);
  }
}
```

#### Schema Prisma (Nuevas tablas)

```prisma
model AppVersion {
  id                String   @id @default(cuid())
  version           String   @unique
  platform          String
  architecture      String
  downloadUrl       String
  signature         String
  releaseNotes      String?
  fileSize          Int
  checksum          String
  status            String   @default("beta")
  rollbackTo        String?
  critical          Boolean  @default(false)
  publishedAt       DateTime @default(now())
  deprecatedAt      DateTime?

  updateReports     UpdateReport[]

  @@index([status, platform])
  @@index([publishedAt])
}

model DeviceVersion {
  id                String   @id @default(cuid())
  deviceId          String   @unique
  currentVersion    String
  os                String
  architecture      String
  lastCheckAt       DateTime @default(now())
  lastUpdateAt      DateTime?

  updateReports     UpdateReport[]
}

model UpdateReport {
  id                String   @id @default(cuid())
  deviceId          String
  fromVersion       String
  toVersion         String
  status            String
  error             String?
  downloadTimeMs    Int?
  installTimeMs     Int?
  timestamp         DateTime @default(now())

  device            DeviceVersion @relation(fields: [deviceId], references: [deviceId])
  appVersion        AppVersion    @relation(fields: [toVersion], references: [version])

  @@index([deviceId])
  @@index([toVersion])
}
```

---

## 6. Flujo de Actualización

### Paso a Paso (Usuario POV)

```
T+0s:   User: Usando ArPOS v1.0.0
        Background thread: "¿Hay updates?"

T+1s:   API check: "Versión actual: 1.0.0"
        Response: "v1.0.1 disponible (hotfix)"

T+2s:   UI: Muestra notification
        "Actualización disponible (45 MB)"
        Buttons: [Actualizar ahora] [Más tarde]

T+3s:   User: Click "Actualizar ahora"

T+4s:   Descarga comienza
        Progress bar: 0% → 100%
        Estimado: 2 minutos

T+130s: Descarga completa
        Verificar firma: OK
        Descomprimir: OK

T+131s: Dialog: "Update ready. Restart now?"
        Buttons: [Restart] [Restart at 18:00]

T+132s: User: Click "Restart"
        App guarda estado (carrito, etc)
        Cierra conexiones
        Reinicia

T+135s: App inicia con v1.0.1
        Carga datos (fast, todo en SQLite)
        User: "¿Qué pasó?" (se reinició casi invisible)
```

### Código en React (Dialog de Update)

```typescript
// apps/pos-react/src/components/settings/UpdateDialog.tsx

import { useState, useEffect } from 'react';
import { checkForUpdates, downloadAndInstall } from '../../services/updater.service';
import type { UpdateInfo } from '../../types/updates';

export function UpdateDialog() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkForUpdates().then((update) => {
      if (update) {
        setUpdateInfo(update);
      }
    });
  }, []);

  const handleUpdate = async (): Promise<void> => {
    setDownloading(true);
    try {
      await downloadAndInstall((prog: number) => setProgress(prog));
    } catch (error) {
      console.error('Update failed', error);
      setDownloading(false);
    }
  };

  if (!updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-96 space-y-4">
        <h2 className="text-lg font-semibold">Actualización Disponible</h2>
        <p>ArPOS {updateInfo.version}</p>
        <div className="bg-gray-100 p-3 rounded max-h-32 overflow-auto">
          <p className="text-sm">{updateInfo.notes}</p>
        </div>

        {downloading && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Descargando... {Math.round(progress)}%
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            disabled={downloading}
            className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {downloading ? 'Actualizando...' : 'Actualizar Ahora'}
          </button>
          <button
            onClick={() => setUpdateInfo(null)}
            disabled={downloading}
            className="flex-1 bg-gray-100 py-2 rounded disabled:opacity-50"
          >
            Más Tarde
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Differential Updates

### Problema: Descargar 100 MB cada vez es lento

### Solución: Differential patches

```
v1.0.0 → v1.0.1 (hotfix)
├── Cambios:
│   ├── Archivo A: 2 líneas de código (+50 bytes)
│   ├── Archivo B: 1 función nueva (+10 KB)
│   └── DLL actualizada (Prisma +500 KB)
│
├── Delta patch: ~550 KB (en lugar de 100 MB)
│
└── Cliente:
    ├── Descarga patch (550 KB en 20s)
    ├── Valida checksum
    ├── Aplica patch a binario existente
    └── Resultado: v1.0.1 listo
```

### Implementación (Tauri 2.x built-in)

Tauri maneja esto automáticamente si:

1. Publicar versiones en orden (1.0.0 → 1.0.1 → 1.1.0)
2. Mantener versiones antiguas en CDN
3. Firmar cada binario

**Tauri detecta:**
- Versión instalada: 1.0.0
- Versión disponible: 1.0.1
- Genera delta automáticamente

**Código:**
```typescript
// Tauri maneja todo transparentemente
await check();
// ↓ Descarga diff si es menor que full binary
// ↓ Aplica patch
// ↓ Verifica checksum
// ✓ Listo para reiniciar
```

---

## 8. Rollback & Recovery

### Escenario: v1.0.1 tiene bug crítico

### Proceso de Rollback

```
1. Ops descubre bug en v1.0.1
   "Usuarios no pueden registrar ventas"

2. Marcar v1.0.1 como "broken" en backend
   UPDATE appVersion SET status='broken' WHERE version='1.0.1'

3. Publicar v1.0.0 como "stable" nuevamente
   UPDATE appVersion SET status='stable' WHERE version='1.0.0'

4. Opcional: Publicar v1.0.2 con fix
   UPDATE appVersion SET rollbackTo='1.0.0'

5. Usuarios ven: "Rollback a v1.0.0 recomendado"

6. Auto-revert en 1 hora si no descargan v1.0.2
```

### Código de Rollback (Backend)

```typescript
// packages/platform-hono/src/features/updates/updates.admin.controller.ts

import { Controller, Post, Body, UseGuards } from '@hono/zod-openapi';
import { UpdatesService } from './updates.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { RollbackDto } from '../../types/updates';

@Controller('api/admin/updates')
@UseGuards(RolesGuard)
export class UpdatesAdminController {
  constructor(private updatesService: UpdatesService) {}

  @Post('rollback')
  async initiateRollback(
    @Body() dto: RollbackDto,
  ): Promise<{ ok: true }> {
    await this.prisma.appVersion.update({
      where: { version: dto.brokenVersion },
      data: { status: 'broken' },
    });

    await this.prisma.appVersion.update({
      where: { version: dto.targetVersion },
      data: { status: 'stable' },
    });

    await this.notificationService.broadcastRollback({
      from: dto.brokenVersion,
      to: dto.targetVersion,
      reason: dto.reason,
    });

    await this.auditService.log({
      action: 'ROLLBACK',
      details: dto,
    });

    return { ok: true };
  }
}
```

### Recuperación Local (Device)

Si un device se queda sin conectividad después de update fallido:

```rust
// src-tauri/src/commands/recovery.rs

#[tauri::command]
async fn check_app_integrity() -> Result<bool, String> {
    let current_app = get_current_app_path();
    let signature = verify_signature(&current_app)?;

    if !signature.is_valid {
        restore_from_backup()?;
        return Err("App corrupted, restored from backup".to_string());
    }

    let db_integrity = check_db_integrity().await?;
    if !db_integrity.is_valid {
        restore_db_from_backup()?;
        return Err("DB corrupted, restored from backup".to_string());
    }

    Ok(true)
}

#[tauri::command]
async fn manual_rollback_to_version(
    version: String,
) -> Result<(), String> {
    let backup_path = get_backup_path(&version);

    if !backup_path.exists() {
        return Err(format!("Backup for {} not found", version));
    }

    restore_app_from_backup(&backup_path)?;
    log_manual_rollback(&version)?;

    Ok(())
}
```

---

## 9. Notificaciones al Usuario

### Tipos de Notificaciones

#### 1. Update Disponible (Background)

```
┌────────────────────────────────┐
│ 📦 Actualización disponible      │
│ ArPOS v1.0.1 - Hotfix           │
│ 45 MB - ~2 minutos              │
│ [Actualizar] [Más tarde]        │
└────────────────────────────────┘
```

#### 2. Update en Progreso

```
┌────────────────────────────────┐
│ ⬇️  Descargando actualización   │
│ █████████░░░░░░░░░  60%        │
│ 30 MB / 50 MB - 45s restantes  │
│ [Cancelar]                      │
└────────────────────────────────┘
```

#### 3. Restart Requerido

```
┌────────────────────────────────┐
│ ✓ Actualización lista           │
│ Reinicia la app para aplicar    │
│                                 │
│ [Reiniciar] [Reiniciar a las X]│
└────────────────────────────────┘
```

#### 4. Update Crítico (Forzado)

```
┌────────────────────────────────┐
│ ⚠️  ACTUALIZACIÓN CRÍTICA        │
│ Seguridad: Vulnerabilidad ARCA │
│ Reiniciando en 30s...           │
│ 29s...                          │
│ [Reiniciar Ahora]               │
└────────────────────────────────┘
```

### Código (Toast + Dialog)

```typescript
// apps/pos-react/src/hooks/useUpdateNotifications.ts

import { useEffect } from 'react';
import { useToast } from './useToast';
import { useUpdateStore } from '../stores/update.store';
import { checkForUpdates } from '../services/updater.service';

export function useUpdateNotifications(): void {
  const toast = useToast();
  const { setUpdateAvailable, setCritical } = useUpdateStore();

  useEffect(() => {
    checkForUpdates().then((update) => {
      if (!update) return;

      if (update.critical) {
        setCritical(update);
        toast.error({
          title: '⚠️ Actualización Crítica',
          description: `Se debe actualizar a ${update.version}`,
          autoClose: false,
        });
      } else {
        setUpdateAvailable(update);
        toast.info({
          title: '📦 Actualización Disponible',
          description: `ArPOS ${update.version} está listo`,
          action: 'Actualizar',
          autoClose: 10000,
        });
      }
    });
  }, [setUpdateAvailable, setCritical, toast]);
}
```

### Zustand Store para Updates

```typescript
// apps/pos-react/src/stores/update.store.ts

import { create } from 'zustand';
import type { UpdateInfo, UpdateNotificationType } from '../types/updates';

interface UpdateState {
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  progress: number;
  notificationType: UpdateNotificationType;
  setUpdateAvailable: (info: UpdateInfo) => void;
  setCritical: (info: UpdateInfo) => void;
  setDownloading: (downloading: boolean) => void;
  setProgress: (progress: number) => void;
  clearUpdate: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  updateInfo: null,
  downloading: false,
  progress: 0,
  notificationType: 'available',

  setUpdateAvailable: (info) =>
    set({ updateInfo: info, notificationType: 'available' }),

  setCritical: (info) =>
    set({ updateInfo: info, notificationType: 'critical' }),

  setDownloading: (downloading) =>
    set({ downloading, notificationType: 'downloading' }),

  setProgress: (progress) => set({ progress }),

  clearUpdate: () =>
    set({
      updateInfo: null,
      downloading: false,
      progress: 0,
      notificationType: 'available',
    }),
}));
```

---

## 10. CI/CD Pipeline

### GitHub Actions: Build + Sign + Release

```yaml
# .github/workflows/release.yml

name: Release & Sign

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - uses: dtolnay/rust-toolchain@stable

      - uses: actions/cache@v3
        with:
          path: ~/.cargo
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      # Build
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      # Sign binaries
      - name: Import signing key
        run: |
          echo "${{ secrets.TAURI_SIGNING_KEY }}" > tauri.key

      - name: Sign binaries
        run: |
          npm install -g @tauri-apps/cli
          tauri signer sign \
            src-tauri/target/release/bundle/**/* \
            --key ./tauri.key

      # Upload to GitHub Releases
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/**/*
          generate_release_notes: true
          prerelease: ${{ contains(github.ref, '-beta') || contains(github.ref, '-rc') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Upload a backend para distribución personalizada
      - name: Upload to S3 (Release Registry)
        run: |
          aws s3 cp \
            src-tauri/target/release/bundle/ \
            s3://arpos-releases/${{ github.ref_name }}/ \
            --recursive
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      # Registrar en backend
      - name: Register Release in Backend
        run: |
          curl -X POST https://api.arpos.app/admin/updates/register \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "version": "${{ github.ref_name }}",
              "releaseNotes": "${{ github.event.release.body }}",
              "platforms": {
                "linux": {"url": "..."},
                "darwin": {"url": "..."},
                "windows": {"url": "..."}
              }
            }'
```

### Proceso Paso a Paso

```bash
# 1. Develop feature
git checkout -b feature/xyz
# ... make changes ...
git commit -m "feat: add xyz"
git push origin feature/xyz

# 2. Create PR, review, merge
git pull origin main
git checkout main

# 3. Tag version (semver)
git tag v1.0.1
git push origin v1.0.1

# 4. GitHub Actions triggered
#    ├── Build (3 platforms)
#    ├── Sign binaries
#    ├── Upload to Releases
#    ├── Upload to S3
#    └── Register in backend

# 5. Users see update available (en ~5 minutos)
```

---

## 11. Monitoreo y Telemetría

### Qué Monitorear

```typescript
// packages/platform-hono/src/features/updates/update.analytics.ts

import type { UpdateStatus } from '../../types/updates';

export interface UpdateAnalytics {
  version: string;
  platform: string;
  architecture: string;

  total_installations: number;
  updated_count: number;
  adoption_rate: number;
  days_since_release: number;

  avg_download_time_ms: number;
  avg_install_time_ms: number;
  median_download_speed_mbps: number;

  failed_count: number;
  failure_rate: number;
  common_errors: { error: string; count: number }[];

  crash_reports: number;
  rollback_count: number;

  status: UpdateStatus;
  recommendation: string;
}
```

### Dashboard (Admin)

```typescript
// GET /admin/updates/analytics

{
  "versions": [
    {
      "version": "1.0.1",
      "status": "stable",
      "adoption_rate": 65.3,
      "failure_rate": 0.2,
      "avg_download_time_ms": 45000,
      "recommendation": "Release to all users"
    },
    {
      "version": "1.0.0",
      "status": "stable",
      "adoption_rate": 34.5,
      "failure_rate": 0.1,
      "avg_download_time_ms": 60000,
      "recommendation": "Can be deprecated in 2 weeks"
    },
    {
      "version": "1.1.0-beta",
      "status": "beta",
      "adoption_rate": 0.2,
      "failure_rate": 5.2,
      "avg_download_time_ms": 55000,
      "recommendation": "Fix 3 issues before stable release"
    }
  ],
  "overall_health": "good"
}
```

### Alert Rules

```
IF failure_rate > 10% THEN
  ├── Notify Ops immediately
  ├── Pause rollout to new users
  └── Recommend rollback

IF avg_download_time > 5 min THEN
  ├── Check CDN health
  └── Consider regional CDN

IF adoption_rate < 10% after 7 days THEN
  ├── Check if users are online
  └── Send reminder notification
```

---

## 12. Troubleshooting

### Problema: Update falla sin error visible

```bash
# 1. Ver logs locales
tail -f ~/.arpos/logs/tauri.log
tail -f ~/.arpos/logs/app.log

# 2. Verificar DB
sqlite3 ~/.arpos/data/app.db "SELECT * FROM update_report ORDER BY timestamp DESC LIMIT 5;"

# 3. Forzar check manual
# En settings: "Check for updates"

# 4. Ver última versión registrada
curl https://releases.arpos.app/latest
```

### Problema: Usuario en v1.0.0, se queda atorado

```bash
# Posibles causas:
1. No hay conexión a internet
   → Check: isOnline flag
   → Retry automático en 1 hora

2. Update server down
   → Fallback a backend personalizado
   → Mostrar "Update no disponible temporalmente"

3. Firma inválida
   → Log: "Signature verification failed"
   → Download nuevamente con retry exponencial

4. Espacio en disco
   → Mostrar: "Libera 100 MB para actualizar"
   → Suggestion: cleanup old backups
```

### Problema: Rollout gradual muy lento

```bash
# Si necesitás acelerar:

# 1. Aumentar % de rollout
UPDATE appVersion
SET rollout_percentage = 100
WHERE version = '1.0.1';

# 2. O forzar a usuarios específicos
INSERT INTO force_update (user_id, version)
SELECT id, '1.0.1' FROM users WHERE plan = 'premium';

# 3. Notificar: "Update crítico, reinicia app"
```

### Problema: Device offline cuando sale update

```
Device:
├── Last online: 2026-07-16 10:00
├── Current version: v1.0.0
├── Check updates: YES (stored in DB)
├── Latest version: v1.0.1 (from last online check)
│
└─ Al reconectar:
  ├── Verifica versiones nuevamente
  ├── Descubre v1.0.1 (o v1.0.2 si hubo update)
  └── Descarga e instala automáticamente
```

---

## Resumen: Opciones de Distribución

| Opción | Complejidad | Control | Costo | Recomendación |
|---|---|---|---|---|
| **GitHub Releases** | Baja | Bajo | $0 | ✓ Para <1000 users |
| **Backend personalizado** | Alta | Alto | $50-200/mes | Para >1000 users |
| **Mixta** | Media | Medio | $20-100/mes | ✓ Balance perfecto |

---

## Arquitectura Recomendada (Fase 1 → 2)

### Fase 1 (Lanzamiento)
- ✓ GitHub Releases
- ✓ Tauri built-in updater
- ✓ Auto-check cada 1 hora
- Simple, funcional

### Fase 2 (Escalar)
- ✓ Backend personalizado
- ✓ Rollout gradual
- ✓ Analytics dashboard
- ✓ Auto-rollback en caso de fallos
- Production-grade

---

## Checklist Pre-Lanzamiento

- [ ] Keys Ed25519 generadas y guardadas en GitHub Secrets
- [ ] tauri.conf.json configurado con endpoints
- [ ] CI/CD pipeline tested (release ficticio)
- [ ] GitHub Releases o backend listo
- [ ] App version bumped en tauri.conf.json + package.json
- [ ] Release notes escritas
- [ ] Beta testing con 10 users
- [ ] Rollback plan documentado
- [ ] Monitoring + alertas configuradas
- [ ] Documentación actualizada

---

> **Este sistema permite actualizaciones confiables, rápidas, y reversibles.**  
> **Con Tauri, tus usuarios nunca quedarán atrapados en versiones viejas.**

---

## Documento Vivo

**Actualizaciones necesarias cuando:**
- Se publique el primer release (agregar learnings)
- Se implemente el backend personalizado (Fase 2)
- Se descubran edge cases en actualizaciones reales
- Se cambie la estrategia de rollout

> **Documento creado:** 2026-07-16  
> **Versión:** 1.0  
> **Estado:** Referencia para implementación de updates
