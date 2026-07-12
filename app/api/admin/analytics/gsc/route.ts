/**
 * GET  /api/admin/analytics/gsc  — serve cached GSC metrics from article_metrics table
 * POST /api/admin/analytics/gsc  — fetch fresh data from GSC API + upsert cache
 *
 * Both routes are admin-gated via requireAuth().
 */

import { requireAuth } from "@/lib/supabase/auth";
import {
  fetchGscMetrics,
  cacheGscMetrics,
  getCachedMetrics,
  isGscConfigured,
} from "@/lib/analytics/gsc";
import { getPublishedSlugs } from "@/lib/pipeline/publishTarget";
import { NextResponse } from "next/server";

/** All live /playbook article slugs — same public read path as the site. */
async function getArticleSlugs(): Promise<string[]> {
  return getPublishedSlugs();
}

/** GET — returns cached metrics (fast, no external call) */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isGscConfigured()) {
    return NextResponse.json({ configured: false, metrics: [] });
  }

  const slugs = await getArticleSlugs();
  const metrics = await getCachedMetrics(slugs);

  return NextResponse.json({ configured: true, metrics, cachedAt: new Date().toISOString() });
}

/** POST — fetches fresh data from GSC and populates the cache */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isGscConfigured()) {
    return NextResponse.json(
      { error: "GSC_NOT_CONFIGURED", detail: "Set GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL env vars." },
      { status: 503 },
    );
  }

  let days = 28;
  try {
    const body = await request.json() as { days?: number };
    if (body.days) days = Math.min(Math.max(1, Number(body.days)), 90);
  } catch { /* no body — use default */ }

  try {
    const slugs = await getArticleSlugs();
    const result = await fetchGscMetrics(days, slugs);
    if (!result) {
      return NextResponse.json({ error: "GSC fetch returned null" }, { status: 500 });
    }

    const rowsCached = await cacheGscMetrics(result.metrics);

    return NextResponse.json({
      ok: true,
      slugsRefreshed: result.slugsMatched,
      slugsExtracted: result.slugsExtracted,
      rowsFromGsc: result.rowCount,
      rowsCached,
      totalClicks: result.totalClicks,
      days,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "GSC_FETCH_FAILED", detail: msg }, { status: 500 });
  }
}
