"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart2,
  Users,
  Eye,
  Clock,
  TrendingUp,
  MessageCircle,
  Play,
  FileText,
  Loader2,
  AlertCircle,
  BookOpen,
  Megaphone,
  Zap,
} from "lucide-react";
import type { InsightsSnapshot } from "@/lib/analytics/insights";
import type { DatePreset, GaDateRange } from "@/lib/analytics/dateRange";
import { resolveDateRange } from "@/lib/analytics/dateRange";
import { AnalyticsDateRangePicker } from "@/components/admin/AnalyticsDateRangePicker";
import { AnalyticsAskPanel } from "@/components/admin/AnalyticsAskPanel";
import { GoogleIndexingPanel } from "@/components/admin/GoogleIndexingPanel";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function fmtPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// ── Time series chart ─────────────────────────────────────────────────────────

function compactDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-SG", { month: "short", day: "numeric" });
}

function TimeSeriesChart({
  values,
  dates,
  color = "#2563eb",
}: {
  values: number[];
  dates: string[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const W = 720;
  const H = 220;
  const pad = { top: 18, right: 18, bottom: 34, left: 54 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const ticks = [max, min + (max - min) / 2, min].map((v) => Math.round(v));
  const yFor = (v: number) => pad.top + plotH - ((v - min) / (max - min || 1)) * plotH;
  const xFor = (i: number) => pad.left + (i / (values.length - 1)) * plotW;
  const pts = values
    .map((v, i) => `${xFor(i)},${yFor(v)}`)
    .join(" ");
  const markerStep = Math.max(1, Math.ceil(values.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily trend chart">
      {ticks.map((tick) => {
        const y = yFor(tick);
        return (
          <g key={tick}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="#f1f5f9" />
            <text x={pad.left - 10} y={y + 4} textAnchor="end" className="fill-neutral-400 text-[11px]">
              {fmtNum(tick)}
            </text>
          </g>
        );
      })}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => (
        <circle key={`${dates[i]}-${i}`} cx={xFor(i)} cy={yFor(v)} r={i % markerStep === 0 || i === values.length - 1 ? 3 : 1.8} fill="#fff" stroke={color} strokeWidth="2">
          <title>{`${dates[i] ?? ""}: ${fmtNum(v)}`}</title>
        </circle>
      ))}
      {dates.map((date, i) => {
        if (i % markerStep !== 0 && i !== dates.length - 1) return null;
        return (
          <text
            key={date}
            x={xFor(i)}
            y={H - 10}
            textAnchor={i === 0 ? "start" : i === dates.length - 1 ? "end" : "middle"}
            className="fill-neutral-400 text-[11px]"
          >
            {compactDateLabel(date)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Bar row ───────────────────────────────────────────────────────────────────

function BarRow({
  label,
  value,
  max,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  sub?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate text-neutral-700 max-w-[60%]">{label}</span>
        <div className="flex items-center gap-2">
          {sub && <span className="text-neutral-400">{sub}</span>}
          <span className="font-semibold text-neutral-900">{fmtNum(value)}</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-100">
        <div
          className="h-1.5 rounded-full bg-primary-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)] ${className ?? ""}`}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
      {children}
    </div>
  );
}

// ── Setup guide ───────────────────────────────────────────────────────────────

function SetupGuide() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Site tracking not configured</p>
          <p className="mt-1 text-sm text-amber-700">
            Connect your analytics service account to see site insights.
          </p>
        </div>
      </div>
      <ol className="space-y-3 text-sm text-amber-800 list-decimal list-inside">
        <li>
          In <strong>Google Cloud Console</strong> → enable the <strong>Google Analytics Data API</strong> and{" "}
          <strong>Google Analytics Admin API</strong> → create a Service Account → download the JSON key
        </li>
        <li>In GA4 → Admin → Property Access Management → add the service account email as <strong>Viewer</strong></li>
        <li>
          Add <code className="bg-amber-100 px-1 rounded">GA_SERVICE_ACCOUNT_JSON</code> to your server env.
          Optional: <code className="bg-amber-100 px-1 rounded">GA_PROPERTY_ID</code> (numeric ID).
        </li>
        <li>Redeploy after saving env vars</li>
      </ol>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type ChartMetric = "sessions" | "pageviews" | "users";

export function AnalyticsTab() {
  const [dateRange, setDateRange] = useState<GaDateRange>(() => resolveDateRange({ preset: "last30days" }));
  const [data, setData] = useState<InsightsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("sessions");
  const [gscRefreshing, setGscRefreshing] = useState(false);

  const load = useCallback(async (range: GaDateRange) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: range.preset,
          startIso: range.startIso,
          endIso: range.endIso,
        }),
      });
      const result = await resp.json();
      if (!resp.ok && !result?.error) {
        throw new Error(`Insights request failed (${resp.status})`);
      }
      if (result?.error === "GA4_NOT_CONFIGURED") {
        setNotConfigured(true);
        return;
      }
      if (result?.error) {
        const detail = result.detail ? ` — ${result.detail}` : "";
        setError(`${result.error}${detail}`);
        return;
      }
      setData(result as InsightsSnapshot);
      setDateRange(result.dateRange as GaDateRange);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.preset, dateRange.startIso, dateRange.endIso]);

  function handleDateChange(preset: DatePreset, startIso?: string, endIso?: string) {
    setDateRange(resolveDateRange({ preset, startIso, endIso }));
  }

  async function refreshGscData() {
    setGscRefreshing(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin/analytics/gsc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 90 }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.detail ?? result.error ?? "GSC refresh failed");
      await load(dateRange);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GSC refresh failed");
    } finally {
      setGscRefreshing(false);
    }
  }

  if (notConfigured) return <SetupGuide />;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading insights…</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  const { overview, events, timeSeries } = data;
  const chartValues =
    chartMetric === "sessions"
      ? timeSeries.sessions
      : chartMetric === "pageviews"
        ? timeSeries.pageviews
        : timeSeries.users;

  const maxSource = Math.max(...data.trafficSources.map((s) => s.sessions), 1);
  const maxCampaign = Math.max(...data.campaigns.map((c) => c.sessions), 1);
  const maxPage = Math.max(...data.topPages.map((p) => p.views), 1);
  const maxDevice = Math.max(...data.devices.map((d) => d.sessions), 1);
  const maxCountry = Math.max(...data.countries.map((c) => c.sessions), 1);
  const maxLanding = Math.max(...data.landingPages.map((l) => l.sessions), 1);
  const maxButton = Math.max(...events.buttonClicks.map((b) => b.count), 1);
  const scrollTotal = events.scrollDepth[0]?.count ?? 0;

  const totalWaClicks =
    events.whatsappClicks +
    events.buttonClicks
      .filter((b) => b.label.toLowerCase().includes("whatsapp"))
      .reduce((s, b) => s + b.count, 0);

  return (
    <div className="-mx-2 space-y-8 rounded-3xl bg-gradient-to-b from-neutral-50/80 to-white px-2 py-2 sm:-mx-4 sm:px-4">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-neutral-200 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-900">Site Insights</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Traffic, engagement, conversions &amp; content performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
          <AnalyticsDateRangePicker value={dateRange} onChange={handleDateChange} />
        </div>
      </div>

      {/* Period banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <div>
          Showing data for <strong className="text-neutral-900">{data.dateRange.label}</strong>
          {!data.configured.searchConsole && (
            <span className="ml-2 text-xs text-amber-600">
              · Search metrics unavailable — connect Search Console for per-article data
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={refreshGscData}
          disabled={gscRefreshing || !data.configured.searchConsole}
          className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-white disabled:opacity-40"
        >
          {gscRefreshing ? "Refreshing GSC…" : "Refresh GSC data"}
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="Sessions"
          value={fmtNum(overview.sessions)}
          icon={TrendingUp}
          sub={`${fmtPct(overview.bounceRate)} bounce`}
        />
        <StatCard
          label="Users"
          value={fmtNum(overview.users)}
          icon={Users}
          sub={`${fmtNum(overview.newUsers)} new`}
        />
        <StatCard
          label="Pageviews"
          value={fmtNum(overview.pageviews)}
          icon={Eye}
          sub={`${overview.pagesPerSession.toFixed(1)} per session`}
        />
        <StatCard
          label="Avg Duration"
          value={fmtDuration(overview.avgDurationSeconds)}
          icon={Clock}
        />
        <StatCard
          label="Engagement"
          value={fmtPct(overview.engagementRate)}
          icon={Zap}
          sub={`${fmtNum(overview.engagedSessions)} engaged sessions`}
        />
        <StatCard
          label="WhatsApp"
          value={fmtNum(totalWaClicks)}
          icon={MessageCircle}
          sub={`${fmtNum(data.articles.reduce((s, a) => s + a.whatsappLeads, 0))} article leads`}
        />
      </div>

      {/* Trend chart */}
      {chartValues.length > 1 && (
        <Section title={`Daily trend — ${data.dateRange.label}`}>
          <div className="mb-4 flex gap-1">
            {(["sessions", "pageviews", "users"] as ChartMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setChartMetric(m)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  chartMetric === m
                    ? "bg-primary-100 text-primary-800"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <TimeSeriesChart
            values={chartValues}
            dates={timeSeries.dates}
            color={chartMetric === "sessions" ? "#2563eb" : chartMetric === "pageviews" ? "#009A44" : "#7c3aed"}
          />
        </Section>
      )}

      {/* AI Analyst */}
      <AnalyticsAskPanel dateRange={data.dateRange} />

      <GoogleIndexingPanel />

      {/* Conversions */}
      <Section title="Conversions &amp; engagement events">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "WhatsApp Clicks", value: totalWaClicks, icon: MessageCircle, color: "text-green-600 bg-green-50" },
            { label: "Article Views", value: events.articleViews, icon: BookOpen, color: "text-indigo-600 bg-indigo-50" },
            { label: "Listing Views", value: events.listingViews, icon: BarChart2, color: "text-orange-600 bg-orange-50" },
            { label: "Videos Played", value: events.videoPlays, icon: Play, color: "text-purple-600 bg-purple-50" },
            { label: "Form Leads", value: events.formLeads, icon: FileText, color: "text-blue-600 bg-blue-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg border border-neutral-100 p-3">
              <div className={`mb-2 inline-flex rounded-lg p-1.5 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-display text-xl font-bold text-neutral-900">{fmtNum(value)}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Traffic breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Traffic sources">
          {data.trafficSources.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.trafficSources.map((s, i) => {
                const label =
                  s.medium && s.medium !== "(none)" ? `${s.source} / ${s.medium}` : s.source || "Direct";
                return <BarRow key={i} label={label} value={s.sessions} max={maxSource} />;
              })}
            </div>
          )}
        </Section>

        <Section title="Campaigns">
          {data.campaigns.length === 0 ? (
            <p className="text-sm text-neutral-400">No campaign traffic yet</p>
          ) : (
            <div className="space-y-3">
              {data.campaigns.map((c, i) => (
                <BarRow
                  key={i}
                  label={c.name}
                  value={c.sessions}
                  max={maxCampaign}
                  sub={c.conversions > 0 ? `${fmtNum(c.conversions)} conv` : undefined}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Devices + Countries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Devices">
          {data.devices.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.devices.map((d, i) => (
                <BarRow key={i} label={d.device} value={d.sessions} max={maxDevice} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Countries">
          {data.countries.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.countries.map((c, i) => (
                <BarRow key={i} label={c.country} value={c.sessions} max={maxCountry} />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Top pages + Landing pages */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Top pages">
          {data.topPages.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topPages.map((p, i) => (
                <BarRow
                  key={i}
                  label={p.path || "/"}
                  value={p.views}
                  max={maxPage}
                  sub={fmtDuration(p.avgDurationSeconds)}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="Landing pages">
          {data.landingPages.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.landingPages.map((l, i) => (
                <BarRow key={i} label={l.path || "/"} value={l.sessions} max={maxLanding} />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Playbook articles */}
      <Section title="Playbook article performance">
        {data.articles.length === 0 ? (
          <p className="text-sm text-neutral-400">No article data for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="pb-2 pr-4">Article</th>
                  <th className="pb-2 pr-4 text-right">Views</th>
                  <th className="pb-2 pr-4 text-right">Avg time</th>
                  <th className="pb-2 pr-4 text-right">Search clicks</th>
                  <th className="pb-2 text-right">WA leads</th>
                </tr>
              </thead>
              <tbody>
                {data.articles.slice(0, 15).map((a) => (
                  <tr key={a.slug} className="border-b border-neutral-50">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-neutral-900">{a.slug}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{fmtNum(a.pageViews)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-500">
                      {a.avgDurationSeconds > 0 ? fmtDuration(a.avgDurationSeconds) : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-500">
                      {a.searchClicks > 0 ? fmtNum(a.searchClicks) : "—"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {a.whatsappLeads > 0 ? (
                        <span className="font-semibold text-green-700">{a.whatsappLeads}</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Ad readiness */}
      <Section title="Ad placement signals">
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <Megaphone className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            These metrics help decide where to place ads in playbook articles — high views, long read times,
            and strong scroll completion indicate engaged readers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-xs text-neutral-400">Playbook views</p>
            <p className="font-display text-xl font-bold text-neutral-900">
              {fmtNum(data.adReadiness.totalPlaybookViews)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-xs text-neutral-400">Avg read time</p>
            <p className="font-display text-xl font-bold text-neutral-900">
              {fmtDuration(data.adReadiness.avgPlaybookDurationSeconds)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-xs text-neutral-400">Engagement rate</p>
            <p className="font-display text-xl font-bold text-neutral-900">
              {fmtPct(data.adReadiness.engagementRate)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-xs text-neutral-400">Scroll completion</p>
            <p className="font-display text-xl font-bold text-neutral-900">
              {fmtPct(data.adReadiness.scrollCompletionRate)}
            </p>
          </div>
        </div>
        {data.adReadiness.topArticlesByViews.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-neutral-500">Top articles by views</p>
            {data.adReadiness.topArticlesByViews.map((a, i) => (
              <BarRow key={i} label={a.slug} value={a.views} max={data.adReadiness.topArticlesByViews[0]?.views ?? 1} />
            ))}
          </div>
        )}
      </Section>

      {/* Button clicks + Scroll depth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Button clicks">
          {events.buttonClicks.length === 0 ? (
            <p className="text-sm text-neutral-400">No button click data yet</p>
          ) : (
            <div className="space-y-3">
              {events.buttonClicks.map((b, i) => (
                <BarRow key={i} label={b.label} value={b.count} max={maxButton} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Scroll depth">
          {scrollTotal === 0 ? (
            <p className="text-sm text-neutral-400">No scroll data yet</p>
          ) : (
            <div className="space-y-4">
              {events.scrollDepth.map(({ depth, count }) => (
                <div key={depth} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-semibold text-neutral-500">{depth}</span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100">
                    <div
                      className="h-2 rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${scrollTotal > 0 ? (count / scrollTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-semibold text-neutral-700">
                    {fmtNum(count)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-neutral-400 pt-1">
                {fmtNum(scrollTotal)} users reached 25% scroll depth
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* Top events */}
      {events.topEvents.length > 0 && (
        <Section title="All tracked events">
          <div className="space-y-3">
            {events.topEvents.slice(0, 12).map((e, i) => {
              const maxEvent = events.topEvents[0]?.count ?? 1;
              return <BarRow key={i} label={e.name} value={e.count} max={maxEvent} />;
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
