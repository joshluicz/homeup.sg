"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  BotMessageSquare,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlugMetric } from "@/lib/analytics/gsc";
import type { LeadCount } from "@/app/api/admin/analytics/leads/route";
import type { CitationSummary } from "@/lib/analytics/aiCitations";
import type { RefreshQueueItem } from "@/app/api/admin/analytics/refresh-queue/route";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Article {
  slug: string;
  title: string;
  published_at: string;
}

interface RowData {
  article: Article;
  metric: SlugMetric | null;
  leads: number;
  lastLead: string | null;
  citation: CitationSummary | null;
}

// ── Mini sparkline (inline SVG) ───────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <span className="text-xs text-neutral-300">—</span>;
  }
  const max = Math.max(...values, 1);
  const W = 80;
  const H = 24;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - (v / max) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <polyline
        points={pts}
        fill="none"
        stroke="#009A44"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Position pill ─────────────────────────────────────────────────────────────

function PositionPill({ pos }: { pos: number | null }) {
  if (pos === null) return <span className="text-xs text-neutral-300">—</span>;
  const color =
    pos <= 3
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : pos <= 10
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-neutral-100 text-neutral-500 ring-neutral-200";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold ring-1 tabular-nums", color)}>
      #{pos}
    </span>
  );
}

// ── Setup guide ───────────────────────────────────────────────────────────────

function GscSetupGuide() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Google Search Console not configured</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Add these two server-only env vars to see per-article search metrics.
          </p>
        </div>
      </div>
      <ol className="space-y-2 text-sm text-amber-800 list-decimal list-inside">
        <li>
          In <strong>Google Cloud Console</strong> → create a Service Account → download the JSON key →
          add it as <code className="bg-amber-100 px-1 rounded">GSC_SERVICE_ACCOUNT_JSON</code> (full JSON string)
        </li>
        <li>
          In <strong>Google Search Console</strong> → Settings → Users and permissions →
          add the service account email as <strong>Full</strong>
        </li>
        <li>
          Set <code className="bg-amber-100 px-1 rounded">GSC_SITE_URL</code> to your verified property,
          e.g. <code className="bg-amber-100 px-1 rounded">sc-domain:homeup.sg</code>
        </li>
        <li>Redeploy, then click <strong>Refresh GSC data</strong></li>
      </ol>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ArticleAnalyticsDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [metrics, setMetrics] = useState<SlugMetric[]>([]);
  const [leads, setLeads] = useState<LeadCount[]>([]);
  const [citations, setCitations] = useState<CitationSummary[]>([]);
  const [citationsConfigured, setCitationsConfigured] = useState(false);
  const [gscConfigured, setGscConfigured] = useState(true);
  const [refreshQueue, setRefreshQueue] = useState<RefreshQueueItem[]>([]);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [artRes, gscRes, leadsRes, citRes, queueRes] = await Promise.all([
        fetch("/api/admin/playbook"),
        fetch("/api/admin/analytics/gsc"),
        fetch("/api/admin/analytics/leads"),
        fetch("/api/admin/analytics/citations"),
        fetch("/api/admin/analytics/refresh-queue"),
      ]);

      const artData = artRes.ok ? (await artRes.json() as Article[]) : [];
      // Filter to articles only (have article content)
      setArticles(artData.filter((a: Article & { article?: string }) => a.article));

      if (gscRes.ok) {
        const gscData = await gscRes.json() as { configured: boolean; metrics: SlugMetric[] };
        setGscConfigured(gscData.configured);
        setMetrics(gscData.metrics ?? []);
      }

      if (leadsRes.ok) {
        setLeads(await leadsRes.json() as LeadCount[]);
      }

      if (citRes.ok) {
        const citData = await citRes.json() as { configured: boolean; summaries: CitationSummary[] };
        setCitationsConfigured(citData.configured);
        setCitations(citData.summaries ?? []);
      }

      if (queueRes.ok) {
        setRefreshQueue(await queueRes.json() as RefreshQueueItem[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefreshGsc = useCallback(async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    const res = await fetch("/api/admin/analytics/gsc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 28 }),
    });
    const data = await res.json() as {
      ok?: boolean;
      slugsRefreshed?: number;
      totalClicks?: number;
      error?: string;
      detail?: string;
    };
    if (res.ok) {
      const matched = data.slugsRefreshed ?? 0;
      const clicks = data.totalClicks ?? 0;
      setRefreshMsg(
        `Refreshed GSC data for ${matched} article${matched === 1 ? "" : "s"} (${clicks.toLocaleString()} clicks).`,
      );
      await load();
    } else {
      setRefreshMsg(`Error: ${data.detail ?? data.error}`);
    }
    setRefreshing(false);
  }, [load]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const metricBySlug = new Map(metrics.map((m) => [m.slug, m]));
  const leadsBySlug = new Map(leads.map((l) => [l.slug, l]));
  const citationBySlug = new Map(citations.map((c) => [c.slug, c]));

  const rows: RowData[] = articles.map((a) => ({
    article: a,
    metric: metricBySlug.get(a.slug) ?? null,
    leads: leadsBySlug.get(a.slug)?.count ?? 0,
    lastLead: leadsBySlug.get(a.slug)?.lastClick ?? null,
    citation: citationBySlug.get(a.slug) ?? null,
  }));

  // Per-article citation check handler
  const handleCheckCitation = useCallback(async (slug: string) => {
    setCheckingSlug(slug);
    const res = await fetch("/api/admin/analytics/citations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      // Refresh citation data
      const citRes = await fetch("/api/admin/analytics/citations");
      if (citRes.ok) {
        const citData = await citRes.json() as { configured: boolean; summaries: CitationSummary[] };
        setCitations(citData.summaries ?? []);
      }
    }
    setCheckingSlug(null);
  }, []);

  const handleDismissRefresh = useCallback(async (id: string) => {
    setDismissingId(id);
    await fetch("/api/admin/analytics/refresh-queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "dismissed" }),
    });
    setRefreshQueue((q) => q.filter((r) => r.id !== id));
    setDismissingId(null);
  }, []);

  // Sort: most clicks first, then most leads
  rows.sort((a, b) => (b.metric?.clicks ?? 0) - (a.metric?.clicks ?? 0) || b.leads - a.leads);

  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalLeads = leads.reduce((s, l) => s + l.count, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Admin</p>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Article Analytics</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Search Console performance + WhatsApp lead attribution per published article
          </p>
        </div>
        {gscConfigured && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshGsc}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Refresh GSC data
            </Button>
            {refreshMsg && (
              <p className={cn("text-xs", refreshMsg.startsWith("Error") ? "text-red-500" : "text-emerald-600")}>
                {refreshMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Setup guides */}
      {!loading && !gscConfigured && <GscSetupGuide />}
      {!loading && !citationsConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <BotMessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <p className="text-xs text-violet-800">
            <span className="font-semibold">AI citation tracking disabled.</span>{" "}
            Set <code className="rounded bg-violet-100 px-1">PERPLEXITY_API_KEY</code> to track
            whether HomeUP is cited by AI answer engines for each article&apos;s target questions.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Headline funnel */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "GSC Clicks (28d)",
            value: loading ? "…" : totalClicks.toLocaleString(),
            icon: MousePointerClick,
            sub: gscConfigured ? `${totalImpressions.toLocaleString()} impressions` : "GSC not configured",
          },
          {
            label: "Search Impressions",
            value: loading ? "…" : totalImpressions.toLocaleString(),
            icon: Search,
            sub: `across ${articles.length} articles`,
          },
          {
            label: "WhatsApp Leads",
            value: loading ? "…" : totalLeads.toLocaleString(),
            icon: MessageCircle,
            sub: "tracked CTA clicks",
          },
        ].map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Article table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
            <BarChart2 className="h-4 w-4 text-primary-600" />
            Per-article performance
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 pb-10 pt-2 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 pb-10 pt-2 text-center text-sm text-neutral-400">
            No published articles yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-neutral-100 bg-neutral-50">
                  {["Article", "Clicks (28d)", "Impressions", "Avg position", "Trend", "WA Leads", "AI Citations", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ article, metric, leads: leadCount, citation }) => (
                  <tr key={article.slug} className="border-t border-neutral-100 hover:bg-neutral-50/60">
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate font-medium text-neutral-900">{article.title}</p>
                      <p className="truncate text-xs text-neutral-400">/playbook/{article.slug}</p>
                    </td>

                    {/* Clicks */}
                    <td className="px-4 py-3 tabular-nums">
                      {metric ? (
                        <span className={cn("font-semibold", metric.clicks > 0 ? "text-primary-700" : "text-neutral-400")}>
                          {metric.clicks.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>

                    {/* Impressions */}
                    <td className="px-4 py-3 tabular-nums text-neutral-600">
                      {metric ? metric.impressions.toLocaleString() : <span className="text-neutral-300">—</span>}
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3">
                      <PositionPill pos={metric?.position ?? null} />
                    </td>

                    {/* Sparkline */}
                    <td className="px-4 py-3">
                      {metric && metric.clicksByDay.length > 1 ? (
                        <Sparkline values={metric.clicksByDay} />
                      ) : (
                        <span className="text-xs text-neutral-300">no data</span>
                      )}
                    </td>

                    {/* WA leads */}
                    <td className="px-4 py-3">
                      {leadCount > 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {leadCount}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-300">0</span>
                      )}
                    </td>

                    {/* AI Citations */}
                    <td className="px-4 py-3">
                      {citationsConfigured ? (
                        citation ? (
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-xs font-semibold tabular-nums",
                              citation.citedCount > 0 ? "text-violet-700" : "text-neutral-400",
                            )}>
                              {citation.citedCount}/{citation.totalQuestions}
                            </span>
                            <button
                              onClick={() => handleCheckCitation(article.slug)}
                              disabled={checkingSlug === article.slug}
                              className="rounded p-0.5 text-neutral-300 hover:text-violet-500 disabled:opacity-40"
                              title="Re-check citations"
                            >
                              {checkingSlug === article.slug
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <RefreshCw className="h-3 w-3" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCheckCitation(article.slug)}
                            disabled={checkingSlug === article.slug}
                            className="flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 hover:bg-violet-100 disabled:opacity-40"
                          >
                            {checkingSlug === article.slug
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <BotMessageSquare className="h-3 w-3" />}
                            Check
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-neutral-300">—</span>
                      )}
                    </td>

                    {/* Link */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/playbook/${article.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-0.5 text-xs text-neutral-400 hover:text-primary-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Needs Refresh queue */}
      {!loading && refreshQueue.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Needs Refresh ({refreshQueue.length})
          </h2>
          <p className="mb-4 text-xs text-amber-700">
            These articles were flagged by the freshness scanner. Regenerate them to keep content accurate, or dismiss to silence the alert.
          </p>
          <ul className="divide-y divide-amber-100">
            {refreshQueue.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/playbook/${item.slug}`}
                      target="_blank"
                      className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
                    >
                      {item.slug}
                    </Link>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      item.reason === "stale_year"    && "bg-orange-100 text-orange-700",
                      item.reason === "stale_figure"  && "bg-red-100 text-red-700",
                      item.reason === "ranking_drop"  && "bg-yellow-100 text-yellow-700",
                      item.reason === "age"            && "bg-neutral-100 text-neutral-600",
                    )}>
                      {item.reason.replace("_", " ")}
                    </span>
                  </div>
                  {item.detail && (
                    <p className="mt-0.5 text-xs text-amber-700">{item.detail}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-amber-500">
                    Detected {new Date(item.detected_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => void handleDismissRefresh(item.id)}
                  disabled={dismissingId === item.id}
                  className="shrink-0 rounded-md p-1.5 text-amber-400 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-40"
                  title="Dismiss"
                >
                  {dismissingId === item.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <X className="h-3.5 w-3.5" />
                  }
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-amber-600">
            To regenerate an article, use the <strong>Article Generation</strong> tab. Mark it as &quot;refreshed&quot; after publishing.
          </p>
        </div>
      )}

      {/* Conversion funnel summary */}
      {!loading && totalClicks > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <TrendingUp className="h-4 w-4 text-primary-600" />
            Articles → Clicks → Leads funnel
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-lg bg-neutral-50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-neutral-900 tabular-nums">{articles.length}</p>
              <p className="text-xs text-neutral-500">Articles</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-neutral-300 rotate-90" />
            <div className="rounded-lg bg-primary-50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-primary-700 tabular-nums">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-primary-500">GSC Clicks</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-neutral-300 rotate-90" />
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-emerald-700 tabular-nums">{totalLeads}</p>
              <p className="text-xs text-emerald-500">WA Leads</p>
            </div>
            {totalClicks > 0 && (
              <p className="ml-2 text-xs text-neutral-400">
                {((totalLeads / totalClicks) * 100).toFixed(1)}% click→lead rate
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
