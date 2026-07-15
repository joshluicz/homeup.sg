#!/usr/bin/env node
/**
 * Guardrail: playbook DB writes must not require content_kind or other optional columns.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const files = [
  "lib/playbook/playbook-db-write.ts",
  "components/admin/PlaybookTab.tsx",
  "lib/pipeline/publishTarget.ts",
  "app/api/admin/playbook/route.ts",
];

let failed = false;

for (const rel of files) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  if (text.includes("content_kind:")) {
    console.error(`FAIL: ${rel} still writes content_kind directly`);
    failed = true;
  }
}

if (readFileSync(join(ROOT, "lib/playbook/playbook-db-write.ts"), "utf8").includes("content_kind")) {
  // buildPlaybookVideoDbPayload comment mentions it — only fail on writes
  if (/content_kind\s*:/.test(readFileSync(join(ROOT, "lib/playbook/playbook-db-write.ts"), "utf8"))) {
    console.error("FAIL: playbook-db-write.ts must not set content_kind in payload");
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Playbook DB write guardrail passed.");
