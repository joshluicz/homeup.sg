#!/usr/bin/env node
/**
 * Warm ISR/static cache for all playbook article URLs after deploy.
 * Prevents Googlebot's first crawl from hitting a cold serverless 500.
 *
 * Usage: npm run playbook:warm
 */

import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE_URL = "https://homeup.sg";
const UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function loadEnv() {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const envPath = resolve(ROOT, file);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) merged[match[1].trim()] = match[2].trim();
    }
  }
  return merged;
}

async function fetchSlugsFromSupabase(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("slug, article, video_url");

  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row) => Boolean((row.article ?? "").trim()))
    .map((row) => row.slug)
    .filter(Boolean);
}

function slugsFromJson() {
  const jsonPath = resolve(ROOT, "lib/data/playbook-final-10-articles.json");
  const entries = JSON.parse(readFileSync(jsonPath, "utf8"));
  return entries.map((entry) => entry.slug).filter(Boolean);
}

async function warmUrl(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
  });
  return { url, status: res.status, ok: res.ok };
}

const env = loadEnv();
let slugs = [];
try {
  slugs = await fetchSlugsFromSupabase(env);
} catch (error) {
  console.warn("Supabase slug fetch failed, using JSON fallback:", error.message);
}
if (slugs.length === 0) slugs = slugsFromJson();

const urls = [
  `${SITE_URL}/playbook`,
  ...slugs.map((slug) => `${SITE_URL}/playbook/${slug}`),
];

let failed = 0;
for (const url of urls) {
  const result = await warmUrl(url);
  const mark = result.ok ? "OK" : "FAIL";
  console.log(`${mark} (${result.status}) ${url}`);
  if (!result.ok) failed++;
}

if (failed > 0) {
  console.error(`\n${failed} URL(s) failed warmup.`);
  process.exit(1);
}

console.log(`\nWarmed ${urls.length} playbook URL(s).`);
