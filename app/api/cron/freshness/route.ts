/**
 * GET /api/cron/freshness
 *
 * Scheduled freshness scanner. Should be called by Vercel Cron (or any HTTP
 * scheduler) once per day.
 *
 * Security: requires the Authorization header to equal "Bearer <CRON_SECRET>".
 * Set CRON_SECRET as a server-only env var. Without it the route is a no-op
 * (returns 401) — never publicly executable.
 *
 * What it does:
 *   1. Fetch all published articles from playbook_videos
 *   2. Fetch recent GSC metrics from article_metrics
 *   3. Run detectFreshness() — stale years, stale figures, ranking drops, age
 *   4. Insert new signals into refresh_queue (skip slugs already pending)
 *   5. Return a summary { scanned, queued, skipped }
 *
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/freshness", "schedule": "0 2 * * *" }] }
 */

import { createServiceClient } from "@/lib/supabase/service";
import { detectFreshness } from "@/lib/pipeline/freshness";
import type { ArticleRow, MetricRow } from "@/lib/pipeline/freshness";
import { NextResponse } from "next/server";

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // disabled until configured
  const auth = request.headers.get("Authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Fetch all published articles (article column non-empty)
  const { data: articles, error: artErr } = await supabase
    .from("playbook_videos")
    .select("slug, article, published_at")
    .neq("article", "");

  if (artErr) {
    return NextResponse.json({ error: artErr.message }, { status: 500 });
  }

  // 2. Fetch GSC metrics (last 30 days)
  const { data: metrics } = await supabase
    .from("article_metrics")
    .select("slug, date, position")
    .order("date", { ascending: true });

  // 3. Run freshness detection
  const signals = detectFreshness(
    (articles ?? []) as ArticleRow[],
    (metrics ?? []) as MetricRow[],
  );

  if (signals.length === 0) {
    return NextResponse.json({ scanned: (articles ?? []).length, queued: 0, skipped: 0 });
  }

  // 4. Find slugs already in the queue as 'pending' to avoid duplicates
  const signalSlugs = [...new Set(signals.map((s) => s.slug))];
  const { data: existing } = await supabase
    .from("refresh_queue")
    .select("slug, reason")
    .in("slug", signalSlugs)
    .eq("status", "pending");

  const alreadyQueued = new Set(
    (existing ?? []).map((r: { slug: string; reason: string }) => `${r.slug}::${r.reason}`),
  );

  const toInsert = signals
    .filter((s) => !alreadyQueued.has(`${s.slug}::${s.reason}`))
    .map((s) => ({
      slug: s.slug,
      reason: s.reason,
      detail: s.detail,
      detected_at: new Date().toISOString(),
      status: "pending",
    }));

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from("refresh_queue").insert(toInsert);
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    scanned: (articles ?? []).length,
    queued: toInsert.length,
    skipped: signals.length - toInsert.length,
  });
}
