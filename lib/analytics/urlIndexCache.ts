import { inspectGscUrl } from "@/lib/analytics/gsc";
import type { SitemapUrlEntry } from "@/lib/analytics/sitemap-urls";
import { createServiceClient } from "@/lib/supabase/service";

export type UrlIndexRow = {
  url: string;
  slug: string;
  kind: string;
  label: string;
  updatedAt: string | null;
  verdict: string | null;
  coverageState: string | null;
  pageFetchState: string | null;
  lastCrawlTime: string | null;
  reason: string;
  needsAttention: boolean;
  checkedAt: string | null;
};

function inspectionReason(
  verdict: string | null,
  coverageState: string | null,
): { reason: string; needsAttention: boolean } {
  if (!verdict) return { reason: "Not checked yet", needsAttention: true };
  if (verdict === "PASS") return { reason: "Indexed", needsAttention: false };
  return {
    reason: coverageState ?? verdict ?? "Needs review",
    needsAttention: true,
  };
}

export async function getCachedIndexRows(urls: string[]): Promise<Map<string, UrlIndexRow>> {
  if (urls.length === 0) return new Map();
  const supabase = createServiceClient();
  const map = new Map<string, UrlIndexRow>();
  const chunkSize = 40;

  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const { data, error } = await supabase.from("url_index_checks").select("*").in("url", chunk);
    if (error) throw new Error(`Failed to load cached index rows: ${error.message}`);

    for (const row of data ?? []) {
      map.set(row.url, {
        url: row.url,
        slug: row.slug,
        kind: row.kind,
        label: row.label,
        updatedAt: null,
        verdict: row.verdict,
        coverageState: row.coverage_state,
        pageFetchState: row.page_fetch_state,
        lastCrawlTime: row.last_crawl_time,
        reason: row.reason ?? "Not checked yet",
        needsAttention: row.needs_attention,
        checkedAt: row.checked_at,
      });
    }
  }

  return map;
}

export function mergeSitemapWithCache(
  sitemap: SitemapUrlEntry[],
  cache: Map<string, UrlIndexRow>,
): UrlIndexRow[] {
  return sitemap.map((entry) => {
    const cached = cache.get(entry.url);
    if (cached) {
      return { ...cached, updatedAt: entry.updatedAt };
    }
    return {
      url: entry.url,
      slug: entry.slug,
      kind: entry.kind,
      label: entry.label,
      updatedAt: entry.updatedAt,
      verdict: null,
      coverageState: null,
      pageFetchState: null,
      lastCrawlTime: null,
      reason: "Not checked yet",
      needsAttention: true,
      checkedAt: null,
    };
  });
}

export async function inspectAndCacheEntries(
  entries: SitemapUrlEntry[],
  max = 15,
): Promise<{ inspected: number; errors: string[] }> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("url_index_checks")
    .select("url, checked_at")
    .order("checked_at", { ascending: true });

  const checkedAt = new Map((existing ?? []).map((r) => [r.url, r.checked_at as string]));
  const staleBefore = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const queue = entries
    .filter((entry) => {
      const at = checkedAt.get(entry.url);
      if (!at) return true;
      return new Date(at).getTime() < staleBefore;
    })
    .slice(0, max);

  let inspected = 0;
  const errors: string[] = [];

  for (const entry of queue) {
    try {
      const result = await inspectGscUrl(entry.url);
      const { reason, needsAttention } = inspectionReason(
        result?.verdict ?? null,
        result?.coverageState ?? null,
      );

      await supabase.from("url_index_checks").upsert({
        url: entry.url,
        slug: entry.slug,
        kind: entry.kind,
        label: entry.label,
        verdict: result?.verdict ?? null,
        coverage_state: result?.coverageState ?? null,
        page_fetch_state: result?.pageFetchState ?? null,
        last_crawl_time: result?.lastCrawlTime ?? null,
        reason,
        needs_attention: needsAttention,
        checked_at: new Date().toISOString(),
      });
      inspected++;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { inspected, errors };
}

export function summarizeRows(rows: UrlIndexRow[]) {
  const checked = rows.filter((r) => r.checkedAt);
  const indexed = checked.filter((r) => !r.needsAttention);
  const needsAttention = checked.filter((r) => r.needsAttention);
  const unchecked = rows.length - checked.length;

  return {
    sitemapTotal: rows.length,
    checkedCount: checked.length,
    indexedCount: indexed.length,
    needsAttentionCount: needsAttention.length,
    uncheckedCount: unchecked,
  };
}
