"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { gscInspectUrl } from "@/lib/analytics/gsc-links";
import { cn } from "@/lib/utils";

type IndexRow = {
  url: string;
  slug: string;
  kind: string;
  label: string;
  verdict: string | null;
  coverageState: string | null;
  pageFetchState: string | null;
  lastCrawlTime: string | null;
  reason: string;
  needsAttention: boolean;
  checkedAt: string | null;
};

type Summary = {
  sitemapTotal: number;
  checkedCount: number;
  indexedCount: number;
  needsAttentionCount: number;
  uncheckedCount: number;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const CHECK_BATCH_SIZE = 10;

async function readApiJson<T>(resp: Response): Promise<T> {
  const text = await resp.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 160);
    throw new Error(
      resp.ok
        ? `Unexpected non-JSON response: ${snippet || "empty response"}`
        : `Request failed (${resp.status}): ${snippet || resp.statusText}`,
    );
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-SG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GoogleIndexingPanel() {
  const [rows, setRows] = useState<IndexRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "attention">("attention");
  const [kind, setKind] = useState<"all" | "playbook" | "listing" | "core">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        filter,
      });
      if (kind !== "all") params.set("kind", kind);

      const resp = await fetch(`/api/admin/analytics/indexing?${params}`);
      const result = await readApiJson<{
        configured?: boolean;
        rows?: IndexRow[];
        summary?: Summary;
        totalPages?: number;
        detail?: string;
        error?: string;
      }>(resp);
      if (!resp.ok) throw new Error(result.detail ?? result.error ?? "Failed to load indexing data");
      if (!result.configured) {
        setError(
          "Search Console is not connected yet. Add your service account to GSC with Full permission and enable the Search Console API in Google Cloud.",
        );
        setRows([]);
        setSummary(null);
        return;
      }
      setRows(result.rows ?? []);
      setSummary(result.summary ?? null);
      setTotalPages(result.totalPages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load indexing data");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const unchecked = useMemo(
    () => (summary ? summary.uncheckedCount : 0),
    [summary],
  );

  async function refreshBatch() {
    setRefreshing(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await fetch("/api/admin/analytics/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: CHECK_BATCH_SIZE }),
      });
      const result = await readApiJson<{
        inspected?: number;
        note?: string;
        detail?: string;
        error?: string;
      }>(resp);
      if (!resp.ok) throw new Error(result.detail ?? result.error ?? "Refresh failed");
      setMessage(result.note ?? `Checked ${result.inspected} URL(s).`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 bg-neutral-50/70 px-5 py-4">
        <div>
          <p className="text-sm font-bold text-neutral-900">Indexing Status</p>
          <p className="mt-1 text-xs text-neutral-500">
            Compare sitemap URLs against Google&apos;s indexed status. Request indexing manually in Search Console.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshBatch}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          {refreshing
            ? "Checking URLs…"
            : unchecked > 0
              ? `Check next ${Math.min(CHECK_BATCH_SIZE, unchecked)}`
              : "Re-check stale"}
        </button>
      </div>

      <div className="px-5 py-4">
        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "In sitemap", value: summary.sitemapTotal },
              { label: "Indexed", value: summary.indexedCount },
              { label: "Need attention", value: summary.needsAttentionCount },
              { label: "Not checked yet", value: summary.uncheckedCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="font-display text-xl font-bold text-neutral-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {message && <p className="mb-3 text-xs font-semibold text-green-700">{message}</p>}
        {error && <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            {(["all", "attention"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold capitalize",
                  filter === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500",
                )}
              >
                {f === "attention" ? "Needs attention" : "All"}
              </button>
            ))}
          </div>
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as typeof kind);
              setPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700"
          >
            <option value="all">All types</option>
            <option value="playbook">Playbook only</option>
            <option value="listing">Listings only</option>
            <option value="core">Core pages only</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sitemap URLs…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-sm text-neutral-400">No URLs match this filter.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    <th className="pb-2 pr-4">Page</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Last crawl</th>
                    <th className="pb-2 text-right">GSC</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.url} className="border-b border-neutral-50">
                      <td className="py-3 pr-4">
                        <p className="truncate font-semibold text-neutral-900">{row.label}</p>
                        <p className="truncate text-xs text-neutral-400">{row.kind}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                            row.reason === "Not checked yet"
                              ? "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200"
                              : row.needsAttention
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                : "bg-green-50 text-green-700 ring-1 ring-green-200",
                          )}
                        >
                          {row.reason === "Not checked yet" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : row.needsAttention ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {row.reason}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-neutral-500">
                        {formatDate(row.lastCrawlTime)}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={gscInspectUrl(row.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Inspect
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
