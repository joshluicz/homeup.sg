#!/usr/bin/env node
/**
 * Smoke-test phase 1 blueprint generation via the live n8n webhook.
 *
 * Usage:
 *   node apps/media/scripts/test-mock-blueprint.mjs
 *
 * Env:
 *   MOCK_BLUEPRINT_UPLOADED_BY — auth.users UUID (required shape; default below)
 *   N8N_GENERATE_BLUEPRINT_WEBHOOK — override webhook URL
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — optional DB verify fallback
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const envLocal = path.join(repoRoot, ".env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const WEBHOOK =
  process.env.N8N_GENERATE_BLUEPRINT_WEBHOOK ??
  "https://n8n-production-d50a.up.railway.app/webhook/homeup-generate-blueprint";

// blueprints.uploaded_by is uuid REFERENCES auth.users(id) — not an email.
const UPLOADED_BY =
  process.env.MOCK_BLUEPRINT_UPLOADED_BY ??
  "2663a5bd-381e-4b43-912b-f8b7bdea3daa";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidUploadedBy(value) {
  if (!value || typeof value !== "string") {
    console.error(
      "uploaded_by is missing. Set MOCK_BLUEPRINT_UPLOADED_BY to a real auth.users UUID.",
    );
    process.exit(1);
  }
  if (value.includes("@")) {
    console.error(
      `uploaded_by must be a UUID, not an email (got "${value}").\n` +
        "blueprints.uploaded_by references auth.users(id).\n" +
        "Set MOCK_BLUEPRINT_UPLOADED_BY to your Supabase user id, e.g.:\n" +
        "  MOCK_BLUEPRINT_UPLOADED_BY=2663a5bd-381e-4b43-912b-f8b7bdea3daa node apps/media/scripts/test-mock-blueprint.mjs",
    );
    process.exit(1);
  }
  if (!UUID_RE.test(value)) {
    console.error(
      `uploaded_by does not look like a UUID (got "${value}").\n` +
        "Set MOCK_BLUEPRINT_UPLOADED_BY to a valid auth.users id.",
    );
    process.exit(1);
  }
}

async function verifyInSupabase(propertyName) {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      "\nSkipping Supabase verify (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable).",
    );
    return null;
  }

  const query = new URL(`${url}/rest/v1/blueprints`);
  query.searchParams.set("property_name", `eq.${propertyName}`);
  query.searchParams.set("order", "created_at.desc");
  query.searchParams.set("limit", "1");
  query.searchParams.set("select", "id,property_name,status,created_at,uploaded_by");

  const res = await fetch(query, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const rows = await res.json();
  if (!res.ok) {
    console.warn("\nSupabase verify failed:", JSON.stringify(rows));
    return null;
  }
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

assertValidUploadedBy(UPLOADED_BY);

const MOCK_ADDRESS = "123 Mock Street, Singapore 123456";

const MOCK_PAYLOAD = {
  address: MOCK_ADDRESS,
  property_type: "HDB Flat",
  listing_title: "Mock 4-Room HDB Test (smoke)",
  listing_type: "For Sale",
  rooms: "4 rooms",
  bedrooms: "3",
  bathrooms: "2",
  sqft: "968",
  area_sqm: "90",
  price_range: "$750,000",
  price_psf: "$775",
  tenure: "99 yrs",
  condition: "Move-in ready",
  selling_points: "North-facing, renovated kitchen, near MRT",
  renovation_status: "Fully renovated",
  agent_notes: "Automated mock blueprint smoke test",
  uploaded_by: UPLOADED_BY,
  room_photos: [
    {
      label: "Living Room",
      duration_seconds: 10,
      r2_url:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
      image_urls: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
      ],
    },
    {
      label: "Kitchen",
      duration_seconds: 10,
      r2_url:
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80",
      image_urls: [
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80",
      ],
    },
  ],
};

const started = Date.now();
console.log(`POST ${WEBHOOK}`);
console.log(`uploaded_by: ${UPLOADED_BY}`);
console.log("Payload:", JSON.stringify(MOCK_PAYLOAD, null, 2));

const res = await fetch(WEBHOOK, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(MOCK_PAYLOAD),
});

const text = await res.text();
const elapsed = ((Date.now() - started) / 1000).toFixed(1);

console.log(`\nStatus: ${res.status} (${elapsed}s)`);
console.log("Body:", text.trim() ? text.slice(0, 2000) : "(empty)");

if (!res.ok) {
  process.exit(1);
}

let blueprintId = null;

if (text.trim()) {
  try {
    const data = JSON.parse(text);
    blueprintId = data.blueprint_id ?? null;
    if (blueprintId) {
      console.log(`\nOK — blueprint_id from webhook: ${blueprintId}`);
      process.exit(0);
    }
    console.warn("\nWarning: 200 JSON but no blueprint_id in response");
  } catch {
    console.warn("\nWarning: 200 but body is not JSON");
  }
} else {
  console.warn("\nWarning: 200 with empty body — checking Supabase...");
}

const row = await verifyInSupabase(MOCK_ADDRESS);
if (row?.id) {
  console.log(`\nOK — blueprint saved in Supabase: ${row.id}`);
  console.log(JSON.stringify(row, null, 2));
  process.exit(0);
}

console.error(
  "\nFAIL — no blueprint_id in webhook response and no matching row in Supabase.",
);
process.exit(1);
