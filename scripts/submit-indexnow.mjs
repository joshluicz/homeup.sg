#!/usr/bin/env node
/**
 * Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver).
 * Key file must be live at https://homeup.sg/<key>.txt
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs                     # core site URLs
 *   node scripts/submit-indexnow.mjs --listings          # /listings + all active slugs
 *   node scripts/submit-indexnow.mjs --playbook          # /playbook + all article slugs
 *   node scripts/submit-indexnow.mjs --all               # listings + playbook
 *   node scripts/submit-indexnow.mjs https://homeup.sg/foo
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const HOST = "homeup.sg";
const SITE_URL = `https://${HOST}`;
const KEY = "homeupsg2026indexnowbingyandex01";
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const CORE_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/playbook`,
  `${SITE_URL}/sell`,
  `${SITE_URL}/buy`,
  `${SITE_URL}/about`,
  `${SITE_URL}/listings`,
  `${SITE_URL}/agents`,
  `${SITE_URL}/sitemap.xml`,
];

function loadEnv() {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) merged[match[1].trim()] = match[2].trim();
    }
  }
  return merged;
}

function isArticleRow(row) {
  const article = (row.article ?? "").trim();
  const videoUrl = (row.video_url ?? "").trim();
  if (article && videoUrl) return true;
  if (videoUrl && !article) return false;
  return Boolean(article);
}

async function fetchListingUrls(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("Skipping listing slugs: missing Supabase env vars");
    return [`${SITE_URL}/listings`];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("slug")
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) throw new Error(`listings fetch failed: ${error.message}`);
  const slugs = (data ?? []).map((row) => row.slug).filter(Boolean);
  return [`${SITE_URL}/listings`, ...slugs.map((slug) => `${SITE_URL}/listings/${slug}`)];
}

async function fetchPlaybookArticleUrls(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("Skipping playbook article slugs: missing Supabase env vars");
    return [`${SITE_URL}/playbook`];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("slug, article, video_url");

  if (error) throw new Error(`playbook fetch failed: ${error.message}`);
  const slugs = (data ?? []).filter(isArticleRow).map((row) => row.slug).filter(Boolean);
  return [`${SITE_URL}/playbook`, ...slugs.map((slug) => `${SITE_URL}/playbook/${slug}`)];
}

async function resolveUrls(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const explicit = argv.filter((arg) => !arg.startsWith("--"));

  if (explicit.length > 0) return explicit;

  if (flags.has("--all") || flags.has("--listings") || flags.has("--playbook")) {
    const env = loadEnv();
    const urls = [];

    if (flags.has("--all") || flags.has("--listings")) {
      urls.push(...(await fetchListingUrls(env)));
    }
    if (flags.has("--all") || flags.has("--playbook")) {
      urls.push(...(await fetchPlaybookArticleUrls(env)));
    }

    return [...new Set(urls)];
  }

  return CORE_URLS;
}

const urls = await resolveUrls(process.argv.slice(2));
const unique = [...new Set(urls.filter(Boolean))];

if (unique.length === 0) {
  console.error("No URLs to submit.");
  process.exit(1);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: unique,
  }),
});

const text = await res.text();
if (res.ok) {
  console.log(`IndexNow OK (${res.status}): submitted ${unique.length} URL(s)`);
} else {
  console.error(`IndexNow failed (${res.status}): ${text || res.statusText}`);
  process.exit(1);
}
