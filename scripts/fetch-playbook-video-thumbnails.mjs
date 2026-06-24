/**
 * Fetch and cache TikTok/YouTube thumbnail URLs into playbook-sheet-videos.json.
 * Run: node scripts/fetch-playbook-video-thumbnails.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const JSON_PATH = resolve(ROOT, "lib/data/playbook-sheet-videos.json");

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || (u.pathname.match(/\/(shorts|embed)\/([^/?]+)/)?.[2] ?? "");
    }
    if (u.hostname.includes("youtu.be")) return u.pathname.replace(/^\//, "");
  } catch {}
  return "";
}

function youtubeThumbnail(url) {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

async function fetchTiktokThumbnail(url) {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HomeUPBot/1.0; +https://homeup.sg/playbook)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return "";
    const data = await res.json();
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : "";
  } catch {
    return "";
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const rows = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.thumbnail?.trim()) {
      skipped++;
      continue;
    }

    let thumbnail = "";
    if (/tiktok\.com/i.test(row.url)) {
      thumbnail = await fetchTiktokThumbnail(row.url);
      await sleep(120);
    } else if (/youtube|youtu\.be/i.test(row.url)) {
      thumbnail = youtubeThumbnail(row.url);
    }

    if (thumbnail) {
      row.thumbnail = thumbnail;
      fetched++;
      process.stdout.write(`✓ ${i + 1}/${rows.length} ${row.title.slice(0, 40)}...\n`);
    } else {
      failed++;
      process.stdout.write(`✗ ${i + 1}/${rows.length} ${row.title.slice(0, 40)}...\n`);
    }
  }

  writeFileSync(JSON_PATH, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`\nDone. Fetched: ${fetched} | Skipped (existing): ${skipped} | Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
