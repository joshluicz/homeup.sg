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
  const key = createPrivateKey(sa.private_key);
  const sig = sign("RSA-SHA256", Buffer.from(signingInput), key);
  const jwt = `${signingInput}.${b64url(sig)}`;

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

function loadConfig(): { sa: ServiceAccount; siteUrl: string } | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const siteUrl = process.env.GSC_SITE_URL;
  if (!raw || !siteUrl) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) return null;
    return { sa, siteUrl };
  } catch {
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
 * Fetches per-URL search analytics from GSC for /playbook/* URLs.
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
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "contains",
              expression: "/playbook/",
            },
          ],
        },
      ],
      rowLimit: 5000,
    }),
  });

  const data = (await resp.json()) as GscResponse;
  if (!resp.ok) throw new Error(data.error?.message ?? `GSC API error ${resp.status}`);
  return data.rows ?? [];
}

// ── Main public function ──────────────────────────────────────────────────────

/**
 * Fetches GSC data for all published playbook articles and returns per-slug metrics.
 * Returns null if GSC is not configured (caller handles gracefully).
 */
export async function fetchGscMetrics(days = 28): Promise<SlugMetric[] | null> {
  const config = loadConfig();
  if (!config) return null;

  const endDate = isoDate(new Date());
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = isoDate(start);

  const token = await getGscAccessToken(config.sa);
  const rows = await queryGsc(token, config.siteUrl, startDate, endDate);

  // Group by slug
  const map = new Map<
    string,
    { dates: Map<string, { clicks: number; impressions: number; position: number }> }
  >();

  for (const row of rows) {
    const pageUrl = row.keys[0]; // e.g. https://homeup.sg/playbook/my-slug-1234567890
    const date = row.keys[1]; // e.g. 2024-07-01

    const match = pageUrl.match(/\/playbook\/([^/?#]+)/);
    if (!match) continue;
    const slug = match[1];

    if (!map.has(slug)) map.set(slug, { dates: new Map() });
    map.get(slug)!.dates.set(date, {
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    });
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
    });
  }

  return results.sort((a, b) => b.clicks - a.clicks);
}

// ── Cache layer (Supabase article_metrics table) ──────────────────────────────

/**
 * Persists fetched GSC metrics into the article_metrics cache table.
 * Uses upsert so re-running doesn't duplicate rows.
 */
export async function cacheGscMetrics(metrics: SlugMetric[]): Promise<void> {
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
    for (let i = 0; i < m.dates.length; i++) {
      rows.push({
        slug: m.slug,
        date: m.dates[i],
        clicks: m.clicksByDay[i],
        impressions: m.impressions, // We store total per date row (GSC gives per-day already)
        position: m.position,
        cached_at: now,
      });
    }
  }

  if (rows.length === 0) return;

  // Upsert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    await supabase
      .from("article_metrics")
      .upsert(rows.slice(i, i + 500), { onConflict: "slug,date" });
  }
}

/**
 * Reads cached metrics from the DB for all article slugs.
 * Used for the dashboard when GSC is not available or to serve fast.
 */
export async function getCachedMetrics(slugs: string[]): Promise<SlugMetric[]> {
  if (slugs.length === 0) return [];

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("article_metrics")
    .select("slug, date, clicks, impressions, position")
    .in("slug", slugs)
    .order("date", { ascending: true });

  if (!data) return [];

  // Re-group by slug
  const map = new Map<string, { dates: string[]; clicks: number[]; impressions: number[]; positions: number[] }>();

  for (const row of data) {
    if (!map.has(row.slug)) {
      map.set(row.slug, { dates: [], clicks: [], impressions: [], positions: [] });
    }
    const g = map.get(row.slug)!;
    g.dates.push(row.date);
    g.clicks.push(row.clicks);
    g.impressions.push(row.impressions);
    if (row.position) g.positions.push(Number(row.position));
  }

  return slugs
    .filter((s) => map.has(s))
    .map((slug) => {
      const g = map.get(slug)!;
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
      };
    });
}
