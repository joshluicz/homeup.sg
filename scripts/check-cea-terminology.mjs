#!/usr/bin/env node
/**
 * Guardrail: pipeline prompts must not instruct Claude to call HomeUP an agency.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const files = [
  "lib/pipeline/prompt.ts",
  "lib/pipeline/brand.ts",
  "app/api/admin/playbook-ai/route.ts",
];

const forbidden = [
  /fixed-fee\s+agency/i,
  /property\s+agency\s+website/i,
  /HomeUp\s+is\s+a\s+fixed-fee\s+agency/i,
];

let failed = false;

for (const rel of files) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  // Ignore quoted "things to avoid" in brand voice config
  const positiveText = rel.endsWith("brand.ts")
    ? text.replace(/avoid:\s*\[[\s\S]*?\],/m, "")
    : text;
  for (const pattern of forbidden) {
    if (pattern.test(positiveText)) {
      console.error(`FAIL: ${rel} contains forbidden phrasing: ${pattern}`);
      failed = true;
    }
  }
}

// Sanity: sanitizer must fix the common violation
const { sanitizeAgencyTerminology } = await import(join(ROOT, "lib/pipeline/cea-terminology.ts"));
const sample =
  "I'm Dennis Lim from HomeUp, a fixed-fee agency helping Singapore homeowners navigate upgrading decisions.";
const { text, fixes } = sanitizeAgencyTerminology(sample);
if (/\bagenc(?:y|ies)\b/i.test(text)) {
  console.error("FAIL: sanitizer left 'agency' in sample text:", text);
  failed = true;
}
if (fixes.length === 0) {
  console.error("FAIL: sanitizer did not fix sample violation");
  failed = true;
}

if (failed) process.exit(1);
console.log("CEA terminology guardrail passed.");
