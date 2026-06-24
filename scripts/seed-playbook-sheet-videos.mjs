/**
 * Seed playbook_videos from the Dennis content sheet (YouTube / TikTok shorts).
 * Run: node scripts/seed-playbook-sheet-videos.mjs
 *
 * Sync sheet first: node scripts/sync-playbook-sheet-videos.mjs
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

const SHEET_ROWS = JSON.parse(
  readFileSync(resolve(ROOT, "lib/data/playbook-sheet-videos.json"), "utf8"),
);

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function videoIdFromUrl(url) {
  const yt = url.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]+)/);
  if (yt?.[1]) return yt[1].slice(0, 16);
  const tt = url.match(/video\/(\d+)/);
  if (tt?.[1]) return tt[1].slice(-12);
  return "";
}

function uniqueSlug(title, url, used) {
  let base = slugify(title);
  if (!base || base === "skit") {
    const id = videoIdFromUrl(url);
    base = id ? `video-${id}` : base || "video";
  }
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  used.add(slug);
  return slug;
}

function inferCategory(tag1, tag2) {
  const tags = `${tag1} ${tag2}`.toLowerCase();
  if (tags.includes("hdb") && tags.includes("news")) return "market";
  if (tags.includes("news") || tags.includes("en bloc")) return "market";
  if (tags.includes("hdb")) return "selling";
  if (tags.includes("condo") || tags.includes("landed")) return "tips";
  if (tags.includes("live") || tags.includes("new launch")) return "buying";
  return "tips";
}

async function main() {
  const usedSlugs = new Set();
  let upserted = 0;
  for (const row of SHEET_ROWS) {
    const slug = uniqueSlug(row.title, row.url, usedSlugs);
    const tags = [row.tag1, row.tag2].map((t) => t.trim()).filter(Boolean);
    const payload = {
      slug,
      title: row.title,
      description: row.title,
      category: inferCategory(row.tag1, row.tag2),
      duration: "",
      thumbnail: row.thumbnail?.trim() ?? "",
      video_url: row.url,
      featured: false,
      published_at: "2026-01-01",
      tags,
      topic: row.topic,
      article: "",
      meta_description: "",
      faq: [],
    };

    const { error } = await supabase.from("playbook_videos").upsert(payload, {
      onConflict: "slug",
    });
    if (error) {
      console.error("Failed:", slug, error.message);
    } else {
      upserted++;
    }
  }
  console.log(`Upserted ${upserted} sheet videos.`);
}

main();
