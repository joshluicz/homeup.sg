#!/usr/bin/env node
/**
 * Guardrail: fragile admin API routes must not statically import heavy modules.
 *
 * - /api/admin/generate: no static @anthropic-ai/sdk or pipeline imports (Vercel 500 HTML)
 * - Pipeline chain: no isomorphic-dompurify (use html-text-utils)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const GENERATE_ROUTE = "app/api/admin/generate/route.ts";
const PIPELINE_FILES = [
  GENERATE_ROUTE,
  "lib/pipeline/generate.ts",
  "lib/pipeline/finalize-draft.ts",
  "lib/pipeline/compliance.ts",
  "lib/pipeline/packageArticle.ts",
  "lib/pipeline/llm.ts",
  "lib/playbook/article-sections.ts",
  "lib/playbook/html-text-utils.ts",
];

const GENERATE_FORBIDDEN_STATIC = [
  'from "@/lib/pipeline/llm"',
  "from '@/lib/pipeline/llm'",
  'from "@/lib/pipeline/radar"',
  "from '@/lib/pipeline/radar'",
  'from "@/lib/pipeline/generate"',
  "from '@/lib/pipeline/generate'",
  'from "@anthropic-ai/sdk"',
  "from '@anthropic-ai/sdk'",
];

const PIPELINE_FORBIDDEN = [
  "isomorphic-dompurify",
  'from "@/lib/playbook/sanitize-article-html"',
  "from '@/lib/playbook/sanitize-article-html'",
];

let failed = false;

const generateSrc = readFileSync(join(ROOT, GENERATE_ROUTE), "utf8");
for (const token of GENERATE_FORBIDDEN_STATIC) {
  if (generateSrc.includes(token)) {
    console.error(`FAIL: ${GENERATE_ROUTE} must not statically import ${token}`);
    failed = true;
  }
}

for (const rel of PIPELINE_FILES) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  for (const token of PIPELINE_FORBIDDEN) {
    if (rel === "lib/playbook/html-text-utils.ts" && token === "isomorphic-dompurify") {
      continue;
    }
    if (text.includes(token)) {
      console.error(`FAIL: ${rel} must not reference ${token}`);
      failed = true;
    }
  }
}

const llm = readFileSync(join(ROOT, "lib/pipeline/llm.ts"), "utf8");
if (/^import\s+Anthropic\s+from\s+["']@anthropic-ai\/sdk["']/m.test(llm)) {
  console.error("FAIL: llm.ts must not top-level import @anthropic-ai/sdk");
  failed = true;
}

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
