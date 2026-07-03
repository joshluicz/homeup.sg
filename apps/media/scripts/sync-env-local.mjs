#!/usr/bin/env node
/**
 * Merge env files into apps/media/.env.local without overwriting existing values.
 * Sources: root .env.local, .env.vercel.production, existing apps/media/.env.local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.resolve(__dirname, "..");
const target = path.join(mediaDir, ".env.local");

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "FAL_API_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_URL",
  "MEDIA_WEBHOOK_SECRET",
];

const sources = [
  path.join(mediaDir, "../../.env.local"),
  path.join(mediaDir, ".env.vercel.production"),
  target,
];

function parseEnvFile(filePath) {
  const out = new Map();
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.set(key, value);
  }
  return out;
}

const merged = new Map();
for (const source of sources) {
  for (const [key, value] of parseEnvFile(source)) {
    if (!merged.has(key) && value) merged.set(key, value);
  }
}

const existing = parseEnvFile(target);
for (const key of KEYS) {
  if (!existing.get(key) && merged.get(key)) {
    existing.set(key, merged.get(key));
  }
}

const lines = [
  "# Auto-synced for local media dev. Do not commit.",
  ...KEYS.filter((key) => existing.get(key)).map(
    (key) => `${key}=${existing.get(key)}`,
  ),
];

fs.writeFileSync(target, `${lines.join("\n")}\n`, "utf8");

const report = KEYS.map((key) => {
  const val = existing.get(key);
  return `${key}=${val ? "set" : "MISSING"}`;
});

console.log("Synced apps/media/.env.local:");
console.log(report.join("\n"));
