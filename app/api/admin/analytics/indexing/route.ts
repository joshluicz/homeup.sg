import { requireAuth } from "@/lib/supabase/auth";
import { isGscConfigured } from "@/lib/analytics/gsc";
import { collectSitemapUrls } from "@/lib/analytics/sitemap-urls";
import {
  getCachedIndexRows,
  inspectAndCacheEntries,
  mergeSitemapWithCache,
  summarizeRows,
} from "@/lib/analytics/urlIndexCache";
import { NextResponse } from "next/server";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_BATCH_SIZE = 10;

export const maxDuration = 60;

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isGscConfigured()) {
    return NextResponse.json({ configured: false, summary: null, rows: [], total: 0 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
    );
    const filter = searchParams.get("filter") === "attention" ? "attention" : "all";
    const kind = searchParams.get("kind");

    const sitemap = await collectSitemapUrls();
    const cache = await getCachedIndexRows(sitemap.map((e) => e.url));
    let rows = mergeSitemapWithCache(sitemap, cache);

    if (kind === "playbook" || kind === "listing" || kind === "core") {
      rows = rows.filter((r) => r.kind === kind);
    }
    if (filter === "attention") {
      rows = rows.filter((r) => r.needsAttention);
    }

    const summary = summarizeRows(mergeSitemapWithCache(sitemap, cache));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    return NextResponse.json({
      configured: true,
      summary,
      rows: pageRows,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "INDEXING_LOAD_FAILED", detail },
      { status: 500 },
    );
  }
}

/** Inspect the next batch of unchecked/stale sitemap URLs and cache results. */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  if (!isGscConfigured()) {
    return NextResponse.json(
      {
        error: "GSC_NOT_CONFIGURED",
        detail:
          "Add the service account to Search Console and enable the Search Console API in Google Cloud.",
      },
      { status: 503 },
    );
  }

  let batchSize = MAX_BATCH_SIZE;
  try {
    const body = (await request.json()) as { batchSize?: number };
    if (body.batchSize) batchSize = Math.min(Math.max(1, body.batchSize), MAX_BATCH_SIZE);
  } catch {
    /* default */
  }

  try {
    const sitemap = await collectSitemapUrls();
    const result = await inspectAndCacheEntries(sitemap, batchSize);

    if (result.inspected === 0 && result.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GSC_INDEXING_CHECK_FAILED",
          detail: result.errors[0],
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      inspected: result.inspected,
      errors: result.errors,
      note:
        result.inspected === 0
          ? "All sitemap URLs were checked recently. Results refresh weekly."
          : result.errors.length > 0
            ? `Checked ${result.inspected} URL(s). Some URLs failed; try again in a minute.`
          : `Checked ${result.inspected} URL(s) via Google URL Inspection.`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "GSC_INDEXING_CHECK_FAILED",
        detail,
      },
      { status: 500 },
    );
  }
}
