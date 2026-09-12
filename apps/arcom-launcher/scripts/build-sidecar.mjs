#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { chmodSync, mkdirSync, rmSync, renameSync, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
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

function packApi() {
  const target = path.join(runtimeDir, "api");
  rmSync(target, { recursive: true, force: true });
  console.log("[build-sidecar] Deploying api production deps via pnpm deploy");
  execFileSync(
    "pnpm",
    ["--filter", "api", "deploy", "--legacy", "--prod", "--config.confirm-modules-purge=false", target],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );
  const main = path.join(target, "dist", "main.js");
  if (!statSync(main, { throwIfNoEntry: false })) {
    throw new Error(`Expected built backend at ${main}. Run 'pnpm --filter api build' first.`);
  }
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
    rmSync(path.join(target, entry), { recursive: true, force: true });
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