/**
 * One-command bootstrap for the admin-panel development database.
 *
 * Brings up Postgres and leaves it with the schema, the case-insensitive
 * email index, and demo data already applied. Without this, a fresh clone
 * needs three commands in the right order, and a mistyped one fails with an
 * opaque "relation does not exist" from Prisma.
 *
 *   pnpm --filter admin-panel db:up      # up + schema + invariants + seed
 *   pnpm --filter admin-panel db:reset   # destroy the volume and redo it all
 *
 * Why not a Dockerfile: the official postgres:16-alpine image is already the
 * artifact we want. A wrapper image would only add a layer, and running
 * migrations from inside the image is circular — `prisma db push` needs a
 * live server, but the image's entrypoint is what starts that server.
 * Schema application has to happen after the container is healthy, which is
 * exactly what this script does.
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const composeFile = resolve(appDir, "docker-compose.yml");
const reset = process.argv.includes("--reset");

/**
 * Single source of truth for the connection string, injected into every
 * child process below.
 *
 * It is deliberately NOT read from a file. Three different conventions are
 * in play in this app and they do not agree:
 *   - Next.js reads .env.local
 *   - prisma CLI reads .env (and only .env) from the cwd / schema folder
 *   - the seed uses dotenv/config, which also only reads .env
 *
 * So a DATABASE_URL placed in .env.local is invisible to `prisma db push`
 * and to the seed. Keeping the value here means `db:up` works on a fresh
 * clone with no .env file at all, and there is no second copy to drift.
 * The runtime env for `next dev` still comes from .env.local.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5436/admin_panel?schema=public";

const childEnv = { ...process.env, DATABASE_URL };

/** Run a command, inheriting stdio. Rejects on a non-zero exit code. */
function run(command, args, options = {}) {
  return new Promise((res, rej) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });
    child.on("error", rej);
    child.on("close", (code) =>
      code === 0 ? res() : rej(new Error(`${command} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

const compose = (args) => run("docker", ["compose", "-f", composeFile, ...args]);

/**
 * Poll `docker inspect` for the healthcheck instead of sleeping a fixed
 * amount. Container init (initdb) takes variable time depending on disk
 * speed, so a fixed sleep is either flaky or needlessly slow.
 */
async function waitForHealthy(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { stdout } = await new Promise((res) => {
      const child = spawn(
        "docker",
        ["inspect", "-f", "{{.State.Health.Status}}", "arcom-admin-db"],
        { stdio: ["ignore", "pipe", "ignore"] },
      );
      let out = "";
      child.stdout.on("data", (d) => (out += d));
      child.on("close", () => res({ stdout: out.trim() }));
      child.on("error", () => res({ stdout: "" }));
    });

    if (stdout === "healthy") return;
    if (Date.now() > deadline) {
      throw new Error(
        `Postgres did not become healthy within ${timeoutMs / 1000}s. ` +
          `Check: docker logs arcom-admin-db`,
      );
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  if (reset) {
    console.log("→ Resetting volume (all data destroyed)...");
    await compose(["down", "-v"]);
  }

  console.log("→ Starting Postgres on 127.0.0.1:5436...");
  await compose(["up", "-d"]);
  await waitForHealthy();
  console.log("→ Healthy.");

  // prisma db push (not migrate): this schema has no migrations folder,
  // it is synced from the Prisma schema directly.
  console.log("→ Applying schema (prisma db push)...");
  await run(
    "npx",
    ["prisma", "db", "push", "--schema", "../../packages/prisma-schema/prisma/schema.prisma"],
    { cwd: appDir, env: childEnv },
  );

  // Prisma's @unique on Client.email is case-sensitive, so it cannot enforce
  // "one account per address" once emails differ only in case. This index
  // is what actually prevents duplicate clients.
  console.log("→ Applying invariants (case-insensitive email index)...");
  await run("node", ["scripts/apply-db-invariants.mjs"], { cwd: appDir, env: childEnv });

  console.log("→ Seeding demo data...");
  await run("npx", ["tsx", "../../packages/prisma-schema/prisma/seed.ts"], {
    cwd: appDir,
    env: childEnv,
  });

  console.log(`
✓ Admin dev database ready.

  DATABASE_URL="postgresql://postgres:postgres@localhost:5436/admin_panel?schema=public"
  container:  arcom-admin-db (:5436)
  admin:     admin@arcom.local / admin123

Next: pnpm dev:admin   (then point the POS at it with
  VITE_CLOUD_API_BASE="http://localhost:3001" in apps/pos-react/.env)

The POS validates licenses offline from a signed token; it never queries
this database directly. It goes through the admin panel's HTTP API
(POST /api/license/issue).
`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
