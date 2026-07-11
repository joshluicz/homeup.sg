/**
 * Phase 3 — backfill playbook_videos.article_sections from legacy article blobs.
 *
 * Usage:
 *   npx tsx scripts/backfill-playbook-article-sections.ts --dry-run
 *   npx tsx scripts/backfill-playbook-article-sections.ts --audit
 *   npx tsx scripts/backfill-playbook-article-sections.ts --apply
 *   npx tsx scripts/backfill-playbook-article-sections.ts --apply --slug=my-article-slug
 *   npx tsx scripts/backfill-playbook-article-sections.ts --apply --include-low
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Apply migrations first:
 *   supabase/migrations/20250711000000_playbook_article_sections.sql
 *   supabase/migrations/20250711100000_playbook_article_legacy.sql
 */

import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "../lib/scripts/load-env";
import {
  auditArticle,
  buildBackfillUpdate,
  planArticleBackfill,
  type ArticleAuditEntry,
  type BackfillPlan,
  type PlaybookArticleRow,
} from "../lib/playbook/backfill-article-sections";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
loadProjectEnv(ROOT);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || (!args.includes("--apply") && !args.includes("--audit"));
const apply = args.includes("--apply");
const auditOnly = args.includes("--audit");
const includeLow = args.includes("--include-low");
const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

function isArticleRow(row: Record<string, unknown>): boolean {
  const article = String(row.article ?? "").trim();
  const videoUrl = String(row.video_url ?? "").trim();
  const kind = String(row.content_kind ?? "");
  if (kind === "video") return false;
  if (kind === "article") return true;
  return Boolean(article) && !videoUrl;
}

async function fetchRows(): Promise<PlaybookArticleRow[]> {
  const fullSelect =
    "id, slug, title, article, faq, article_sections, article_legacy, video_url, content_kind";
  const midSelect = "id, slug, title, article, faq, video_url, content_kind";
  const legacySelect = "id, slug, title, article, faq, video_url";

  let data: Record<string, unknown>[] | null = null;
  let error: { message: string } | null = null;

  for (const select of [fullSelect, midSelect, legacySelect]) {
    const result = await supabase
      .from("playbook_videos")
      .select(select)
      .order("published_at", { ascending: false });
    if (!result.error) {
      data = (result.data ?? []) as unknown as Record<string, unknown>[];
      error = null;
      break;
    }
    error = result.error;
    if (select === fullSelect) {
      console.warn(
        "⚠ article_sections / article_legacy columns missing — run migrations before --apply.\n" +
          "  supabase/migrations/20250711000000_playbook_article_sections.sql\n" +
          "  supabase/migrations/20250711100000_playbook_article_legacy.sql\n",
      );
    }
  }

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter(isArticleRow)
    .filter((row) => !slugArg || row.slug === slugArg)
    .map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      article: (row.article as string | null) ?? null,
      faq: (row.faq as PlaybookArticleRow["faq"]) ?? null,
      article_sections: (row.article_sections as PlaybookArticleRow["article_sections"]) ?? null,
      article_legacy: (row.article_legacy as string | null) ?? null,
      video_url: (row.video_url as string | null) ?? null,
      content_kind: (row.content_kind as string | null) ?? null,
    }));
}

function printPlanSummary(plans: BackfillPlan[]) {
  const counts = {
    total: plans.length,
    already: plans.filter((p) => p.flags.includes("already_structured")).length,
    wouldUpdate: plans.filter((p) => p.wouldUpdate).length,
    high: plans.filter((p) => p.confidence === "high" && p.wouldUpdate).length,
    medium: plans.filter((p) => p.confidence === "medium" && p.wouldUpdate).length,
    low: plans.filter((p) => p.confidence === "low" && p.wouldUpdate).length,
    manual: plans.filter((p) => p.confidence === "manual").length,
  };

  console.log("\n=== Backfill dry-run summary ===");
  console.log(`Article rows scanned:     ${counts.total}`);
  console.log(`Already structured:       ${counts.already}`);
  console.log(`Would update:             ${counts.wouldUpdate}`);
  console.log(`  high confidence:        ${counts.high}`);
  console.log(`  medium confidence:      ${counts.medium}`);
  console.log(`  low confidence:         ${counts.low}`);
  console.log(`Needs manual review:      ${counts.manual}`);
}

function printManualReview(plans: BackfillPlan[]) {
  const manual = plans.filter((p) => p.confidence === "manual" || p.confidence === "low");
  if (manual.length === 0) return;

  console.log("\n=== Manual review required ===");
  for (const p of manual) {
    console.log(`\n• ${p.slug}`);
    console.log(`  title: ${p.title}`);
    console.log(`  confidence: ${p.confidence}`);
    console.log(`  flags: ${p.flags.join(", ")}`);
    if (p.issues.length) console.log(`  issues: ${p.issues.join(" | ")}`);
  }
}

function printAuditReport(audits: ArticleAuditEntry[]) {
  const inconsistent = audits.filter(
    (a) => !a.issues.includes("structured_ready") || a.issues.length > 1,
  );

  console.log("\n=== Render audit (all published articles) ===");
  console.log(`Total articles: ${audits.length}`);
  console.log(`Structured-ready: ${audits.filter((a) => a.renderPath === "structured_sections").length}`);
  console.log(`HTML render path: ${audits.filter((a) => a.renderPath === "html").length}`);
  console.log(`Markdown (structured): ${audits.filter((a) => a.renderPath === "structured_markdown").length}`);
  console.log(`Markdown (plain): ${audits.filter((a) => a.renderPath === "plain_markdown").length}`);

  if (inconsistent.length === 0) {
    console.log("\nAll articles render consistently.");
    return;
  }

  console.log(`\n=== Inconsistent or needs attention (${inconsistent.length}) ===`);
  for (const a of inconsistent) {
    console.log(`\n• /playbook/${a.slug}`);
    console.log(`  title: ${a.title}`);
    console.log(`  render: ${a.renderPath}`);
    console.log(`  issues: ${a.issues.join(", ")}`);
    for (const detail of a.issueDetails) {
      console.log(`    - ${detail}`);
    }
  }
}

function writeReportFiles(plans: BackfillPlan[], audits: ArticleAuditEntry[]) {
  const outDir = path.join(ROOT, "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? "apply" : auditOnly ? "audit" : "dry-run",
    summary: {
      total: plans.length,
      wouldUpdate: plans.filter((p) => p.wouldUpdate).length,
      manualReview: plans.filter((p) => p.confidence === "manual" || p.confidence === "low").length,
    },
    plans,
    audits,
  };

  const jsonPath = path.join(outDir, `playbook-backfill-${stamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written: ${jsonPath}`);
}

async function main() {
  if (apply) {
    const probe = await supabase.from("playbook_videos").select("article_sections").limit(1);
    if (probe.error?.message.includes("article_sections")) {
      throw new Error(
        "Cannot --apply: article_sections column missing. Apply migrations in Supabase first.",
      );
    }
  }

  const rows = await fetchRows();
  if (rows.length === 0) {
    console.log(slugArg ? `No article found for slug: ${slugArg}` : "No article rows found.");
    return;
  }

  const plans = rows.map(planArticleBackfill);
  const audits = rows.map(auditArticle);

  printPlanSummary(plans);
  printManualReview(plans);
  printAuditReport(audits);
  writeReportFiles(plans, audits);

  if (auditOnly || dryRun) {
    console.log("\nDry-run / audit complete — no database changes made.");
    return;
  }

  if (!apply) return;

  console.log("\n=== Applying backfill ===");
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const plan = planArticleBackfill(row);
    const eligible =
      plan.wouldUpdate &&
      (plan.confidence === "high" ||
        plan.confidence === "medium" ||
        (includeLow && plan.confidence === "low"));

    if (!eligible) {
      skipped++;
      continue;
    }

    const payload = buildBackfillUpdate(row, plan);
    if (!payload) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("playbook_videos").update(payload).eq("id", row.id);
    if (error) {
      console.error(`✗ ${row.slug}: ${error.message}`);
      errors++;
      continue;
    }

    console.log(`✓ ${row.slug} (${plan.confidence})`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, errors: ${errors}`);
  if (!includeLow) {
    console.log("Tip: low-confidence rows were skipped. Re-run with --include-low after manual review.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
