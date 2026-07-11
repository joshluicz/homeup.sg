/**
 * Audit pipe-table markdown embedded in article_sections / article blobs.
 * Usage: npx tsx scripts/audit-playbook-tables.ts
 */

import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "../lib/scripts/load-env";
import { prepareSectionHtml } from "../lib/playbook/convert-html-markdown-tables";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadProjectEnv(ROOT);

const SEP_ROW = /\|[-: |]+\|/;

const TARGET_SLUGS = [
  "case-study-why-a-148m-condo-was-the-right-choice-mradre8y",
  "how-much-will-you-net-from-selling-your-hdb-2026-calculator-guide",
];

type Hit = { label: string; converted?: boolean; stillRaw?: boolean; sample?: string };

function scanText(label: string, text: string): Hit[] {
  if (!text?.trim()) return [];
  const hasPipeTable =
    text.includes("|") &&
    (SEP_ROW.test(text) || (text.match(/\|/g) ?? []).length >= 6);
  if (!hasPipeTable) return [];

  const prepared = prepareSectionHtml(text);
  const withoutTables = prepared.replace(/<table[\s\S]*?<\/table>/gi, "");
  const stillRaw = /\|[^<\n]{3,}\|/.test(withoutTables);

  if (stillRaw) {
    return [
      {
        label,
        stillRaw: true,
        sample: text
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120),
      },
    ];
  }
  return [{ label: label, converted: true }];
}

function scanSections(sections: Record<string, unknown> | null): Hit[] {
  if (!sections || typeof sections !== "object") return [];
  const s = sections as {
    quickAnswer?: string;
    introduction?: string;
    homeup?: string;
    conclusion?: string;
    sections?: Array<{ title: string; body: string }>;
  };

  const chunks: Array<[string, string]> = [
    ["quickAnswer", s.quickAnswer ?? ""],
    ["introduction", s.introduction ?? ""],
    ["homeup", s.homeup ?? ""],
    ["conclusion", s.conclusion ?? ""],
    ...(s.sections ?? []).map(
      (sec): [string, string] => [`section:${sec.title}`, sec.body ?? ""],
    ),
  ];

  return chunks.flatMap(([label, body]) => scanText(label, body));
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await sb
    .from("playbook_videos")
    .select("slug, title, article, article_sections")
    .not("article", "is", null)
    .neq("article", "");

  if (error) throw error;

  let withTables = 0;
  let convertedOk = 0;
  const stillBroken: Array<{ slug: string; title: string; broken: Hit[] }> = [];
  const perArticle: Array<{
    slug: string;
    tables: number;
    ok: number;
    broken: number;
    target: boolean;
  }> = [];

  for (const row of data ?? []) {
    let hits = scanSections(row.article_sections as Record<string, unknown> | null);
    if (!hits.length && row.article) {
      hits = scanText("article", row.article as string);
    }
    if (!hits.length) continue;

    withTables++;
    const broken = hits.filter((h) => h.stillRaw);
    const ok = hits.filter((h) => h.converted);
    convertedOk += ok.length;

    if (broken.length) {
      stillBroken.push({
        slug: row.slug as string,
        title: row.title as string,
        broken,
      });
    }

    perArticle.push({
      slug: row.slug as string,
      tables: hits.length,
      ok: ok.length,
      broken: broken.length,
      target: TARGET_SLUGS.includes(row.slug as string),
    });
  }

  console.log("=== TABLE AUDIT ===");
  console.log("Articles with pipe-table content:", withTables);
  console.log("Table blocks converted by fix:", convertedOk);
  console.log("Articles still broken after fix:", stillBroken.length);
  console.log("");

  console.log("Target URLs:");
  for (const slug of TARGET_SLUGS) {
    const a = perArticle.find((p) => p.slug === slug);
    if (!a) {
      console.log(`  ${slug}: no pipe-table content detected`);
      continue;
    }
    console.log(
      `  ${a.broken ? "FAIL" : "OK"} ${slug} (${a.tables} table block(s))`,
    );
  }
  console.log("");

  if (stillBroken.length) {
    console.log("STILL BROKEN:");
    for (const b of stillBroken) {
      console.log(`- ${b.slug}`);
      for (const x of b.broken) {
        console.log(`    ${x.label}: ${x.sample}`);
      }
    }
  } else {
    console.log("All detected pipe-table blocks convert successfully.");
  }

  console.log("");
  console.log("All articles with tables:");
  for (const p of perArticle.sort((a, b) => a.slug.localeCompare(b.slug))) {
    console.log(`  ${p.broken ? "FAIL" : "OK  "} ${p.slug} (${p.tables} block(s))`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
