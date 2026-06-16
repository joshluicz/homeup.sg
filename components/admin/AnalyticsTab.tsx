"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart2, Users, Eye, Clock, TrendingUp, MessageCircle, Play, FileText, Loader2, AlertCircle } from "lucide-react";

// ── GA4 response helpers ──────────────────────────────────────────────────────

interface GA4Row {
  dimensionValues?: { value: string }[];
  metricValues: { value: string }[];
}

interface GA4Report {
  rows?: GA4Row[];
}

function rows(report: GA4Report): GA4Row[] {
  return report?.rows ?? [];
}

function metricVal(row: GA4Row, index = 0): number {
  return parseFloat(row.metricValues?.[index]?.value ?? "0") || 0;
}

function dimVal(row: GA4Row, index = 0): string {
  return row.dimensionValues?.[index]?.value ?? "";
}

function fmtNum(n: number): string {
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

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const W = 300;
  const H = 48;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / (max - min || 1)) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 48 }}>
      <polyline
        points={pts}
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Bar row ───────────────────────────────────────────────────────────────────

function BarRow({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

// ── Setup guide (shown when GA4 not configured) ───────────────────────────────

function SetupGuide() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">GA4 not configured yet</p>
          <p className="mt-1 text-sm text-amber-700">
            Follow these steps to connect Google Analytics.
          </p>
        </div>
      </div>
      <ol className="space-y-3 text-sm text-amber-800 list-decimal list-inside">
        <li>Create a GA4 property at <strong>analytics.google.com</strong> and copy the Measurement ID (G-XXXXXXXX)</li>
        <li>Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX</code> to your GitHub Actions secrets</li>
        <li>In GA4 → Admin → Data Streams → Enhanced Measurement → enable Scrolls &amp; Video Engagement</li>
        <li>Go to <strong>Google Cloud Console</strong> → create a project → enable the Analytics Data API → create a Service Account → download the JSON key</li>
        <li>In GA4 → Admin → Account Access Management → add the service account email as Viewer</li>
        <li>In Supabase dashboard → Edge Functions → Secrets, add:
          <ul className="mt-1 ml-4 space-y-1 list-disc">
            <li><code className="bg-amber-100 px-1 rounded">GA_PROPERTY_ID</code> — numeric ID from GA4 Admin → Property Settings</li>
            <li><code className="bg-amber-100 px-1 rounded">GA_SERVICE_ACCOUNT_JSON</code> — paste the full JSON key contents</li>
          </ul>
        </li>
        <li>Deploy the Supabase Edge Function: <code className="bg-amber-100 px-1 rounded">supabase functions deploy ga4-analytics</code></li>
        <li>Trigger a new build &amp; deploy to activate the GA4 tracking tag</li>
      </ol>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AnalyticsData {
  overview: GA4Report;
  sources: GA4Report;
  campaigns: GA4Report;
  topPages: GA4Report;
  scrollDepth: GA4Report;
  conversions: GA4Report;
  timeSeries: GA4Report;
  buttonClicks: GA4Report;
  days: number;
}

export function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: result, error: fnError } = await supabase.functions.invoke("ga4-analytics", {
        body: { days: d },
      });
      if (fnError) throw fnError;
      if (result?.error === "GA4_NOT_CONFIGURED") {
        setNotConfigured(true);
        return;
      }
      setData(result as AnalyticsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  if (notConfigured) return <SetupGuide />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  // Parse overview
  const overviewRow = rows(data.overview)[0];
  const sessions = overviewRow ? metricVal(overviewRow, 0) : 0;
  const users = overviewRow ? metricVal(overviewRow, 1) : 0;
  const pageviews = overviewRow ? metricVal(overviewRow, 2) : 0;
  const newUsers = overviewRow ? metricVal(overviewRow, 3) : 0;
  const bounceRate = overviewRow ? metricVal(overviewRow, 4) : 0;
  const avgDuration = overviewRow ? metricVal(overviewRow, 5) : 0;

  // Parse sources
  const sourceRows = rows(data.sources);
  const maxSessions = Math.max(...sourceRows.map((r) => metricVal(r, 0)), 1);

  // Parse campaigns
  const campaignRows = rows(data.campaigns).filter((r) => {
    const name = dimVal(r, 0);
    return name && name !== "(not set)";
  });
  const maxCampaignSessions = Math.max(...campaignRows.map((r) => metricVal(r, 0)), 1);

  // Parse top pages
  const pageRows = rows(data.topPages);
  const maxPageViews = Math.max(...pageRows.map((r) => metricVal(r, 0)), 1);

  // Parse scroll depth
  const scrollMap: Record<string, number> = {};
  rows(data.scrollDepth).forEach((r) => {
    scrollMap[dimVal(r, 0)] = metricVal(r, 0);
  });
  const scrollTotal = scrollMap["scroll_25"] || 0;

  // Parse conversions
  const convMap: Record<string, number> = {};
  rows(data.conversions).forEach((r) => {
    convMap[dimVal(r, 0)] = metricVal(r, 0);
  });

  // Parse time series for sparkline
  const timeValues = rows(data.timeSeries).map((r) => metricVal(r, 0));

  // Parse button clicks
  const buttonClickRows = rows(data.buttonClicks);
  const maxButtonClicks = Math.max(...buttonClickRows.map((r) => metricVal(r, 0)), 1);

  return (
    <div className="space-y-8">

      {/* Header + date range */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-neutral-900">Analytics</h2>
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                days === d
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sessions" value={fmtNum(sessions)} icon={TrendingUp} sub={`${fmtPct(bounceRate)} bounce`} />
        <StatCard label="Users" value={fmtNum(users)} icon={Users} sub={`${fmtNum(newUsers)} new`} />
        <StatCard label="Pageviews" value={fmtNum(pageviews)} icon={Eye} sub={`${(pageviews / (sessions || 1)).toFixed(1)} per session`} />
        <StatCard label="Avg Duration" value={fmtDuration(avgDuration)} icon={Clock} />
      </div>

      {/* Sessions sparkline */}
      {timeValues.length > 1 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Sessions — last {days} days
          </p>
          <Sparkline values={timeValues} />
        </div>
      )}

      {/* Sources + Campaigns */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Traffic sources */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Traffic Sources
          </p>
          {sourceRows.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sourceRows.map((r, i) => {
                const source = dimVal(r, 0);
                const medium = dimVal(r, 1);
                const label = medium && medium !== "(none)" ? `${source} / ${medium}` : source;
                return (
                  <BarRow
                    key={i}
                    label={label || "Direct"}
                    value={metricVal(r, 0)}
                    max={maxSessions}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* UTM Campaigns */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            UTM Campaigns
          </p>
          {campaignRows.length === 0 ? (
            <p className="text-sm text-neutral-400">No UTM campaign traffic yet</p>
          ) : (
            <div className="space-y-3">
              {campaignRows.map((r, i) => (
                <BarRow
                  key={i}
                  label={dimVal(r, 0)}
                  value={metricVal(r, 0)}
                  max={maxCampaignSessions}
                  sub={metricVal(r, 1) > 0 ? `${fmtNum(metricVal(r, 1))} conv` : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top pages */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Top Pages
        </p>
        {pageRows.length === 0 ? (
          <p className="text-sm text-neutral-400">No data yet</p>
        ) : (
          <div className="space-y-3">
            {pageRows.map((r, i) => (
              <BarRow
                key={i}
                label={dimVal(r, 0) || "/"}
                value={metricVal(r, 0)}
                max={maxPageViews}
                sub={fmtDuration(metricVal(r, 1))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Button Clicks */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Button Clicks
        </p>
        {buttonClickRows.length === 0 ? (
          <p className="text-sm text-neutral-400">No button click data yet</p>
        ) : (
          <div className="space-y-3">
            {buttonClickRows.map((r, i) => (
              <BarRow
                key={i}
                label={dimVal(r, 0) || "Unknown"}
                value={metricVal(r, 0)}
                max={maxButtonClicks}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll depth + Conversions */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Scroll depth */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Scroll Depth
          </p>
          {scrollTotal === 0 ? (
            <p className="text-sm text-neutral-400">No scroll data yet — tracking fires after first deploy</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "25%", key: "scroll_25" },
                { label: "50%", key: "scroll_50" },
                { label: "75%", key: "scroll_75" },
                { label: "100%", key: "scroll_100" },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-semibold text-neutral-500">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100">
                    <div
                      className="h-2 rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${scrollTotal > 0 ? ((scrollMap[key] || 0) / scrollTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-semibold text-neutral-700">
                    {fmtNum(scrollMap[key] || 0)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-neutral-400 pt-1">
                Users who scrolled to each depth ({fmtNum(scrollTotal)} reached 25%)
              </p>
            </div>
          )}
        </div>

        {/* Conversion events */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Conversions
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "click_whatsapp", label: "WhatsApp Clicks", icon: MessageCircle, color: "text-green-600 bg-green-50" },
              { key: "generate_lead", label: "Form Leads", icon: FileText, color: "text-blue-600 bg-blue-50" },
              { key: "video_play", label: "Videos Played", icon: Play, color: "text-purple-600 bg-purple-50" },
              { key: "listing_view", label: "Listing Views", icon: BarChart2, color: "text-orange-600 bg-orange-50" },
            ].map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="rounded-lg border border-neutral-100 p-3">
                <div className={`mb-2 inline-flex rounded-lg p-1.5 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display text-xl font-bold text-neutral-900">
                  {fmtNum(convMap[key] || 0)}
                </p>
                <p className="text-xs text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
