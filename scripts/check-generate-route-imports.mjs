#!/usr/bin/env node
/**
 * Guardrail: /api/admin/generate must not pull isomorphic-dompurify into its bundle.
 *
 * DOMPurify has caused production HTTP 500 HTML error pages when loaded at module init
 * in Vercel serverless functions. Pipeline routes use html-text-utils instead.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const PIPELINE_FILES = [
  "app/api/admin/generate/route.ts",
  "lib/pipeline/generate.ts",
  "lib/pipeline/finalize-draft.ts",
  "lib/pipeline/compliance.ts",
  "lib/pipeline/packageArticle.ts",
  "lib/playbook/article-sections.ts",
  "lib/playbook/html-text-utils.ts",
];

const FORBIDDEN = [
  "isomorphic-dompurify",
  "from \"@/lib/playbook/sanitize-article-html\"",
  "from '@/lib/playbook/sanitize-article-html'",
];

let failed = false;

for (const rel of PIPELINE_FILES) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  for (const token of FORBIDDEN) {
    if (rel === "lib/playbook/html-text-utils.ts" && token === "isomorphic-dompurify") {
      continue;
    }
    if (text.includes(token)) {
      console.error(`FAIL: ${rel} must not reference ${token}`);
      failed = true;
    }
  }
}

// html-text-utils must stay dompurify-free (imports only — comments may mention it)
const lite = readFileSync(join(ROOT, "lib/playbook/html-text-utils.ts"), "utf8");
if (
  /from\s+["']isomorphic-dompurify["']/.test(lite) ||
  /require\(\s*["']isomorphic-dompurify["']\s*\)/.test(lite)
) {
  console.error("FAIL: html-text-utils.ts must not import DOMPurify");
  failed = true;
}

if (failed) process.exit(1);
console.log("Generate route import check passed.");
