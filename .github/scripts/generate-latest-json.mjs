#!/usr/bin/env node
/**
 * Generates the Tauri v2 static updater manifest (latest.json) from the
 * staged release artifacts.
 *
 * The tauri-plugin-updater (>= 2.10) does NOT parse the GitHub API
 * `releases/latest` JSON. RemoteRelease::deserialize only accepts:
 *   - dynamic: { version, url, signature }
 *   - static:  { version, platforms: { "<os>-<arch>": { url, signature } } }
 * so the release must carry a signed download manifest. See:
 *   https://v2.tauri.app/plugin/updater/#signing-updates
 *
 * Env:
 *   ARTIFACTS_DIR  dir containing the staged installers + .sig files
 *   TAG            tag name of the release, e.g. v1.0.1
 *   REPO           GitHub repo that hosts the release, e.g. SebaAguiar/arcom-releases
 *   NOTES_FILE     optional path to release notes (defaults to CHANGELOG.md)
 *
 * Platform keys follow Tauri's updater target lookup. get_urls prefers
 * "{os}-{arch}-{installer}" and falls back to "{os}-{arch}":
 *   linux-x86_64       -> AppImage
 *   darwin-aarch64     -> <app>.app.tar.gz (createUpdaterArtifacts)
 *   windows-x86_64-nsis -> NSIS setup.exe   (also emitted as windows-x86_64)
 *   windows-x86_64-msi -> MSI installer
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.ARTIFACTS_DIR;
const tag = process.env.TAG;
const repo = process.env.REPO;
const notesFile = process.env.NOTES_FILE ?? 'CHANGELOG.md';

if (!dir || !tag || !repo) {
  console.error(
    'Usage: ARTIFACTS_DIR=<dir> TAG=<vX.Y.Z> REPO=<owner/repo> node generate-latest-json.mjs',
  );
  process.exit(1);
}

const files = readdirSync(dir).sort();
if (files.length === 0) {
  console.error(`No artifacts found in ${dir}`);
  process.exit(1);
}

const pick = (suffix) => files.find((f) => f.endsWith(suffix));

const readSignature = (asset) => {
  const sigFile = `${asset}.sig`;
  if (!files.includes(sigFile)) {
    throw new Error(`missing signature for ${asset} (expected ${sigFile})`);
  }
  return readFileSync(join(dir, sigFile), 'utf8').trim();
};

const downloadUrl = (asset) =>
  `https://github.com/${repo}/releases/download/${tag}/${asset}`;

const platforms = {};

const linuxAsset = pick('.AppImage');
if (linuxAsset) {
  platforms['linux-x86_64'] = {
    url: downloadUrl(linuxAsset),
    signature: readSignature(linuxAsset),
  };
}

const macAsset = pick('.app.tar.gz');
if (macAsset) {
  platforms['darwin-aarch64'] = {
    url: downloadUrl(macAsset),
    signature: readSignature(macAsset),
  };
}

const nsisAsset = pick('-setup.exe');
if (nsisAsset) {
  const entry = { url: downloadUrl(nsisAsset), signature: readSignature(nsisAsset) };
  platforms['windows-x86_64-nsis'] = entry;
  platforms['windows-x86_64'] = entry;
}

const msiAsset = pick('.msi');
if (msiAsset) {
  platforms['windows-x86_64-msi'] = {
    url: downloadUrl(msiAsset),
    signature: readSignature(msiAsset),
  };
}

if (Object.keys(platforms).length === 0) {
  console.error(
    'No updater artifacts matched (AppImage, *.app.tar.gz, *-setup.exe, *.msi).',
  );
  process.exit(1);
}

const notes = existsSync(notesFile)
  ? readFileSync(notesFile, 'utf8').slice(0, 2000)
  : `Release ${tag}`;

const manifest = {
  version: tag.replace(/^v/, ''),
  notes,
  pub_date: new Date().toISOString(),
  platforms,
};

const outPath = join(dir, 'latest.json');
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`latest.json written for ${manifest.version}`);
for (const [key, entry] of Object.entries(platforms)) {
  console.log(`  ${key} -> ${entry.url}`);
}