/**
 * Disable Cloudflare Rocket Loader for homeup.sg.
 *
 * Rocket Loader breaks Next.js chunk loading (404 / text/plain MIME errors) and
 * prevents Radix dropdowns, hero animations, and other client features.
 *
 * Usage:
 *   node scripts/disable-cloudflare-rocket-loader.mjs
 *   node scripts/disable-cloudflare-rocket-loader.mjs --dry-run
 *
 * Requires in .env.local (or environment):
 *   CLOUDFLARE_API_TOKEN — Zone Settings Edit
 *   CLOUDFLARE_ZONE_ID   — optional; resolved from CLOUDFLARE_DOMAIN if omitted
 *   CLOUDFLARE_DOMAIN    — defaults to homeup.sg
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const dryRun = process.argv.includes("--dry-run");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const token = process.env.CLOUDFLARE_API_TOKEN;
const domain = process.env.CLOUDFLARE_DOMAIN ?? "homeup.sg";

async function resolveZoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(domain)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json()) as {
    success: boolean;
    result: { id: string; name: string }[];
    errors?: { message: string }[];
  };
  if (!json.success || !json.result?.[0]?.id) {
    throw new Error(json.errors?.[0]?.message ?? `Zone not found for ${domain}`);
  }
  return json.result[0].id;
}

async function getRocketLoader(zoneId: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/rocket_loader`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json()) as {
    success: boolean;
    result: { value: string };
    errors?: { message: string }[];
  };
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message ?? "Failed to read rocket_loader setting");
  }
  return json.result.value;
}

async function setRocketLoader(zoneId: string, value: "on" | "off") {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/rocket_loader`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    },
  );
  const json = (await res.json()) as {
    success: boolean;
    result: { value: string };
    errors?: { message: string }[];
  };
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message ?? "Failed to update rocket_loader setting");
  }
  return json.result.value;
}

async function main() {
  if (!token) {
    console.error("Missing CLOUDFLARE_API_TOKEN. Add it to .env.local and retry.");
    console.error("Or disable manually: Cloudflare → Speed → Settings → Rocket Loader → Off");
    process.exit(1);
  }

  const zoneId = await resolveZoneId();
  const current = await getRocketLoader(zoneId);
  console.log(`Zone ${domain} (${zoneId}): rocket_loader=${current}`);

  if (current === "off") {
    console.log("Rocket Loader is already off. No change needed.");
    return;
  }

  if (dryRun) {
    console.log("[dry-run] Would set rocket_loader=off");
    return;
  }

  const next = await setRocketLoader(zoneId, "off");
  console.log(`Updated rocket_loader=${next}`);
  console.log("Purge browser cache and hard-refresh https://homeup.sg/");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
