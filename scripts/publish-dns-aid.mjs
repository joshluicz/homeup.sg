/**
 * Publish DNS for AI Discovery (DNS-AID) records on Cloudflare for homeup.sg.
 *
 * Usage:
 *   node scripts/publish-dns-aid.mjs
 *   node scripts/publish-dns-aid.mjs --dry-run
 *
 * Requires in .env.local (or environment):
 *   CLOUDFLARE_API_TOKEN  — API token with Zone.DNS Edit + Zone.DNSSEC
 *   CLOUDFLARE_ZONE_ID    — optional; resolved from CLOUDFLARE_DOMAIN if omitted
 *   CLOUDFLARE_DOMAIN     — defaults to homeup.sg
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
const target = domain;

const HTTPS_RECORDS = [
  {
    name: "_index._agents",
    data: {
      priority: 1,
      target,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
  },
  {
    name: "_catalog._https._agents",
    data: {
      priority: 1,
      target,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
  },
];

const TXT_INDEX = {
  name: "_index._agents",
  content: "agents=catalog:https",
};

async function cf(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!body.success) {
    const msg = body.errors?.map((e) => e.message).join("; ") ?? res.statusText;
    throw new Error(msg);
  }
  return body.result;
}

async function resolveZoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID;
  const zones = await cf(`/zones?name=${encodeURIComponent(domain)}`);
  const zone = zones?.[0];
  if (!zone?.id) throw new Error(`Cloudflare zone not found for ${domain}`);
  return zone.id;
}

async function listRecords(zoneId, type, name) {
  const q = new URLSearchParams({ type, name: `${name}.${domain}` });
  return cf(`/zones/${zoneId}/dns_records?${q}`);
}

async function upsertHttps(zoneId, record) {
  const fqdn = `${record.name}.${domain}`;
  const existing = await listRecords(zoneId, "HTTPS", record.name);
  const payload = {
    type: "HTTPS",
    name: record.name,
    ttl: 3600,
    proxied: false,
    data: record.data,
  };

  if (dryRun) {
    console.log(`[dry-run] HTTPS ${fqdn} → ${record.data.target} (${record.data.value})`);
    return;
  }

  if (existing.length > 0) {
    await cf(`/zones/${zoneId}/dns_records/${existing[0].id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    console.log(`Updated HTTPS ${fqdn}`);
  } else {
    await cf(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log(`Created HTTPS ${fqdn}`);
  }
}

async function upsertTxt(zoneId, record) {
  const fqdn = `${record.name}.${domain}`;
  const existing = await listRecords(zoneId, "TXT", record.name);
  const payload = {
    type: "TXT",
    name: record.name,
    ttl: 3600,
    content: record.content,
  };

  if (dryRun) {
    console.log(`[dry-run] TXT ${fqdn} → "${record.content}"`);
    return;
  }

  const match = existing.find((r) => r.content === record.content);
  if (match) {
    console.log(`TXT ${fqdn} already present`);
    return;
  }

  await cf(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(`Created TXT ${fqdn}`);
}

async function ensureDnssec(zoneId) {
  const status = await cf(`/zones/${zoneId}/dnssec`);
  if (status.status === "active") {
    console.log("DNSSEC already active on zone");
    return status;
  }

  if (dryRun) {
    console.log("[dry-run] Would enable DNSSEC on zone");
    return status;
  }

  const result = await cf(`/zones/${zoneId}/dnssec`, { method: "PATCH", body: "{}" });
  console.log(`DNSSEC status: ${result.status}`);
  return result;
}

function printDsInstructions(dnssec) {
  if (!dnssec?.ds?.length) {
    console.log("\nNo DS records returned yet. In Cloudflare: DNS → Settings → DNSSEC.");
    console.log("Copy the DS digest(s) into your .sg registrar (SGNIC) for homeup.sg.");
    return;
  }

  console.log("\nAdd these DS record(s) at your domain registrar if not already published:\n");
  for (const ds of dnssec.ds) {
    console.log(`  ${ds.key_tag} ${ds.algorithm} ${ds.digest_type} ${ds.digest}`);
  }
  console.log("\nVerify with:");
  console.log(`  dig +short DS ${domain}`);
  console.log(`  dig +dnssec +cd HTTPS _index._agents.${domain}`);
}

async function main() {
  if (!token) {
    console.error("Missing CLOUDFLARE_API_TOKEN in .env.local or environment.");
    console.error("\nManual Cloudflare steps (DNS → Records):");
    for (const record of HTTPS_RECORDS) {
      console.error(
        `  HTTPS  ${record.name}  priority=${record.data.priority}  target=${record.data.target}  ${record.data.value}`,
      );
    }
    console.error(`  TXT    ${TXT_INDEX.name}  "${TXT_INDEX.content}"`);
    console.error("\nThen enable DNSSEC under DNS → Settings and add DS at SGNIC.");
    process.exit(1);
  }

  const zoneId = await resolveZoneId();
  console.log(`Zone: ${domain} (${zoneId})${dryRun ? " [dry-run]" : ""}\n`);

  for (const record of HTTPS_RECORDS) {
    await upsertHttps(zoneId, record);
  }
  await upsertTxt(zoneId, TXT_INDEX);

  const dnssec = await ensureDnssec(zoneId);
  printDsInstructions(dnssec);

  console.log("\nValidate:");
  console.log('  curl -s "https://cloudflare-dns.com/dns-query?name=_index._agents.homeup.sg&type=HTTPS" -H "accept: application/dns-json"');
  console.log('  POST https://isitagentready.com/api/scan  {"url":"https://homeup.sg"}');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
