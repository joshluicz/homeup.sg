/**
 * Mirror playbook video thumbnails to Supabase storage (fixes expired TikTok CDN links).
 * Run: node scripts/upload-playbook-video-thumbnails.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const JSON_PATH = resolve(ROOT, "lib/data/playbook-sheet-videos.json");
const BUCKET = "listing-images";
const UA = "Mozilla/5.0 (compatible; HomeUPBot/1.0; +https://homeup.sg/playbook)";

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

function storageFileName(videoUrl) {
  const tt = videoUrl.match(/\/video\/(\d+)/);
  if (tt?.[1]) return `tiktok-${tt[1]}.jpg`;
  const yt = youtubeId(videoUrl);
  if (yt) return `youtube-${yt}.jpg`;
  return `video-${Buffer.from(videoUrl).toString("base64url").slice(0, 24)}.jpg`;
}

async function fetchTiktokThumbnail(url) {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return "";
  const data = await res.json();
  return typeof data.thumbnail_url === "string" ? data.thumbnail_url : "";
}

async function resolveSourceThumbnail(row) {
  const current = row.thumbnail?.trim();
  if (current && (await headOk(current))) return current;

  if (/tiktok\.com/i.test(row.url)) {
    const fresh = await fetchTiktokThumbnail(row.url);
    if (fresh && (await headOk(fresh))) return fresh;
  }

  const yt = youtubeId(row.url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;

  return current || "";
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", headers: { "User-Agent": UA } });
    return res.ok;
  } catch {
    return false;
  }
}

async function downloadImage(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA, Accept: "image/*" } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const type = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, contentType: type.split(";")[0] };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const rows = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const file = storageFileName(row.url);
    const storagePath = `playbook/video-thumbnails/${file}`;

    if (row.thumbnail?.includes("/playbook/video-thumbnails/")) {
      skipped++;
      continue;
    }

    try {
      const source = await resolveSourceThumbnail(row);
      if (!source) {
        failed++;
        console.error(`✗ no source ${i + 1}: ${row.title.slice(0, 45)}`);
        continue;
      }

      const { buf, contentType } = await downloadImage(source);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
        upsert: true,
        contentType,
        cacheControl: "31536000",
      });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      row.thumbnail = publicUrl;
      uploaded++;
      console.log(`✓ ${i + 1}/${rows.length} ${file}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${i + 1}/${rows.length} ${row.title.slice(0, 45)} — ${err.message || err}`);
    }

    if (/tiktok\.com/i.test(row.url)) await sleep(80);
  }

  writeFileSync(JSON_PATH, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`\nDone. Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
