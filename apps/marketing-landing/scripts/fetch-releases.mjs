/**
 * Fetch latest GitHub release from arcom-releases and generate releases.json
 * with direct download URLs for each OS/format.
 *
 * Runs at build-time (see package.json "build" script). Falls back to the
 * existing releases.json if the GitHub API is unreachable (offline builds),
 * and logs a warning.
 */
import { writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'SebaAguiar/arcom-releases';
const API_URL = `https://api.github.com/repos/${REPO}/releases?per_page=5`;
const RAW_RELEASES_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/data/releases.json',
);

/**
 * Asset patterns per platform/format. `match` is a regex applied to the
 * asset name; the first asset (by priority order) that matches wins.
 * Keys mirror the shapes consumed by DownloadSection.astro.
 */
const ASSET_RULES = [
  { key: 'windows_msi', match: /Ar(?:con|com)_.*_x64_[A-Za-z-]+\.msi$/ },
  { key: 'windows_exe', match: /Ar(?:con|com)_.*_x64-setup\.exe$/ },
  { key: 'macos_dmg', match: /Ar(?:con|com)_.*\.dmg$/ },
  { key: 'linux_appimage', match: /Ar(?:con|com)_.*_amd64\.AppImage$/ },
  { key: 'linux_deb', match: /Ar(?:con|com)_.*_amd64\.deb$/ },
  { key: 'linux_rpm', match: /Ar(?:con|com)[-_].*\.x86_64\.rpm$/i },
];

async function fetchLatestRelease() {
  const res = await fetch(API_URL, {
    headers: {
      'User-Agent': 'arcom-landing',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${API_URL}`);
  }

  // Use the list endpoint (not /releases/latest): GitHub /releases/latest
  // only resolves STABLE releases and 404s while the only release is a
  // prerelease (beta phase). Take the newest published release, including
  // prereleases, so the landing always links to a downloadable artifact.
  const releases = await res.json();
  const release = releases.find((r) => !r.draft);
  if (!release) {
    throw new Error('No published releases found');
  }
  return release;
}

function buildAssets(release, tag) {
  // Always emit every key so the JSON shape (and the env.d.ts type) stays
  // constant. Unpublished formats are "" — the UI hides those buttons.
  const assets = {
    windows_msi: '',
    windows_exe: '',
    macos_dmg: '',
    linux_appimage: '',
    linux_deb: '',
    linux_rpm: '',
  };
  const names = release.assets.map((a) => a.name);

  for (const rule of ASSET_RULES) {
    const assetName = names.find((name) => rule.match.test(name));
    if (assetName) {
      assets[rule.key] =
        `https://github.com/${REPO}/releases/download/${tag}/${assetName}`;
    }
  }

  return assets;
}

async function main() {
  try {
    const release = await fetchLatestRelease();
    const tag = release.tag_name;

    const data = {
      version: tag.replace(/^v/, ''),
      githubUrl: `https://github.com/${REPO}/releases/tag/${tag}`,
      assets: buildAssets(release, tag),
    };

    await writeFile(RAW_RELEASES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`[fetch-releases] Generated releases.json for ${tag}`);
  } catch (error) {
    // Fall back to the committed releases.json so static builds still succeed
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[fetch-releases] Could not reach GitHub API (${message}). ` +
        `Keeping existing releases.json.`,
    );

    try {
      const existing = JSON.parse(await readFile(RAW_RELEASES_PATH, 'utf8'));
      if (!existing?.assets?.linux_deb) {
        throw new Error('Existing releases.json has no usable assets', { cause: error });
      }
    } catch {
      console.error('[fetch-releases] Existing releases.json is unusable.');
      process.exitCode = 1;
    }
  }
}

main();
