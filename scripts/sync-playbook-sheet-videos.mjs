/**
 * Sync playbook sheet videos from Dennis's Google Sheet (Video Link tab, gid=0).
 * Run: node scripts/sync-playbook-sheet-videos.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const SHEET_ID = "1bD-rUgNFWZnJ_aTpq23E-hemLe4xYIWFtbLAc8GtuRs";
const GID = "0";
const OUT_JSON = resolve(ROOT, "lib/data/playbook-sheet-videos.json");

function parseRow(line) {
  const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
  if (!urlMatch) return null;

  const url = urlMatch[1];
  const before = line.slice(0, urlMatch.index);
  const after = line.slice(urlMatch.index + url.length);

  const title = before
    .replace(/^,/, "")
    .replace(/^"|"$/g, "")
    .replace(/,\s*$/, "")
    .trim();
  if (!title) return null;

  const parts = after
    .replace(/^,/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let tag1 = parts[0] ?? "";
  let tag2 = parts[1] ?? "";

  // e.g. HDB, Condo, News → tag1=HDB, tag2=News
  if (parts.length >= 3 && parts.some((p) => p.toLowerCase() === "news")) {
    tag1 = parts[0];
    tag2 = "News";
  }

  return { title, url, tag1, tag2 };
}

function inferTopic(tag1, tag2, title) {
  const t1 = tag1.trim().toLowerCase();
  const t2 = tag2.trim().toLowerCase();
  const tl = title.toLowerCase();
  const haystack = `${t1} ${t2} ${tl}`;

  if (
    /sell.*buy|buy first then sell|without absd|decouple|extension|15 month wait|mop flat|hdb resale|prime hdb|cheaper bank|draws upgraders|jumbo hdb|pre war flat|sell & buy|upgrade from hdb/i.test(
      haystack,
    )
  ) {
    return "upgraders";
  }

  if (t1.includes("behind the scene") && t2 === "hdb") return "upgraders";

  if (t1 === "hdb" && !/condo makes more sense|million dollar hdb/i.test(tl)) {
    return "upgraders";
  }

  if (/live|new launch/i.test(`${t1} ${t2}`) && t2 !== "news") {
    return "buying_first";
  }

  if (t1.includes("behind the scene")) return "buying_first";
  if (t1 === "new launch" && t2 !== "news") return "buying_first";

  return "condo_tips";
}

async function fetchSheetCsv() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return res.text();
}

async function main() {
  let csv;
  const localPath = resolve(ROOT, "tmp-playbook-videos.csv");
  try {
    csv = await fetchSheetCsv();
  } catch {
    csv = readFileSync(localPath, "utf8");
    console.warn("Using local CSV fallback:", localPath);
  }

  const lines = csv.split(/\r?\n/).slice(1);
  const rows = [];

  let existingByUrl = new Map();
  try {
    const existing = JSON.parse(readFileSync(OUT_JSON, "utf8"));
    existingByUrl = new Map(
      existing
        .filter((r) => r.thumbnail?.trim())
        .map((r) => [r.url, r.thumbnail]),
    );
  } catch {
    // First sync — no cached thumbnails yet.
  }

  for (const line of lines) {
    const row = parseRow(line);
    if (!row) continue;
    rows.push({
      ...row,
      topic: inferTopic(row.tag1, row.tag2, row.title),
      thumbnail: existingByUrl.get(row.url) ?? "",
    });
  }

  writeFileSync(OUT_JSON, `${JSON.stringify(rows, null, 2)}\n`);

  const byTopic = rows.reduce(
    (acc, r) => {
      acc[r.topic] = (acc[r.topic] ?? 0) + 1;
      return acc;
    },
    {},
  );

  console.log(`Wrote ${rows.length} videos → ${OUT_JSON}`);
  console.log("By category:", byTopic);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
