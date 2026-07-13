#!/usr/bin/env node
/**
 * Guardrail: admin catalog/list API routes must stay on the lightweight
 * lib/playbook/published-articles.ts read path.
 *
 * Importing publishTarget, article-sections, queries, or server-queries pulls
 * DOMPurify / next/headers into the route bundle and has caused production 500s.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));

/** Routes that only list published Playbook articles (slug/title catalog). */
const CATALOG_READ_ROUTES = [
  "app/api/admin/published-articles/route.ts",
  "app/api/admin/analytics/gsc/route.ts",
  "app/api/admin/analytics/citations/route.ts",
  "app/api/admin/topics/route.ts",
];

/** publishTarget is write-only — only the publish handler may import it. */
const PUBLISH_TARGET_ALLOWLIST = new Set(["app/api/admin/publish/route.ts"]);

const BANNED_IN_CATALOG = [
  "@/lib/pipeline/publishTarget",
  "@/lib/playbook/article-sections",
  "@/lib/playbook/queries",
  "@/lib/playbook/server-queries",
  "@/lib/supabase/server",
];

const REQUIRED_IN_CATALOG = "@/lib/playbook/published-articles";

function collectAdminRouteFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      out.push(...collectAdminRouteFiles(path));
    } else if (entry === "route.ts") {
      out.push(path);
    }
  }
  return out;
}

function findImports(source) {
  const imports = [];
  const re = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source)) !== null) imports.push(m[1]);
  return imports;
}

const errors = [];

for (const rel of CATALOG_READ_ROUTES) {
  const abs = join(ROOT, rel);
  const src = readFileSync(abs, "utf8");
  const imports = findImports(src);

  if (!imports.some((i) => i === REQUIRED_IN_CATALOG || i.startsWith(REQUIRED_IN_CATALOG))) {
    errors.push(`${rel}: must import ${REQUIRED_IN_CATALOG}`);
  }

  for (const banned of BANNED_IN_CATALOG) {
    if (imports.includes(banned)) {
      errors.push(`${rel}: must not import ${banned} (use published-articles read path)`);
    }
  }
}

const adminRoutes = collectAdminRouteFiles(join(ROOT, "app/api/admin"));
for (const abs of adminRoutes) {
  const rel = relative(ROOT, abs);
  const imports = findImports(readFileSync(abs, "utf8"));
  if (!imports.includes("@/lib/pipeline/publishTarget")) continue;
  if (!PUBLISH_TARGET_ALLOWLIST.has(rel)) {
    errors.push(
      `${rel}: publishTarget is write-only — import @/lib/playbook/published-articles for reads`,
    );
  }
}

const publishedArticlesPath = join(ROOT, "lib/playbook/published-articles.ts");
const publishedSrc = readFileSync(publishedArticlesPath, "utf8");
for (const banned of BANNED_IN_CATALOG) {
  if (findImports(publishedSrc).includes(banned)) {
    errors.push(`lib/playbook/published-articles.ts: must not import ${banned}`);
  }
}

if (errors.length) {
  console.error("Admin catalog import check failed:\n");
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log("Admin catalog import check passed.");
