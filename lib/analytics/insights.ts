/**
 * Unified site insights — merges GA4 read-back, local lead events, and cached GSC data
 * into one snapshot for the admin dashboard and AI Q&A.
 */

import type { GaDateRange } from "@/lib/analytics/dateRange";
import { resolveDateRange } from "@/lib/analytics/dateRange";
import { getCachedMetrics, isGscConfigured, normalizeArticleSlug } from "@/lib/analytics/gsc";
import { fetchGaAnalytics } from "@/lib/ga4/server";
import { createServiceClient } from "@/lib/supabase/service";

// ── GA4 row helpers ───────────────────────────────────────────────────────────

interface GA4Row {
  dimensionValues?: { value: string }[];
  metricValues: { value: string }[];
}

interface GA4Report {
  rows?: GA4Row[];
}

function rows(report: GA4Report | Record<string, unknown> | undefined): GA4Row[] {
  return (report as GA4Report)?.rows ?? [];
}

function metricVal(row: GA4Row, index = 0): number {
  return parseFloat(row.metricValues?.[index]?.value ?? "0") || 0;
}

function dimVal(row: GA4Row, index = 0): string {
  return row.dimensionValues?.[index]?.value ?? "";
}

function formatGaDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface InsightsSnapshot {
  dateRange: GaDateRange;
  configured: { tracking: boolean; searchConsole: boolean };
  overview: {
    sessions: number;
    users: number;
    newUsers: number;
    pageviews: number;
    bounceRate: number;
    avgDurationSeconds: number;
    engagedSessions: number;
    engagementRate: number;
    totalEvents: number;
    pagesPerSession: number;
  };
  timeSeries: {
    dates: string[];
    sessions: number[];
    users: number[];
    pageviews: number[];
  };
  trafficSources: { source: string; medium: string; sessions: number }[];
  campaigns: { name: string; sessions: number; conversions: number }[];
  devices: { device: string; sessions: number }[];
  countries: { country: string; sessions: number }[];
  topPages: { path: string; views: number; avgDurationSeconds: number }[];
  landingPages: { path: string; sessions: number }[];
  playbookArticles: { slug: string; path: string; views: number; avgDurationSeconds: number }[];
  events: {
    whatsappClicks: number;
    formLeads: number;
    videoPlays: number;
    listingViews: number;
    articleViews: number;
    buttonClicks: { label: string; count: number }[];
    scrollDepth: { depth: string; count: number }[];
    topEvents: { name: string; count: number }[];
  };
  articles: {
    slug: string;
    pageViews: number;
    avgDurationSeconds: number;
    searchClicks: number;
    searchImpressions: number;
    avgPosition: number | null;
    whatsappLeads: number;
  }[];
  adReadiness: {
    totalPlaybookViews: number;
    avgPlaybookDurationSeconds: number;
    topArticlesByViews: { slug: string; views: number }[];
    engagementRate: number;
    scrollCompletionRate: number;
  };
}

export type InsightsResult =
  | { error: "GA4_NOT_CONFIGURED" }
  | { error: "GA_AUTH_FAILED"; detail?: string }
  | { error: "GA_API_ERROR"; detail?: string; status?: string }
  | InsightsSnapshot;

// ── Local data fetchers ───────────────────────────────────────────────────────

async function fetchLeadsInRange(
  startIso: string,
  endIso: string,
): Promise<Map<string, number>> {
  const supabase = createServiceClient();
  const endExclusive = new Date(endIso);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const { data } = await supabase
    .from("lead_events")
    .select("slug, created_at")
    .gte("created_at", `${startIso}T00:00:00.000Z`)
    .lt("created_at", `${endExclusive.toISOString()}`);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const key = normalizeArticleSlug(row.slug);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

async function getArticleSlugs(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("playbook_videos")
    .select("slug")
    .neq("article", "");
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

function filterGscMetricsByRange(
  metrics: Awaited<ReturnType<typeof getCachedMetrics>>,
  startIso: string,
  endIso: string,
) {
  return metrics.map((m) => {
    const filtered = m.dates
      .map((date, i) => ({ date, clicks: m.clicksByDay[i], impressions: m.impressionsByDay[i] }))
      .filter((d) => d.date >= startIso && d.date <= endIso);

    const clicks = filtered.reduce((s, d) => s + d.clicks, 0);
    const impressions = filtered.reduce((s, d) => s + d.impressions, 0);
    return { slug: m.slug, clicks, impressions, position: m.position };
  });
}

function extractSlugFromPath(path: string): string {
  const match = path.match(/^\/playbook\/([^/?#]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : path;
}

// ── Main aggregator ───────────────────────────────────────────────────────────

export async function fetchInsights(
  input: { preset?: GaDateRange["preset"]; startIso?: string; endIso?: string; days?: number } = {},
): Promise<InsightsResult> {
  const dateRange = resolveDateRange(input);
  const gaResult = await fetchGaAnalytics(dateRange);

  if ("error" in gaResult && gaResult.error) {
    return {
      error: gaResult.error,
      ...(gaResult.detail ? { detail: gaResult.detail } : {}),
      ...(gaResult.status ? { status: gaResult.status } : {}),
    } as InsightsResult;
  }

  const ga = gaResult as Exclude<Awaited<ReturnType<typeof fetchGaAnalytics>>, { error: string }>;

  const overviewRow = rows(ga.overview)[0];
  const sessions = overviewRow ? metricVal(overviewRow, 0) : 0;
  const users = overviewRow ? metricVal(overviewRow, 1) : 0;
  const pageviews = overviewRow ? metricVal(overviewRow, 2) : 0;
  const newUsers = overviewRow ? metricVal(overviewRow, 3) : 0;
  const bounceRate = overviewRow ? metricVal(overviewRow, 4) : 0;
  const avgDuration = overviewRow ? metricVal(overviewRow, 5) : 0;
  const engagedSessions = overviewRow ? metricVal(overviewRow, 6) : 0;
  const engagementRate = overviewRow ? metricVal(overviewRow, 7) : 0;
  const totalEvents = overviewRow ? metricVal(overviewRow, 8) : 0;

  const convMap: Record<string, number> = {};
  rows(ga.conversions).forEach((r) => {
    convMap[dimVal(r, 0)] = metricVal(r, 0);
  });

  const scrollMap: Record<string, number> = {};
  rows(ga.scrollDepth).forEach((r) => {
    scrollMap[dimVal(r, 0)] = metricVal(r, 0);
  });

  const playbookArticles = rows(ga.playbookPages).map((r) => {
    const path = dimVal(r, 0);
    return {
      slug: extractSlugFromPath(path),
      path,
      views: metricVal(r, 0),
      avgDurationSeconds: metricVal(r, 1),
    };
  });

  const articleViewMap = new Map<string, number>();
  rows(ga.articleViews).forEach((r) => {
    const slug = dimVal(r, 0);
    if (slug && slug !== "(not set)") articleViewMap.set(slug, metricVal(r, 0));
  });

  const [leadsMap, articleSlugs] = await Promise.all([
    fetchLeadsInRange(dateRange.startIso, dateRange.endIso),
    getArticleSlugs(),
  ]);

  const gscConfigured = isGscConfigured();
  const gscMetrics = gscConfigured
    ? filterGscMetricsByRange(
        await getCachedMetrics(articleSlugs),
        dateRange.startIso,
        dateRange.endIso,
      )
    : [];

  const gscBySlug = new Map(gscMetrics.map((m) => [normalizeArticleSlug(m.slug), m]));

  const playbookBySlug = new Map(
    playbookArticles.map((a) => [normalizeArticleSlug(a.slug), a]),
  );

  const allSlugs = new Set([
    ...articleSlugs.map(normalizeArticleSlug),
    ...playbookArticles.map((a) => normalizeArticleSlug(a.slug)),
    ...Array.from(articleViewMap.keys()).map(normalizeArticleSlug),
    ...Array.from(leadsMap.keys()),
  ]);

  const articles = Array.from(allSlugs)
    .map((key) => {
      const slug =
        articleSlugs.find((s) => normalizeArticleSlug(s) === key) ??
        playbookArticles.find((a) => normalizeArticleSlug(a.slug) === key)?.slug ??
        key;
      const pb = playbookBySlug.get(key);
      const gsc = gscBySlug.get(key);
      return {
        slug,
        pageViews: pb?.views ?? articleViewMap.get(slug) ?? articleViewMap.get(key) ?? 0,
        avgDurationSeconds: pb?.avgDurationSeconds ?? 0,
        searchClicks: gsc?.clicks ?? 0,
        searchImpressions: gsc?.impressions ?? 0,
        avgPosition: gsc?.position ?? null,
        whatsappLeads: leadsMap.get(key) ?? 0,
      };
    })
    .filter((a) => a.pageViews > 0 || a.searchClicks > 0 || a.whatsappLeads > 0)
    .sort((a, b) => b.pageViews + b.searchClicks * 2 - (a.pageViews + a.searchClicks * 2));

  const totalPlaybookViews = playbookArticles.reduce((s, a) => s + a.views, 0);
  const avgPlaybookDuration =
    playbookArticles.length > 0
      ? playbookArticles.reduce((s, a) => s + a.avgDurationSeconds, 0) / playbookArticles.length
      : 0;

  const scroll25 = scrollMap["scroll_25"] || 0;
  const scroll100 = scrollMap["scroll_100"] || 0;

  const timeSeriesDates = rows(ga.timeSeries).map((r) => formatGaDate(dimVal(r, 0)));
  const timeSeriesSessions = rows(ga.timeSeries).map((r) => metricVal(r, 0));
  const timeSeriesUsers = rows(ga.timeSeriesUsers).map((r) => metricVal(r, 0));
  const timeSeriesPageviews = rows(ga.timeSeriesPageviews).map((r) => metricVal(r, 0));

  return {
    dateRange,
    configured: { tracking: true, searchConsole: gscConfigured },
    overview: {
      sessions,
      users,
      newUsers,
      pageviews,
      bounceRate,
      avgDurationSeconds: avgDuration,
      engagedSessions,
      engagementRate,
      totalEvents,
      pagesPerSession: sessions > 0 ? pageviews / sessions : 0,
    },
    timeSeries: {
      dates: timeSeriesDates,
      sessions: timeSeriesSessions,
      users: timeSeriesUsers,
      pageviews: timeSeriesPageviews,
    },
    trafficSources: rows(ga.sources).map((r) => ({
      source: dimVal(r, 0),
      medium: dimVal(r, 1),
      sessions: metricVal(r, 0),
    })),
    campaigns: rows(ga.campaigns)
      .filter((r) => dimVal(r, 0) && dimVal(r, 0) !== "(not set)")
      .map((r) => ({
        name: dimVal(r, 0),
        sessions: metricVal(r, 0),
        conversions: metricVal(r, 1),
      })),
    devices: rows(ga.devices).map((r) => ({
      device: dimVal(r, 0),
      sessions: metricVal(r, 0),
    })),
    countries: rows(ga.countries).map((r) => ({
      country: dimVal(r, 0),
      sessions: metricVal(r, 0),
    })),
    topPages: rows(ga.topPages).map((r) => ({
      path: dimVal(r, 0),
      views: metricVal(r, 0),
      avgDurationSeconds: metricVal(r, 1),
    })),
    landingPages: rows(ga.landingPages).map((r) => ({
      path: dimVal(r, 0),
      sessions: metricVal(r, 0),
    })),
    playbookArticles,
    events: {
      whatsappClicks: convMap["click_whatsapp"] ?? 0,
      formLeads: convMap["generate_lead"] ?? 0,
      videoPlays: convMap["video_play"] ?? 0,
      listingViews: convMap["listing_view"] ?? 0,
      articleViews: convMap["article_view"] ?? 0,
      buttonClicks: rows(ga.buttonClicks).map((r) => ({
        label: dimVal(r, 0) || "Unknown",
        count: metricVal(r, 0),
      })),
      scrollDepth: [
        { depth: "25%", key: "scroll_25" },
        { depth: "50%", key: "scroll_50" },
        { depth: "75%", key: "scroll_75" },
        { depth: "100%", key: "scroll_100" },
      ].map(({ depth, key }) => ({ depth, count: scrollMap[key] ?? 0 })),
      topEvents: rows(ga.eventBreakdown)
        .filter((r) => !dimVal(r, 0).startsWith("session_") && dimVal(r, 0) !== "page_view")
        .map((r) => ({ name: dimVal(r, 0), count: metricVal(r, 0) })),
    },
    articles,
    adReadiness: {
      totalPlaybookViews,
      avgPlaybookDurationSeconds: avgPlaybookDuration,
      topArticlesByViews: playbookArticles
        .slice(0, 8)
        .map((a) => ({ slug: a.slug, views: a.views })),
      engagementRate,
      scrollCompletionRate: scroll25 > 0 ? scroll100 / scroll25 : 0,
    },
  };
}

/** Compact JSON context for the AI analyst — strips noise, keeps signal. */
export function buildInsightsContext(snapshot: InsightsSnapshot): string {
  return JSON.stringify(
    {
      period: snapshot.dateRange.label,
      overview: snapshot.overview,
      trafficSources: snapshot.trafficSources.slice(0, 8),
      campaigns: snapshot.campaigns.slice(0, 8),
      devices: snapshot.devices,
      countries: snapshot.countries.slice(0, 8),
      topPages: snapshot.topPages.slice(0, 10),
      landingPages: snapshot.landingPages.slice(0, 8),
      events: snapshot.events,
      playbookArticles: snapshot.playbookArticles.slice(0, 15),
      articles: snapshot.articles.slice(0, 20),
      adReadiness: snapshot.adReadiness,
      dailyTrend: {
        dates: snapshot.timeSeries.dates,
        sessions: snapshot.timeSeries.sessions,
        pageviews: snapshot.timeSeries.pageviews,
      },
    },
    null,
    0,
  );
}
