#!/usr/bin/env node
/**
 * Runs a command with a ready database.
 *
 *   node scripts/with-db.mjs next dev
 *
 * When USE_EMBEDDED_POSTGRES is not "false", a local Postgres server is started from the
 * `embedded-postgres` package (no system install needed), data lives in .data/postgres.
 * Pending migrations are applied, and demo data is seeded the first time the database is empty.
 * Set USE_EMBEDDED_POSTGRES=false and point DATABASE_URL at your own Postgres to skip all of that
 * except migrations and first-run seeding.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");

// First run: create .env from .env.example with a fresh AUTH_SECRET.
const envPath = path.join(root, ".env");
if (!existsSync(envPath)) {
  const example = readFileSync(path.join(root, ".env.example"), "utf8");
  writeFileSync(
    envPath,
    example.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${randomBytes(32).toString("base64url")}"`)
  );
  console.log("[env] Created .env from .env.example");
}
dotenv.config({ path: envPath, quiet: true });
const args = process.argv.slice(2);
const useEmbedded = process.env.USE_EMBEDDED_POSTGRES !== "false";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const dbName = url.pathname.replace(/^\//, "") || "streamly";

const quote = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);

/**
 * Spawns a command. `shell` is needed on Windows for npx/.cmd shims; with a shell the command is
 * passed as one quoted string (Node deprecates array args + shell). Absolute binaries run without it.
 */
function spawnCommand(cmd, cmdArgs, shell) {
  const options = { cwd: root, stdio: "inherit", env: process.env };
  return shell
    ? spawn([cmd, ...cmdArgs].map(quote).join(" "), { ...options, shell: true })
    : spawn(cmd, cmdArgs, options);
}

function run(cmd, cmdArgs, { shell = process.platform === "win32" } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(cmd, cmdArgs, shell);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} ${cmdArgs.join(" ")} exited with ${code}`))));
    child.on("error", reject);
  });
}

async function canConnect(connectionString) {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 1500 });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

const dataDir = path.join(root, ".data", "postgres");
let pgCtl = null;

async function binaries() {
  const os = { win32: "windows", darwin: "darwin", linux: "linux" }[process.platform];
  return import(`@embedded-postgres/${os}-${process.arch}`);
}

async function startEmbedded() {
  if (await canConnect(databaseUrl)) {
    console.log(`[db] Postgres already running on port ${url.port}`);
    return;
  }

  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("[db] Creating local Postgres cluster in .data/postgres …");
    mkdirSync(path.dirname(dataDir), { recursive: true });
    const { default: EmbeddedPostgres } = await import("embedded-postgres");
    await new EmbeddedPostgres({
      databaseDir: dataDir,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      port: Number(url.port || 5432),
      persistent: true,
      initdbFlags: ["--encoding=UTF8", "--locale=C"],
      onLog: () => {},
    }).initialise();
  }

  // pg_ctl (rather than launching postgres directly) also works from Windows admin accounts.
  pgCtl = (await binaries()).pg_ctl;
  await run(pgCtl, ["-D", dataDir, "-o", `-p ${url.port || 5432}`, "-l", path.join(root, ".data", "postgres.log"), "-w", "-s", "start"], { shell: false });
  console.log(`[db] Local Postgres started on port ${url.port}`);

  const admin = new pg.Client({ connectionString: databaseUrl.replace(/\/[^/?]*(\?|$)/, "/postgres$1") });
  await admin.connect();
  const { rowCount } = await admin.query("select 1 from pg_database where datname = $1", [dbName]);
  if (!rowCount) {
    await admin.query(`create database "${dbName.replace(/"/g, "")}"`);
    console.log(`[db] Created database "${dbName}"`);
  }
  await admin.end();
}

async function stop() {
  if (pgCtl) {
    const ctl = pgCtl;
    pgCtl = null;
    await run(ctl, ["-D", dataDir, "-m", "fast", "-s", "stop"], { shell: false }).catch(() => {});
  }
}

async function needsSeed() {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const { rows } = await client.query('select count(*)::int as n from "User"');
    return rows[0].n === 0;
  } catch {
    // Schema not migrated yet (e.g. while creating the first migration).
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  if (useEmbedded) await startEmbedded();

  await run("npx", ["prisma", "migrate", "deploy"]);
  if (process.env.SKIP_SEED !== "true" && (await needsSeed())) {
    console.log("[db] Empty database, seeding demo data …");
    await run("npx", ["prisma", "db", "seed"]);
  }

  if (!args.length) {
    console.log("[db] Ready. Press Ctrl+C to stop.");
    const shutdown = async () => {
      await stop();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    await new Promise(() => {});
  }

  const [cmd, ...cmdArgs] = args;
  const child = spawnCommand(cmd, cmdArgs, process.platform === "win32");
  const forward = (signal) => child.kill(signal);
  process.on("SIGINT", forward);
  process.on("SIGTERM", forward);
  child.on("exit", async (code) => {
    await stop();
    process.exit(code ?? 0);
  });
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await stop();
  process.exit(1);
});
