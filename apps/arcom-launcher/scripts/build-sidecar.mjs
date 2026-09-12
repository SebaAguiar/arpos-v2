#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { chmodSync, cpSync, mkdirSync, rmSync, renameSync, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const NODE_VERSION = "v20.19.0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const launcherDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(launcherDir, "..", "..");
const runtimeDir = path.join(repoRoot, "runtime");
const tmpDir = path.join(runtimeDir, ".tmp");

function platformTag() {
  const os = process.platform;
  const arch = process.arch;
  if (os === "linux") {
    if (arch === "arm64") return "linux-arm64";
    return "linux-x64";
  }
  if (os === "darwin") {
    if (arch === "arm64") return "darwin-arm64";
    return "darwin-x64";
  }
  if (os === "win32") return "win-x64";
  throw new Error(`Unsupported platform ${os}-${arch}`);
}

const TAG = platformTag();
const IS_WINDOWS = process.platform === "win32";
const NODE_DIST = `node-${NODE_VERSION}-${TAG}`;

async function downloadNode() {
  const ext = IS_WINDOWS ? "zip" : "tar.gz";
  const url = `https://nodejs.org/dist/${NODE_VERSION}/${NODE_DIST}.${ext}`;
  const dest = path.join(tmpDir, `${NODE_DIST}.${ext}`);
  if (statSync(dest, { throwIfNoEntry: false })) return dest;

  console.log(`[build-sidecar] Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  mkdirSync(tmpDir, { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return dest;
}

function extractNode(archive) {
  const target = path.join(tmpDir, NODE_DIST);
  if (statSync(target, { throwIfNoEntry: false })) return target;
  mkdirSync(tmpDir, { recursive: true });
  if (IS_WINDOWS) {
    try {
      execFileSync("tar", ["-xf", archive, "-C", tmpDir], { stdio: "inherit" });
    } catch {
      execFileSync(
        "powershell",
        ["-NoProfile", "-Command", `Expand-Archive -Path '${archive}' -DestinationPath '${tmpDir}'`],
        { stdio: "inherit" },
      );
    }
  } else {
    execFileSync("tar", ["-xzf", archive, "-C", tmpDir], { stdio: "inherit" });
  }
  return target;
}

function installNodeBinary(extracted) {
  const nodeDir = path.join(runtimeDir, "node");
  mkdirSync(nodeDir, { recursive: true });

  let srcNode;
  let dstNode;
  if (IS_WINDOWS) {
    srcNode = path.join(extracted, "node.exe");
    dstNode = path.join(nodeDir, "node.exe");
  } else {
    srcNode = path.join(extracted, "bin", "node");
    dstNode = path.join(nodeDir, "bin", "node");
  }
  if (!statSync(srcNode, { throwIfNoEntry: false })) {
    throw new Error(`Node binary not found at ${srcNode}`);
  }
  mkdirSync(path.dirname(dstNode), { recursive: true });
  rmSync(dstNode, { force: true });
  renameSync(srcNode, dstNode);
  if (!IS_WINDOWS) chmodSync(dstNode, 0o755);
  console.log(`[build-sidecar] Node installed at ${dstNode}`);
}

// pnpm's legacy deploy layout is built from SYMLINKS into the .pnpm virtual
// store. Tauri's resource bundler silently drops symlinks, so a symlink-based
// runtime cannot resolve any dependency after packaging. Reinstall the deployed
// api with node-linker=hoisted so the bundled node_modules contains only real
// directories.
function flattenNodeModules(target) {
  // pnpm deploy copies the full workspace pnpm-lock.yaml into the target and
  // leaves a symlink-based node_modules. Both must go before a standalone
  // hoisted install, otherwise pnpm resolves against the workspace graph and
  // fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY) or keeps the symlink layout.
  rmSync(path.join(target, "pnpm-lock.yaml"), { force: true });
  rmSync(path.join(target, "node_modules"), { recursive: true, force: true });
  console.log("[build-sidecar] Reinstalling api deps with node-linker=hoisted (bundler-safe layout)");
  try {
    execFileSync(
      "pnpm",
      ["--dir", target, "install", "--prod", "--node-linker=hoisted", "--config.confirm-modules-purge=false"],
      { cwd: repoRoot, stdio: "inherit", shell: true },
    );
  } catch {
    // pnpm may exit non-zero when postinstall scripts are not approved
    // (ERR_PNPM_IGNORED_BUILDS for @prisma/client/@prisma/engines). The layout
    // is still materialized; the sanity checks below are the real gate.
    console.log("[build-sidecar] [WARN] pnpm install exited with warnings; validating layout anyway");
  }
}

// The deployed package has no prisma CLI (it is a devDependency) and `pnpm
// exec` trips over the workspace deps-status check, so generate directly from
// the workspace's prisma binary targeting the deployed schema. Prisma resolves
// node_modules from the schema location and writes into the target.
function regenPrismaClient(target) {
  const schema = path.join(target, "prisma", "schema.prisma").replace(/\\/g, "/");
  const prismaBin = path.join(repoRoot, "node_modules", ".bin", IS_WINDOWS ? "prisma.cmd" : "prisma");
  console.log(`[build-sidecar] Regenerating Prisma client into hoisted layout (${schema})`);
  execFileSync(prismaBin, ["generate", `--schema=${schema}`], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });
}

function assertBundlable(target) {
  const nestCore = path.join(target, "node_modules", "@nestjs", "core");
  const st = statSync(nestCore, { throwIfNoEntry: false });
  if (!st) {
    throw new Error(`Sanity check failed: ${nestCore} not found after deploy.`);
  }
  if (st.isSymbolicLink()) {
    throw new Error(
      `Sanity check failed: ${nestCore} is a symlink. node-linker=hoisted did not materialize the layout; the Tauri bundle would be broken.`,
    );
  }
  const prismaClient = path.join(target, "node_modules", ".prisma", "client", "default.js");
  if (!statSync(prismaClient, { throwIfNoEntry: false })) {
    throw new Error(`Sanity check failed: Prisma client not generated at ${prismaClient}.`);
  }
}

function packApi() {
  // Deploy + flatten MUST happen OUTSIDE the repo: pnpm resolves standalone
  // installs inside the workspace against the root pnpm-lock.yaml, whose graph
  // hangs on workspace-only packages and fails or hangs. /tmp is validated
  // (see runtime bundled from a /tmp staging) and clean of any workspace.
  const staging = path.join(os.tmpdir(), "arcom-runtime-staging");
  const target = path.join(runtimeDir, "api");
  rmSync(staging, { recursive: true, force: true });
  rmSync(target, { recursive: true, force: true });
  mkdirSync(runtimeDir, { recursive: true });
  console.log("[build-sidecar] Deploying api production deps via pnpm deploy");
  execFileSync(
    "pnpm",
    ["--filter", "api", "deploy", "--legacy", "--prod", "--config.confirm-modules-purge=false", staging],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: true,
    },
  );
  const main = path.join(staging, "dist", "main.js");
  if (!statSync(main, { throwIfNoEntry: false })) {
    throw new Error(`Expected built backend at ${main}. Run 'pnpm --filter api build' first.`);
  }
  flattenNodeModules(staging);
  regenPrismaClient(staging);
  assertBundlable(staging);
  for (const entry of [
    "src",
    "test",
    "e2e",
    "scripts",
    "dev.db",
    ".env",
    "jest.config.ts",
    "nest-cli.json",
    "project.json",
    "tsconfig.json",
    "tsconfig.spec.json",
  ]) {
    rmSync(path.join(staging, entry), { recursive: true, force: true });
  }
  try {
    renameSync(staging, target);
  } catch {
    cpSync(staging, target, { recursive: true });
    rmSync(staging, { recursive: true, force: true });
  }
  console.log(`[build-sidecar] API deployed to ${target}`);
}

function cleanup() {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`[build-sidecar] Packing runtime for ${TAG} (Node ${NODE_VERSION})`);
rmSync(tmpDir, { recursive: true, force: true });
const archive = await downloadNode();
const extracted = extractNode(archive);
installNodeBinary(extracted);
packApi();
cleanup();
console.log("[build-sidecar] Done.");