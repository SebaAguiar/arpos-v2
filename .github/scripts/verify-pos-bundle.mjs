#!/usr/bin/env node
/**
 * Verifies that a built POS bundle was compiled with the build-time
 * configuration it requires. Fails loudly instead of shipping a bundle that
 * throws on boot or silently points at a dev-only host.
 *
 * Why this exists: `import.meta.env.VITE_*` reads are inlined by Vite at
 * build time. A missing variable is NOT a build error — the bundle is emitted
 * with the failure path baked in (or, worse, a localhost fallback), so the
 * problem only surfaces on the end user's machine. This script turns those
 * silent failures into a non-zero exit code in CI/release.
 *
 * Env:
 *   POS_DIST_DIR                  dir with the built POS (default apps/pos-react/dist)
 *   POS_REQUIRE_LICENSE_KEY       '0' to skip the license public key check (default '1')
 *   POS_REQUIRE_CLOUD_BASE        '0' to skip the cloud API base check (default '1')
 *
 * Skip flags exist for CI runs on pull requests from forks, where repository
 * secrets are not exposed and a strict check would fail every external build.
 * A skipped run prints a loud warning: the bundle is UNVERIFIED.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const distDir = process.env.POS_DIST_DIR ?? 'apps/pos-react/dist';
const requireLicenseKey = process.env.POS_REQUIRE_LICENSE_KEY !== '0';
const requireCloudBase = process.env.POS_REQUIRE_CLOUD_BASE !== '0';

/**
 * Markers that prove a bundle was built WITHOUT the required configuration.
 * Each is the exact source string that Vite inlines into the main chunk.
 */
const CHECKS = [
  {
    label: 'VITE_LICENSE_PUBLIC_KEY',
    markers: ['VITE_LICENSE_PUBLIC_KEY is missing'],
    hint: 'The POS throws at module load without it. Add the Ed25519 public key as a repository secret.',
    enabled: requireLicenseKey,
  },
  {
    label: 'VITE_CLOUD_API_BASE',
    // The `?? "http://localhost:3001"` fallback in src/services/cloud-client.ts.
    markers: ['http://localhost:3001'],
    hint: 'The cloud client falls back to the dev host, so activation and license issuance reach nothing in production. Add the deployed admin-panel URL as a repository secret.',
    enabled: requireCloudBase,
  },
];

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  console.error(`::error::POS bundle directory not found: ${distDir}`);
  console.error('Did `pnpm --filter pos-react build` run before this check?');
  process.exit(1);
}

/** Recursively collect every built asset we can grep as text. */
function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (['.js', '.mjs', '.css', '.html'].includes(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const files = collectFiles(distDir);
if (files.length === 0) {
  console.error(`::error::No built assets found under ${distDir} — nothing to verify.`);
  process.exit(1);
}

const contents = new Map(
  files.map((file) => [file, readFileSync(file, 'utf8')]),
);

const failures = [];
const warnings = [];

for (const check of CHECKS) {
  if (!check.enabled) {
    warnings.push(`${check.label}: check skipped (POS_REQUIRE_* = '0') — bundle is UNVERIFIED`);
    continue;
  }
  const hits = [];
  for (const [file, text] of contents) {
    for (const marker of check.markers) {
      if (text.includes(marker)) hits.push({ file, marker });
    }
  }
  if (hits.length > 0) {
    const where = [...new Set(hits.map((h) => h.file))].join(', ');
    failures.push({ check, where, marker: hits[0].marker });
  }
}

for (const warning of warnings) {
  console.warn(`::warning::${warning}`);
}

if (failures.length > 0) {
  for (const { check, where, marker } of failures) {
    console.error(`::error::${check.label} was not injected into the POS bundle.`);
    console.error(`  marker found: ${JSON.stringify(marker)}`);
    console.error(`  in: ${where}`);
    console.error(`  ${check.hint}`);
  }
  console.error(`POS bundle verification failed for ${distDir}. Refusing to ship it.`);
  process.exit(1);
}

console.log(`POS bundle verification passed for ${distDir} (${files.length} asset(s) scanned).`);
for (const check of CHECKS) {
  if (check.enabled) console.log(`  ok: ${check.label}`);
}
