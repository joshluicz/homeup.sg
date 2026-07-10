/**
 * Auto-categorises all agent_profile_videos by scanning their titles.
 * Run with: node scripts/categorise-agent-videos.mjs
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (not the anon key — needs write access)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function classify(title) {
  const t = title.toLowerCase();

  // ── Home Tour ──────────────────────────────────────────────
  if (
    t.includes("home tour") ||
    t.includes("hometour") ||
    t.includes("showflat") ||
    t.includes("show flat") ||
    t.includes("open house") ||
    t.includes("live balloting") ||
    t.includes("outdoor live")
  ) {
    return "home_tour";
  }

  // ── Landed ────────────────────────────────────────────────
  if (
    t.includes("bungalow") ||
    t.includes("cluster house") ||
    t.includes("private lift") ||
    t.includes("smaller landed") ||
    (t.includes("terrace") && !t.includes("testimonial")) ||
    (t.includes("freehold") && t.includes("terrace")) ||
    (t.includes("landed") &&
      !t.includes("testimonial") &&
      !t.includes("inherited") &&
      !t.includes("hdb") &&
      !t.includes("seller"))
  ) {
    return "landed";
  }

  // ── Property Tips ─────────────────────────────────────────
  if (
    t.includes("should you") ||
    t.includes("why") ||
    t.includes("how") ||
    t.includes("tip") ||
    t.includes("absd") ||
    t.includes("en bloc") ||
    t.includes("enbloc") ||
    t.includes("psf") ||
    t.includes("capital appreciation") ||
    t.includes("resale") ||
    t.includes("99-1") ||
    t.includes("decouple") ||
    t.includes("new launch") ||
    t.includes("hdb") ||
    t.includes("condo") ||
    t.includes("testimonial") ||
    t.includes("sold") ||
    t.includes("freehold") ||
    t.includes("inherited") ||
    t.includes("interview") ||
    t.includes("buyer") ||
    t.includes("owner") ||
    t.includes("sell") ||
    t.includes("buy") ||
    t.includes("government") ||
    t.includes("policy") ||
    t.includes("iras") ||
    t.includes("retire") ||
    t.includes("high floor") ||
    t.includes("low floor") ||
    t.includes("pre war") ||
    t.includes("sue") ||
    t.includes("charged") ||
    t.includes("integrated") ||
    t.includes("concurrent") ||
    t.includes("commission") ||
    t.includes("law firm") ||
    t.includes("upgrader") ||
    t.includes("starpoint") ||
    t.includes("mandarin garden") ||
    t.includes("citylife") ||
    t.includes("braddell") ||
    t.includes("watercolour") ||
    t.includes("regentville") ||
    t.includes("promise") ||
    t.includes("wait") ||
    t.includes("invest") ||
    t.includes("first") ||
    t.includes("rivelle") ||
    t.includes("age ")
  ) {
    return "property_tips";
  }

  return "others";
}

async function main() {
  console.log("Fetching all agent profile videos...");

  const { data: videos, error } = await supabase
    .from("agent_profile_videos")
    .select("id, title, category");

  if (error) {
    console.error("Failed to fetch videos:", error.message);
    process.exit(1);
  }

  console.log(`Found ${videos.length} videos. Classifying...`);

  const updates = videos.map((v) => ({
    id: v.id,
    current: v.category,
    proposed: classify(v.title),
    title: v.title,
  }));

  const changed = updates.filter((u) => u.proposed !== u.current);
  const unchanged = updates.filter((u) => u.proposed === u.current);

  console.log(`\n${unchanged.length} already correct, ${changed.length} to update.\n`);

  if (changed.length === 0) {
    console.log("Nothing to update.");
    return;
  }

  // Preview
  const byCategory = {};
  for (const u of updates) {
    byCategory[u.proposed] = (byCategory[u.proposed] || 0) + 1;
  }
  console.log("Category distribution after update:");
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log("\nUpdating...");

  // Batch by proposed category for efficiency
  const byCat = {};
  for (const u of changed) {
    if (!byCat[u.proposed]) byCat[u.proposed] = [];
    byCat[u.proposed].push(u.id);
  }

  for (const [category, ids] of Object.entries(byCat)) {
    const { error: updateError } = await supabase
      .from("agent_profile_videos")
      .update({ category, updated_at: new Date().toISOString() })
      .in("id", ids);

    if (updateError) {
      console.error(`Failed to update ${category}:`, updateError.message);
    } else {
      console.log(`  ✓ ${ids.length} videos → ${category}`);
    }
  }

  console.log("\nDone! Categories updated successfully.");
}

main();
