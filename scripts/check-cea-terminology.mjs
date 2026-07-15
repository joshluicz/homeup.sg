#!/usr/bin/env node
/**
 * Guardrail: consumer-facing copy must not call HomeUP an agency.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const PROMPT_FILES = [
  "lib/pipeline/prompt.ts",
  "lib/pipeline/brand.ts",
  "app/api/admin/playbook-ai/route.ts",
];

const SITE_SCAN_DIRS = ["app", "components", "lib/data", "lib/seo"];

const SITE_SCAN_FILES = ["event-scripts/index.html"];

/** Lines containing these are allowed (official CEA terms, legal entities, generic industry copy). */
const ALLOW_SUBSTRINGS = [
  "Council for Estate Agencies",
  "CEA Estate Agency Licence",
  "law enforcement agencies",
  "estate agency regulations",
  "Property portals and agencies",
  "Choose an agent (or agency)",
  "avoid:",
  "NEVER call",
  "must NEVER",
  "never call HomeUP",
  "Operating agency:",
  "#1 Transactor in Agency",
  "in his whole agency",
  "in his Agency",
];

const FORBIDDEN = [
  {
    pattern: /HomeUP is (?:a|an|Singapore'?s) (?:team of )?(?:Singapore )?(?:fixed[- ]fee )?(?:property |real estate |estate )?agenc(?:y|ies)/i,
    label: "HomeUP described as an agency",
  },
  {
    pattern: /HomeUp is (?:a|an|Singapore'?s) (?:team of )?(?:Singapore )?(?:fixed[- ]fee )?(?:property |real estate |estate )?agenc(?:y|ies)/i,
    label: "HomeUp described as an agency",
  },
  {
    pattern: /fixed-fee property agency/i,
    label: "fixed-fee property agency",
  },
  {
    pattern: /fixed-fee estate agency/i,
    label: "fixed-fee estate agency",
  },
  {
    pattern: /fixed-fee real estate agency/i,
    label: "fixed-fee real estate agency",
  },
  {
    pattern: /(?:with|from|at) HomeUP, (?:a|an) fixed-fee agenc(?:y|ies)/i,
    label: "with HomeUP, a fixed-fee agency",
  },
  {
    pattern: /(?:with|from|at) HomeUp, (?:a|an) fixed-fee agenc(?:y|ies)/i,
    label: "with HomeUp, a fixed-fee agency",
  },
  {
    pattern: /Singapore property agency \(homeup/i,
    label: "homeup.sg called a property agency",
  },
  {
    pattern: /Property agency services marketed under the HomeUP brand/i,
    label: "Property agency services under HomeUP brand",
  },
  {
    pattern: /division of agents under a Singapore-licensed real estate agency/i,
    label: "HomeUP FAQ calling itself under real estate agency",
  },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "pipeline" ||
      rel.startsWith("app/api/admin/playbook-ai") ||
      rel.startsWith("lib/pipeline/")
    ) {
      continue;
    }
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx?|jsx?|html|json|txt|mdx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function isAllowedLine(line) {
  return ALLOW_SUBSTRINGS.some((token) => line.includes(token));
}

function scanFile(relPath, text, { ignoreBrandAvoid = false } = {}) {
  const issues = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isAllowedLine(line)) continue;
    if (ignoreBrandAvoid && /avoid:\s*\[/m.test(line)) continue;

    for (const { pattern, label } of FORBIDDEN) {
      if (pattern.test(line)) {
        issues.push(`${relPath}:${i + 1} — ${label}: ${line.trim().slice(0, 120)}`);
      }
      pattern.lastIndex = 0;
    }
  }
  return issues;
}

let failed = false;
const allIssues = [];

for (const rel of PROMPT_FILES) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  const positiveText = rel.endsWith("brand.ts")
    ? text.replace(/avoid:\s*\[[\s\S]*?\],/m, "")
    : text;
  const issues = scanFile(rel, positiveText);
  if (issues.length) {
    allIssues.push(...issues);
    failed = true;
  }
}

for (const dir of SITE_SCAN_DIRS) {
  for (const full of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, full);
    if (rel.endsWith("playbook-final-10-articles.json")) continue;
    const text = readFileSync(full, "utf8");
    const issues = scanFile(rel, text);
    if (issues.length) {
      allIssues.push(...issues);
      failed = true;
    }
  }
}

for (const rel of SITE_SCAN_FILES) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  const issues = scanFile(rel, text);
  if (issues.length) {
    allIssues.push(...issues);
    failed = true;
  }
}

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

if (allIssues.length) {
  console.error("CEA terminology violations found:\n" + allIssues.join("\n"));
  failed = true;
}

if (failed) process.exit(1);
console.log("CEA terminology guardrail passed.");
