/**
 * Fetch each agent's YouTube channel (RSS feed, up to 15 videos) and upsert
 * into agent_profile_videos so the admin panel lists all of them.
 *
 * Run: node scripts/seed-agent-youtube-videos.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const AGENTS = [
  { slug: "dennis-lim",   name: "Dennis Lim",   handle: "homeupdennis" },
  { slug: "yeo-tong-boon", name: "Yeo Tong Boon", handle: "homeup_tongboon" },
  { slug: "edmund-lee",   name: "Edmund Lee",   handle: "edmundlee9189" },
  { slug: "kenji-ching",  name: "Kenji Ching",  handle: "homeup_kenji" },
  { slug: "olivia-neo",   name: "Olivia Neo",   handle: "homeupolivia" },
  { slug: "isaac-tay",    name: "Isaac Teh",    handle: "homeup_isaac" },
];

async function resolveChannelId(handle) {
  const res = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HomeUPBot/1.0)" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match =
    html.match(/"channelId":"(UC[^"]+)"/) ??
    html.match(/"externalId":"(UC[^"]+)"/) ??
    html.match(/channel_id=(UC[^&"]+)/);
  return match?.[1] ?? null;
}

function parseAllFromRss(xml) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  return entries.map((entry) => {
    const content = entry[1];
    const id = content.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = content.match(/<title>([^<]+)<\/title>/)?.[1] ?? "Video";
    return { id, title };
  }).filter((v) => v.id);
}

async function fetchChannelVideos(channelId) {
  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
  );
  if (!res.ok) return [];
  const xml = await res.text();
  return parseAllFromRss(xml);
}

async function upsertVideo(agentSlug, title, videoUrl, sortOrder) {
  const { data: existing } = await supabase
    .from("agent_profile_videos")
    .select("id")
    .eq("agent_slug", agentSlug)
    .eq("video_url", videoUrl)
    .maybeSingle();

  const payload = {
    agent_slug: agentSlug,
    title,
    video_url: videoUrl,
    featured_in_display_a: false,
    featured_in_display_b: false,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    // Don't overwrite display flags — only update title/sort
    await supabase
      .from("agent_profile_videos")
      .update({ title, sort_order: sortOrder, updated_at: payload.updated_at })
      .eq("id", existing.id);
    return "updated";
  }

  await supabase.from("agent_profile_videos").insert(payload);
  return "created";
}

async function main() {
  for (const agent of AGENTS) {
    console.log(`\n→ ${agent.name} (@${agent.handle})`);

    const channelId = await resolveChannelId(agent.handle);
    if (!channelId) {
      console.log(`  ⚠️  Could not resolve channel ID`);
      continue;
    }

    const videos = await fetchChannelVideos(channelId);
    if (videos.length === 0) {
      console.log(`  ⚠️  No videos found`);
      continue;
    }

    let created = 0, updated = 0;
    for (let i = 0; i < videos.length; i++) {
      const { id, title } = videos[i];
      const url = `https://www.youtube.com/watch?v=${id}`;
      const result = await upsertVideo(agent.slug, title, url, i);
      if (result === "created") created++;
      else updated++;
    }

    console.log(`  ✅ ${videos.length} videos — created ${created}, updated ${updated}`);
  }

  console.log("\nDone. Open Admin → Agent Videos to manage Display A / Display B per video.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
