/**
 * Direct pipeline smoke test (no browser session required).
 * Uses service-role Supabase client for blueprint insert.
 *
 * Usage: npx tsx scripts/test-pipeline-direct.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { runGenerateBlueprint } from "../lib/pipeline/generate-blueprint";
import { validateApproveInput, splitRoomsForProcessing } from "../lib/pipeline/validate-approve-input";
import { startRoomClip } from "../lib/pipeline/room-clip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

for (const envPath of [
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, "apps/media/.env.local"),
  path.join(repoRoot, "apps/media/.env.vercel.production"),
]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
] as const;

const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
if (missing.length > 0) {
  console.error("Missing env:", missing.join(", "));
  process.exit(1);
}

const UPLOADED_BY =
  process.env.MOCK_BLUEPRINT_UPLOADED_BY ??
  "2663a5bd-381e-4b43-912b-f8b7bdea3daa";

const MOCK_PAYLOAD = {
  address: `Pipeline test ${new Date().toISOString()}`,
  property_type: "HDB Flat",
  listing_title: "Pipeline direct test",
  listing_type: "For Sale",
  rooms: "3 rooms",
  bedrooms: "2",
  bathrooms: "1",
  sqft: "850",
  area_sqm: "79",
  price_range: "$650,000",
  price_psf: "$765",
  tenure: "99 yrs",
  condition: "Move-in ready",
  selling_points: "Automated pipeline test",
  renovation_status: "Fully renovated",
  agent_notes: "test-pipeline-direct.ts",
  uploaded_by: UPLOADED_BY,
  room_photos: [
    {
      label: "Living Room",
      duration_seconds: 6,
      r2_url:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
      image_urls: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
      ],
    },
  ],
};

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  console.log("1/3 Testing blueprint generation (Claude + Supabase)...");
  const started = Date.now();
  const result = await runGenerateBlueprint(supabase, MOCK_PAYLOAD);
  console.log(`   OK in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log("   ", JSON.stringify(result));

  const { data: row, error } = await supabase
    .from("blueprints")
    .select("id, status, property_name, script")
    .eq("id", result.blueprint_id)
    .single();

  if (error || !row?.id) {
    throw new Error(error?.message ?? "Blueprint row not found after insert");
  }
  console.log("   DB row confirmed:", row.id, row.status);

  console.log("\n2/3 Testing fal clip start (submit only, no wait)...");
  if (!process.env.FAL_API_KEY?.trim()) {
    console.log("   SKIP — FAL_API_KEY not set locally (likely only on Vercel)");
  } else {
  const approveBody = {
    blueprint_id: result.blueprint_id,
    room_photos: [
      {
        label: "Living Room",
        r2_url: MOCK_PAYLOAD.room_photos[0].r2_url,
        image_urls: MOCK_PAYLOAD.room_photos[0].image_urls,
        higgsfield_prompt:
          "Slow pan right across @Image1 visible living room only. Soft natural daylight, calm editorial mood. Duration: 6s. Empty room, no people.",
        duration_seconds: 6,
      },
    ],
  };
  validateApproveInput(approveBody);
  const task = splitRoomsForProcessing(
    approveBody.blueprint_id,
    approveBody.room_photos,
  )[0];

  const clipStart = await startRoomClip({
    blueprint_id: task.blueprint_id,
    label: task.label,
    r2_url: task.r2_url,
    image_urls: task.image_urls,
    higgsfield_prompt: task.higgsfield_prompt,
    duration_seconds: task.duration_seconds,
  });

  if (!clipStart.success || !clipStart.job_id) {
    throw new Error(clipStart.error ?? "fal clip start failed");
  }
  console.log("   OK fal job_id:", clipStart.job_id);
  }

  console.log("\n3/3 All direct pipeline checks passed.");
  console.log("   blueprint_id:", result.blueprint_id);
  console.log("   Next: test approve + clips in UI at /generate");
}

main().catch((err) => {
  console.error("\nFAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
