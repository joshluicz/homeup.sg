/**
 * Mirrors .github/workflows/deploy.yml — strips server-only routes, then static-exports.
 * Usage: npm run build:lp
 *
 * Stop `npm run dev` first on Windows — file locks will block the strip step.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const BAK_ROOT = path.join(root, ".lp-static-bak");

const STRIP_PATHS = [
  path.join(root, "app", "api"),
  path.join(root, "app", "(admin)"),
];

const MIDDLEWARE = path.join(root, "middleware.ts");

const stripped = [];

function backupPath(target) {
  return path.join(BAK_ROOT, path.relative(root, target));
}

function stripPath(target) {
  if (!fs.existsSync(target)) return;

  const backup = backupPath(target);
  fs.mkdirSync(path.dirname(backup), { recursive: true });

  if (fs.existsSync(backup)) {
    fs.rmSync(backup, { recursive: true, force: true });
  }

  try {
    fs.renameSync(target, backup);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EPERM") {
      console.error(
        "\n✗ Could not move server-only files — they are likely locked by `npm run dev`.\n" +
          "  Stop the dev server, then run `npm run build:lp` again.\n",
      );
      process.exit(1);
    }
    throw error;
  }

  stripped.push({ target, backup });
}

function restoreAll() {
  for (const { target, backup } of stripped.reverse()) {
    if (!fs.existsSync(backup)) continue;
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(backup, target);
  }
  stripped.length = 0;
  if (fs.existsSync(BAK_ROOT)) {
    fs.rmSync(BAK_ROOT, { recursive: true, force: true });
  }
}

let exitCode = 0;

try {
  if (fs.existsSync(BAK_ROOT)) {
    fs.rmSync(BAK_ROOT, { recursive: true, force: true });
  }

  for (const p of STRIP_PATHS) stripPath(p);
  stripPath(MIDDLEWARE);

  const result = spawnSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "true" },
    shell: true,
  });

  if (result.status !== 0) {
    exitCode = result.status ?? 1;
  } else {
    console.log("\n✓ Static export written to ./out");
  }
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  restoreAll();
}

process.exit(exitCode);
