/**
 * Phase 5 — Article freshness detection.
 *
 * Scans published articles for signals that content is stale:
 *   1. stale_year   — article text references a year that is now >1 year ago
 *   2. stale_figure — article references a known figure that has changed
 *                     (ABSD rates, HDB loan rate, etc.) vs current sgFacts
 *   3. ranking_drop — GSC avg position worsened by >5 places vs 14 days prior
 *   4. age          — article is older than AGE_THRESHOLD_DAYS with no refresh
 *
 * Returns a list of RefreshSignal objects that the cron route writes to the DB.
 */

import { SG_FACTS } from "./sgFacts";

const CURRENT_YEAR = new Date().getFullYear();
const AGE_THRESHOLD_DAYS = 365;
const RANKING_DROP_THRESHOLD = 5; // positions

// ── Types ─────────────────────────────────────────────────────────────────────

export type RefreshReason = "stale_year" | "stale_figure" | "ranking_drop" | "age";

export interface RefreshSignal {
  slug: string;
  reason: RefreshReason;
  detail: string;
}

// ── Known stale-figure patterns ───────────────────────────────────────────────
// Each entry: a regex that matches an outdated claim + a note about what changed.
// Only add patterns when we're confident the figure has changed.

interface FigurePattern {
  pattern: RegExp;
  detail: string;
}

const STALE_FIGURE_PATTERNS: FigurePattern[] = [
  // ABSD — flag any specific % that no longer matches current rates
  {
    pattern: /\bABSD\s+(?:of\s+)?(?:12|15|17|20|25|30|35|60)\s*%/i,
    detail: "Contains a specific ABSD % — verify against current IRAS rates (last updated Apr 2023).",
  },
  // HDB concessionary loan rate — current is 2.6%
  {
    pattern: /\bHDB\s+(?:loan|concessionary)[^.]*?(?:2\.[0-5]|3\.[0-9]|4\.[0-9])\s*%/i,
    detail:
      "References an HDB loan interest rate that may differ from current 2.6% p.a. (CPF OA + 0.1%).",
  },
  // TDSR threshold — flag if article mentions 60% (was changed to 55% in 2022)
  {
    pattern: /\bTDSR\b[^.]*?\b60\s*%/i,
    detail: "References 60% TDSR — current threshold is 55% (MAS updated Sep 2022).",
  },
  // MSR — should be 30% for HDB loans
  {
    pattern: /\bMSR\b[^.]*?\b(?:25|35)\s*%/i,
    detail: "References MSR at a rate other than the current 30%.",
  },
  // LTV — flag 80% bank LTV (was reduced in some cooling measures)
  {
    pattern: /bank\s+(?:loan|LTV)[^.]*?\b80\s*%/i,
    detail: "References 80% bank LTV — current maximum is 75% for first property.",
  },
];

// ── Staleness detectors ───────────────────────────────────────────────────────

/** Finds year mentions that are more than 1 year in the past */
function detectStaleYears(slug: string, article: string): RefreshSignal[] {
  const signals: RefreshSignal[] = [];
  // Match 4-digit years between 2018 and last year (not current year or future)
  const yearRe = /\b(20[1-2]\d)\b/g;
  const years = new Set<number>();
  let m: RegExpExecArray | null;
  while ((m = yearRe.exec(article)) !== null) {
    const y = parseInt(m[1], 10);
    if (y < CURRENT_YEAR - 1) years.add(y);
  }

  if (years.size > 0) {
    const oldest = Math.min(...years);
    signals.push({
      slug,
      reason: "stale_year",
      detail: `Article references ${oldest} — content may be outdated (now ${CURRENT_YEAR}).`,
    });
  }
  return signals;
}

/** Checks article text against known stale figure patterns */
function detectStaleFigures(slug: string, article: string): RefreshSignal[] {
  const signals: RefreshSignal[] = [];
  for (const { pattern, detail } of STALE_FIGURE_PATTERNS) {
    if (pattern.test(article)) {
      signals.push({ slug, reason: "stale_figure", detail });
    }
  }
  return signals;
}

/** Flags articles whose GSC position dropped significantly vs 14 days ago */
function detectRankingDrops(
  slug: string,
  metrics: { date: string; position: number | null }[],
): RefreshSignal[] {
  if (metrics.length < 14) return [];

  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const prior = sorted.slice(-14, -7);

  const avgPos = (rows: typeof sorted) => {
    const valid = rows.filter((r) => r.position !== null).map((r) => r.position as number);
    return valid.length > 0 ? valid.reduce((s, p) => s + p, 0) / valid.length : null;
  };

  const recentPos = avgPos(recent);
  const priorPos = avgPos(prior);

  // Lower position number = better rank; a drop means the number increased
  if (recentPos !== null && priorPos !== null && recentPos - priorPos >= RANKING_DROP_THRESHOLD) {
    const signals: RefreshSignal[] = [];
    signals.push({
      slug,
      reason: "ranking_drop",
      detail: `Avg GSC position dropped from #${priorPos.toFixed(1)} to #${recentPos.toFixed(1)} over 14 days.`,
    });
    return signals;
  }
  return [];
}

/** Flags articles older than AGE_THRESHOLD_DAYS */
function detectAge(slug: string, publishedAt: string): RefreshSignal[] {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays >= AGE_THRESHOLD_DAYS) {
    return [
      {
        slug,
        reason: "age",
        detail: `Article is ${Math.floor(ageDays)} days old — scheduled annual review.`,
      },
    ];
  }
  return [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ArticleRow {
  slug: string;
  article: string;
  published_at: string;
}

export interface MetricRow {
  slug: string;
  date: string;
  position: number | null;
}

/**
 * Runs all freshness detectors across the given articles + their GSC metrics.
 * Returns deduplicated signals (one per slug per reason).
 */
export function detectFreshness(
  articles: ArticleRow[],
  metrics: MetricRow[],
): RefreshSignal[] {
  const signals: RefreshSignal[] = [];
  const seen = new Set<string>(); // "slug::reason" dedup key

  const metricsBySlug = new Map<string, { date: string; position: number | null }[]>();
  for (const m of metrics) {
    if (!metricsBySlug.has(m.slug)) metricsBySlug.set(m.slug, []);
    metricsBySlug.get(m.slug)!.push({ date: m.date, position: m.position });
  }

  for (const article of articles) {
    const { slug, article: body, published_at } = article;
    const articleMetrics = metricsBySlug.get(slug) ?? [];

    const candidates: RefreshSignal[] = [
      ...detectStaleYears(slug, body),
      ...detectStaleFigures(slug, body),
      ...detectRankingDrops(slug, articleMetrics),
      ...detectAge(slug, published_at),
    ];

    for (const signal of candidates) {
      const key = `${signal.slug}::${signal.reason}`;
      if (!seen.has(key)) {
        seen.add(key);
        signals.push(signal);
      }
    }
  }

  return signals;
}

// Export constants for tests / UI
export { CURRENT_YEAR, AGE_THRESHOLD_DAYS, RANKING_DROP_THRESHOLD };
