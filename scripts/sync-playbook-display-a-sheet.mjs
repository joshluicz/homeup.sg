/**
 * Sync "To add to Display A" videos from the Display A sheet tab into playbook-sheet-videos.json.
 * Sheet: https://docs.google.com/spreadsheets/d/1bD-rUgNFWZnJ_aTpq23E-hemLe4xYIWFtbLAc8GtuRs/edit?gid=1510382308
 *
 * Run: node scripts/sync-playbook-display-a-sheet.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const SHEET_ID = "1bD-rUgNFWZnJ_aTpq23E-hemLe4xYIWFtbLAc8GtuRs";
const DISPLAY_A_GID = "1510382308";
const OUT_JSON = resolve(ROOT, "lib/data/playbook-sheet-videos.json");

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function normalizeUrl(url) {
  return url.trim().split("?")[0].replace(/\/$/, "").toLowerCase();
}

function inferTopic(categoryCol, tag1, tag2, title, url) {
  const t1 = (tag1 || "").toLowerCase();
  const t2 = (tag2 || "").toLowerCase();
  const tl = title.toLowerCase();
  const haystack = `${t1} ${t2} ${tl}`;

  if (categoryCol.toUpperCase() === "UP") return "upgraders";

  const handle = url.match(/@([^/]+)/)?.[1]?.toLowerCase() ?? "";

  if (/sell|upgrade|hdb|flat|listing|commission|fixed fee|homeowner|decouple|mop/i.test(haystack)) {
    return "upgraders";
  }
  if (/condo buyer|new launch|open house|buy|school|education|bedroom|penthouse|freehold/i.test(haystack)) {
    return "buying_first";
  }

  if (handle.includes("olivia") || handle === "homeup.sg" || handle.includes("mandarin")) {
    return "upgraders";
  }
  if (handle.includes("isaac") || handle.includes("tongboon")) {
    if (/hdb|sell|listing|upgrade|flat|executive mansion/i.test(haystack)) return "upgraders";
    return "buying_first";
  }
  if (handle.includes("kenji")) return "condo_tips";
  if (handle.includes("dennis")) return "upgraders";

  if (t1.includes("live") || t2.includes("new launch")) return "buying_first";
  if (t1.includes("hdb")) return "upgraders";

  return "condo_tips";
}

async function fetchTiktokThumbnail(url) {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; HomeUPBot/1.0; +https://homeup.sg/playbook)",
      },
    });
    if (!res.ok) return "";
    const data = await res.json();
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : "";
  } catch {
    return "";
  }
}

function youtubeThumbnail(url) {
  const match = url.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]+)/);
  return match?.[1] ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "";
}

async function resolveThumbnail(url, existing) {
  if (existing?.trim()) return existing.trim();
  if (url.includes("tiktok.com")) return fetchTiktokThumbnail(url);
  return youtubeThumbnail(url);
}

async function fetchDisplayASheet() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${DISPLAY_A_GID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return res.text();
}

async function main() {
  const csv = await fetchDisplayASheet();
  const lines = csv.split(/\r?\n/).slice(1);

  let existing = [];
  try {
    existing = JSON.parse(readFileSync(OUT_JSON, "utf8"));
  } catch {
    existing = [];
  }

  const byUrl = new Map(existing.map((row) => [normalizeUrl(row.url), { ...row }]));
  let added = 0;
  let marked = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const categoryCol = cols[0] ?? "";
    const title = (cols[1] ?? "").trim();
    const displayStatus = (cols[2] ?? "").trim();
    const url = (cols[3] ?? "").trim();
    const tag1 = (cols[4] ?? "").trim();
    const tag2 = (cols[5] ?? "").trim();

    if (!url.startsWith("http") || !title) continue;

    const key = normalizeUrl(url);
    const isDisplayA = /to add to display a/i.test(displayStatus);

    if (!isDisplayA) continue;

    const topic = inferTopic(categoryCol, tag1, tag2, title, url);
    const prev = byUrl.get(key);

    if (prev) {
      prev.displayA = true;
      prev.title = title;
      if (tag1) prev.tag1 = tag1;
      if (tag2) prev.tag2 = tag2;
      prev.topic = topic;
      marked++;
      continue;
    }

    const thumbnail = await resolveThumbnail(url, "");
    byUrl.set(key, {
      title,
      url,
      tag1: tag1 || "TikTok",
      tag2,
      topic,
      displayA: true,
      thumbnail,
    });
    added++;
    await new Promise((r) => setTimeout(r, 120));
  }

  const merged = [...byUrl.values()].sort((a, b) => {
    if (a.displayA && !b.displayA) return -1;
    if (!a.displayA && b.displayA) return 1;
    return a.title.localeCompare(b.title);
  });

  writeFileSync(OUT_JSON, `${JSON.stringify(merged, null, 2)}\n`);

  const displayCount = merged.filter((r) => r.displayA).length;
  console.log(`Display A sync complete → ${OUT_JSON}`);
  console.log(`Added ${added} new videos, updated ${marked} existing, ${displayCount} total Display A`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
