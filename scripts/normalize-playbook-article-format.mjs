/**
 * Normalise spacing and question headings for all playbook articles.
 * Run: node scripts/normalize-playbook-article-format.mjs
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

const SECTION_LABELS = [
  "Quick Answer",
  "Introduction",
  "How HomeUp Approaches This",
  "Conclusion",
  "FAQ",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isQuestionHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || /^#{1,6}\s/.test(trimmed)) return false;
  if (/^Q:/i.test(trimmed)) return false;
  if (!trimmed.endsWith("?")) return false;
  if (trimmed.length < 15 || trimmed.length > 160) return false;
  return /^[A-Z"']/.test(trimmed);
}

function normalizeArticleFormat(raw) {
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  for (const label of SECTION_LABELS) {
    text = text.replace(
      new RegExp(`^(${escapeRegExp(label)}):\\s+(.+)$`, "gim"),
      "$1:\n\n$2",
    );
    text = text.replace(new RegExp(`^(${escapeRegExp(label)}):\\s*$`, "gim"), "$1:\n");
  }

  const lines = text.split("\n");
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    if (/^(Quick Answer|Introduction|How HomeUp Approaches This|Conclusion|FAQ):/i.test(trimmed)) {
      out.push(trimmed.replace(/\s+$/, ""));
      continue;
    }
    if (/^#{1,6}\s/.test(trimmed)) {
      out.push(trimmed);
      continue;
    }
    if (isQuestionHeading(trimmed)) {
      out.push(`## ${trimmed}`);
      continue;
    }
    out.push(line);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isArticle(row) {
  return Boolean((row.article ?? "").trim()) && !(row.video_url ?? "").trim();
}

const { data: rows, error } = await supabase.from("playbook_videos").select("id, slug, title, article");
if (error) {
  console.error("Failed to load articles:", error.message);
  process.exit(1);
}

const articles = (rows ?? []).filter(isArticle);
let updated = 0;

for (const row of articles) {
  const next = normalizeArticleFormat(row.article);
  if (next === row.article.trim()) continue;

  const { error: updateError } = await supabase
    .from("playbook_videos")
    .update({ article: next, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (updateError) {
    console.error(`  ✗ ${row.slug}: ${updateError.message}`);
  } else {
    updated += 1;
    console.log(`  ✓ ${row.slug}`);
  }
}

console.log(`Done. Normalised ${updated} of ${articles.length} article(s).`);
