/**
 * Google Search Console client — Phase 2 article ROI dashboard.
 *
 * Required env vars (server-only):
 *   GSC_SERVICE_ACCOUNT_JSON  Full JSON key from Google Cloud Console
 *   GSC_SITE_URL              e.g. "sc-domain:homeup.sg" or "https://homeup.sg/"
 *
 * Uses the same JWT / node:crypto pattern as lib/ga4/server.ts.
 * No external HTTP client library — pure fetch + node:crypto.
 */

import { createPrivateKey, sign } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export interface SlugMetric {
  slug: string;
  clicks: number;
  impressions: number;
  position: number | null;
  /** ISO date strings, ascending */
  dates: string[];
  /** clicks per day, aligned with dates */
  clicksByDay: number[];
  /** impressions per day, aligned with dates */
  impressionsByDay: number[];
}

/** Set GSC_DEBUG=1 on Vercel for verbose URL/slug matching logs. */
const GSC_DEBUG =
  process.env.GSC_DEBUG === "1" || process.env.GSC_DEBUG === "true";

function gscLog(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.log(`[GSC] ${message}`, extra);
  } else {
    console.log(`[GSC] ${message}`);
  }
}

/**
 * Canonical slug key used for both cache writes and dashboard reads.
 * Must stay identical on both paths.
 */
export function normalizeArticleSlug(slug: string): string {
  try {
    return decodeURIComponent(slug.trim()).toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
}

/**
 * Extract the article slug from a GSC page URL.
 *
 * Accepts full URLs (https://homeup.sg/playbook/foo) or path-only (/playbook/foo).
 * Strips scheme+domain, trailing slashes, lowercases, and only matches direct
 * article pages (/playbook/<slug>) — not /playbook/watch/* or /playbook/topic/*.
 */
export function extractPlaybookArticleSlug(pageUrl: string): string | null {
  if (!pageUrl?.trim()) return null;

  let pathname: string;
  const raw = pageUrl.trim();

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return null;
    }
  } else {
    pathname = raw.split("?")[0].split("#")[0];
  }

  pathname = pathname.replace(/\/+$/, "").toLowerCase();
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  const match = pathname.match(/^\/playbook\/([^/]+)$/);
  if (!match) return null;

  const slug = normalizeArticleSlug(match[1]);
  if (!slug) return null;

  // Reserved single-segment playbook routes — not article pages.
  if (slug === "watch" || slug === "topic") return null;

  return slug;
}

// ── JWT auth (same pattern as lib/ga4/server.ts) ─────────────────────────────

function b64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getGscAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );

  const signingInput = `${header}.${payload}`;
  let jwt: string;
  try {
    const key = createPrivateKey(sa.private_key);
    const sig = sign("RSA-SHA256", Buffer.from(signingInput), key);
    jwt = `${signingInput}.${b64url(sig)}`;
  } catch (err) {
    // NEVER log sa.private_key. Only the error message is surfaced.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[GSC] Failed to sign JWT with the service account private key. ` +
        `This usually means the private_key newlines in GSC_SERVICE_ACCOUNT_JSON are malformed. ` +
        `Underlying error: ${msg}`,
    );
    throw new Error(`GSC auth failed: could not load private key (${msg})`);
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await resp.json()) as { access_token?: string; error?: string };
  if (!resp.ok || !data.access_token) {
    throw new Error(`GSC auth failed: ${data.error ?? resp.statusText}`);
  }
  return data.access_token;
}

// ── Config helpers ────────────────────────────────────────────────────────────

/**
 * Normalizes a PEM private key that has passed through env-var mangling.
 * Converts escaped "\n" (and "\r\n") sequences back into real newlines and strips
 * any accidental surrounding quotes. This is what fixes the classic
 * `error:1E08010C:DECODER routines::unsupported` crypto failure.
 */
function normalizePrivateKey(key: string): string {
  let k = key.trim();
  // Strip a single layer of surrounding quotes if the key itself got wrapped.
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  // Turn literal escape sequences into actual newlines.
  return k
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
}

/**
 * Parses the GSC_SERVICE_ACCOUNT_JSON env var into a ServiceAccount.
 * Tolerates: surrounding whitespace, an extra wrapping layer of quotes, and
 * double-encoded JSON (a JSON string that itself contains JSON).
 */
function parseServiceAccount(raw: string): ServiceAccount {
  let text = raw.trim();

  // Some deploy setups wrap the whole value in an extra pair of single quotes.
  if (text.startsWith("'") && text.endsWith("'")) {
    text = text.slice(1, -1).trim();
  }

  let parsed: unknown = JSON.parse(text);

  // If the value was double-encoded (JSON-stringified JSON), it parses to a
  // string on the first pass — parse once more to reach the object.
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }

  const sa = parsed as ServiceAccount;
  if (sa.private_key) {
    sa.private_key = normalizePrivateKey(sa.private_key);
  }
  return sa;
}

function loadConfig(): { sa: ServiceAccount; siteUrl: string } | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const siteUrl = process.env.GSC_SITE_URL;
  if (!raw || !siteUrl) return null;
  try {
    const sa = parseServiceAccount(raw);
    if (!sa.client_email || !sa.private_key) {
      console.error(
        "[GSC] GSC_SERVICE_ACCOUNT_JSON parsed but is missing client_email or private_key.",
      );
      return null;
    }
    return { sa, siteUrl };
  } catch (err) {
    // NEVER log the raw value — it contains the private key.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GSC] Failed to parse GSC_SERVICE_ACCOUNT_JSON: ${msg}`);
    return null;
  }
}

export function isGscConfigured(): boolean {
  return loadConfig() !== null;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── GSC Search Analytics query ────────────────────────────────────────────────

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscResponse {
  rows?: GscRow[];
  error?: { message: string };
}

/**
 * Fetches per-URL search analytics from GSC for the whole property.
 * Filters to /playbook/<slug> article pages locally after the response.
 * Returns one row per (page, date) pair.
 */
async function queryGsc(
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<GscRow[]> {
  const encodedSite = encodeURIComponent(siteUrl);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page", "date"],
      rowLimit: 25000,
    }),
  });

  const data = (await resp.json()) as GscResponse;
  if (!resp.ok) throw new Error(data.error?.message ?? `GSC API error ${resp.status}`);
  return data.rows ?? [];
}

// ── Main public function ──────────────────────────────────────────────────────

export interface GscFetchSummary {
  metrics: SlugMetric[];
  rowCount: number;
  slugsExtracted: number;
  slugsMatched: number;
  totalClicks: number;
}

/**
 * Fetches GSC data for playbook article pages and returns per-slug metrics.
 * Returns null if GSC is not configured (caller handles gracefully).
 *
 * @param knownSlugs  Article slugs from playbook_videos — used for match logging
 *                    and to verify write/read keys align with the dashboard.
 */
export async function fetchGscMetrics(
  days = 28,
  knownSlugs: string[] = [],
): Promise<GscFetchSummary | null> {
  const config = loadConfig();
  if (!config) return null;

  const endDate = isoDate(new Date());
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = isoDate(start);

  const token = await getGscAccessToken(config.sa);
  const rows = await queryGsc(token, config.siteUrl, startDate, endDate);

  gscLog(
    `searchAnalytics.query returned ${rows.length} rows (${startDate} → ${endDate}, dimensions=[page,date])`,
  );

  const knownSet = new Set(knownSlugs.map(normalizeArticleSlug));
  const sampleUrls: { page: string; slug: string | null }[] = [];

  // Group by normalized slug
  const map = new Map<
    string,
    { dates: Map<string, { clicks: number; impressions: number; position: number }> }
  >();

  for (const row of rows) {
    const pageUrl = row.keys[0];
    const date = row.keys[1];

    if (GSC_DEBUG && sampleUrls.length < 5) {
      sampleUrls.push({ page: pageUrl, slug: extractPlaybookArticleSlug(pageUrl) });
    }

    const slug = extractPlaybookArticleSlug(pageUrl);
    if (!slug) continue;

    if (!map.has(slug)) map.set(slug, { dates: new Map() });
    const day = map.get(slug)!.dates.get(date);
    map.get(slug)!.dates.set(date, {
      clicks: (day?.clicks ?? 0) + row.clicks,
      impressions: (day?.impressions ?? 0) + row.impressions,
      position: row.position,
    });
  }

  if (GSC_DEBUG) {
    for (const sample of sampleUrls) {
      gscLog(`sample page URL → slug: "${sample.page}" → "${sample.slug ?? "(no match)"}"`);
    }
  }

  const results: SlugMetric[] = [];

  for (const [slug, { dates }] of map.entries()) {
    const sorted = Array.from(dates.entries()).sort(([a], [b]) => a.localeCompare(b));
    const totalClicks = sorted.reduce((s, [, v]) => s + v.clicks, 0);
    const totalImpressions = sorted.reduce((s, [, v]) => s + v.impressions, 0);
    const positions = sorted.map(([, v]) => v.position).filter((p) => p > 0);
    const avgPosition =
      positions.length > 0
        ? Math.round((positions.reduce((s, p) => s + p, 0) / positions.length) * 10) / 10
        : null;

    results.push({
      slug,
      clicks: totalClicks,
      impressions: totalImpressions,
      position: avgPosition,
      dates: sorted.map(([d]) => d),
      clicksByDay: sorted.map(([, v]) => v.clicks),
      impressionsByDay: sorted.map(([, v]) => v.impressions),
    });
  }

  const sortedResults = results.sort((a, b) => b.clicks - a.clicks);
  const slugsMatched =
    knownSet.size > 0
      ? sortedResults.filter((m) => knownSet.has(m.slug)).length
      : sortedResults.length;
  const totalClicks = sortedResults.reduce((s, m) => s + m.clicks, 0);

  gscLog(
    `extracted ${sortedResults.length} playbook article slug(s)` +
      (knownSet.size > 0 ? `, ${slugsMatched}/${knownSet.size} match known articles` : "") +
      `, ${totalClicks} total clicks`,
  );

  if (GSC_DEBUG && knownSet.size > 0) {
    const extracted = new Set(sortedResults.map((m) => m.slug));
    const unmatchedKnown = [...knownSet].filter((s) => !extracted.has(s));
    const unmatchedGsc = [...extracted].filter((s) => !knownSet.has(s));
    if (unmatchedKnown.length) {
      gscLog(`known article slugs with no GSC data (${unmatchedKnown.length})`, {
        sample: unmatchedKnown.slice(0, 5),
      });
    }
    if (unmatchedGsc.length) {
      gscLog(`GSC slugs not in known articles (${unmatchedGsc.length})`, {
        sample: unmatchedGsc.slice(0, 5),
      });
    }
  }

  return {
    metrics: sortedResults,
    rowCount: rows.length,
    slugsExtracted: sortedResults.length,
    slugsMatched,
    totalClicks,
  };
}

// ── Cache layer (Supabase article_metrics table) ──────────────────────────────

/**
 * Persists fetched GSC metrics into the article_metrics cache table.
 * Uses upsert so re-running doesn't duplicate rows.
 */
export async function cacheGscMetrics(metrics: SlugMetric[]): Promise<number> {
  const supabase = createServiceClient();

  const rows: {
    slug: string;
    date: string;
    clicks: number;
    impressions: number;
    position: number | null;
    cached_at: string;
  }[] = [];

  const now = new Date().toISOString();

  for (const m of metrics) {
    const slug = normalizeArticleSlug(m.slug);
    for (let i = 0; i < m.dates.length; i++) {
      rows.push({
        slug,
        date: m.dates[i],
        clicks: m.clicksByDay[i] ?? 0,
        impressions: m.impressionsByDay[i] ?? 0,
        position: m.position,
        cached_at: now,
      });
    }
  }

  if (rows.length === 0) {
    gscLog("cache: no rows to upsert");
    return 0;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("article_metrics")
      .upsert(batch, { onConflict: "slug,date" });
    if (error) {
      console.error(`[GSC] cache upsert failed (batch ${i / 500 + 1}): ${error.message}`);
      throw new Error(`GSC cache upsert failed: ${error.message}`);
    }
    upserted += batch.length;
  }

  gscLog(`cache: upserted ${upserted} row(s) for ${metrics.length} slug(s)`);
  return upserted;
}

/**
 * Reads cached metrics from the DB for all article slugs.
 * Used for the dashboard when GSC is not available or to serve fast.
 */
export async function getCachedMetrics(slugs: string[]): Promise<SlugMetric[]> {
  if (slugs.length === 0) return [];

  const supabase = createServiceClient();
  const normalizedSlugs = [...new Set(slugs.map(normalizeArticleSlug))];

  const { data, error } = await supabase
    .from("article_metrics")
    .select("slug, date, clicks, impressions, position")
    .in("slug", normalizedSlugs)
    .order("date", { ascending: true });

  if (error) {
    console.error(`[GSC] getCachedMetrics query failed: ${error.message}`);
    return [];
  }

  if (!data?.length) return [];

  // Re-group by normalized slug — same key used when writing the cache.
  const map = new Map<
    string,
    { dates: string[]; clicks: number[]; impressions: number[]; positions: number[] }
  >();

  for (const row of data) {
    const key = normalizeArticleSlug(row.slug);
    if (!map.has(key)) {
      map.set(key, { dates: [], clicks: [], impressions: [], positions: [] });
    }
    const g = map.get(key)!;
    g.dates.push(row.date);
    g.clicks.push(row.clicks);
    g.impressions.push(row.impressions);
    if (row.position != null && Number(row.position) > 0) {
      g.positions.push(Number(row.position));
    }
  }

  return slugs
    .map((slug) => {
      const key = normalizeArticleSlug(slug);
      const g = map.get(key);
      if (!g) return null;

      const totalClicks = g.clicks.reduce((s, c) => s + c, 0);
      const totalImpressions = g.impressions.reduce((s, i) => s + i, 0);
      const avgPos =
        g.positions.length > 0
          ? Math.round((g.positions.reduce((s, p) => s + p, 0) / g.positions.length) * 10) / 10
          : null;
      return {
        slug,
        clicks: totalClicks,
        impressions: totalImpressions,
        position: avgPos,
        dates: g.dates,
        clicksByDay: g.clicks,
        impressionsByDay: g.impressions,
      };
    })
    .filter((m): m is SlugMetric => m !== null);
}
