# HomeUP Article Pipeline — Reference

A full-stack article generation and measurement pipeline built into the HomeUP admin panel.
Turns first-party transaction data + AI writing into SEO- and GEO-optimised property content
with provable lead attribution.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Environment variables](#2-environment-variables)
3. [Wire-up points](#3-wire-up-points)
4. [Phase-by-phase feature map](#4-phase-by-phase-feature-map)
5. [Database tables](#5-database-tables)
6. [Cron / scheduled jobs](#6-cron--scheduled-jobs)

---

## 1. Architecture overview

```
Admin dashboard  ──►  /api/admin/{topics,generate,publish}
                              │
                    lib/pipeline/generate.ts  ← orchestrator
                    ├── radar.ts          (trend / demand signals)
                    ├── brief.ts          (topic + keyword brief)
                    ├── transactions.ts   (first-party aggregate stats)
                    ├── draft.ts          (Claude claude-sonnet-5)
                    ├── compliance.ts     (CEA + structure gate)
                    ├── internalLinks.ts  (pillar→cluster links via Claude)
                    ├── audit.ts          (LLM SEO/GEO/AEO audit via Claude)
                    └── packageArticle.ts (meta + JSON-LD + scores)
                              │
                         Supabase DB  ←──  playbook_videos (publish target)
                                           transactions
                                           article_metrics
                                           lead_events
                                           ai_citations
                                           refresh_queue
```

All admin routes live under `app/api/admin/*` and are gated by `requireAuth()`
from `lib/supabase/auth.ts` (Supabase session cookie).

---

## 2. Environment variables

All variables are **server-only** (never exposed to the client).

### Core — required for article generation

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (`claude-sonnet-5`). Used for brief, draft, compliance, internal-link selection, and LLM audit. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (admin DB writes, bypasses RLS) |

### Phase 2 — Google Search Console (optional)

| Variable | Description |
|---|---|
| `GSC_SERVICE_ACCOUNT_JSON` | Full JSON string of the GCP service-account key. The service account must be added to GSC with **Full** permission. |
| `GSC_SITE_URL` | Verified GSC property, e.g. `sc-domain:homeup.sg` |

Without these, the GSC columns in the analytics dashboard show dashes. Set them and click **Refresh GSC data** in the dashboard.

### Phase 3 — AI citation tracker (optional)

| Variable | Description |
|---|---|
| `PERPLEXITY_API_KEY` | Perplexity API key. Without this, the "AI Citations" column is hidden and `isAiCitationsConfigured()` returns false. |

### Phase 5 — Freshness cron (required for automated scanning)

| Variable | Description |
|---|---|
| `CRON_SECRET` | Arbitrary secret string. The cron route (`GET /api/cron/freshness`) requires `Authorization: Bearer <CRON_SECRET>`. Without it the route returns 401. |

Add to `vercel.json` to run daily at 02:00 UTC:

```json
{
  "crons": [
    { "path": "/api/cron/freshness", "schedule": "0 2 * * *" }
  ]
}
```

---

## 3. Wire-up points

There are two critical wire-up points when deploying to a new environment.

### 3a. Transaction data

**File:** `lib/pipeline/transactions.ts`

HomeUP uploads proprietary sales data via the admin CSV upload page
(`/admin/transactions`). The CSV must contain these columns:

| Column | Type | Required |
|---|---|---|
| `property_type` | string | ✓ |
| `town` | string | ✓ |
| `segment` | string | |
| `sold_price` | number | ✓ |
| `days_on_market` | number | |
| `net_vs_valuation` | number | |
| `year` | number | ✓ |

**Privacy guarantee:** `getTransactionStats()` only returns aggregates for
`(town, property_type)` groups with **≥ 5 rows**. Groups below this threshold
are silently dropped — no individual sale is ever surfaced.

The stats are injected into every article draft as:
> *"Based on our N sales in [Town]…"*

If no data exists for a topic's category, the article generates without the stat
block (graceful degradation).

### 3b. Publish target

**File:** `lib/pipeline/publishTarget.ts`

`publishArticle()` is called by `POST /api/admin/publish`. It writes the
finished article into the `playbook_videos` table in Supabase (`article`,
`meta_description`, `audit_scores`, `published_at`).

To change the publish destination (e.g. a CMS or external API), replace the
body of `publishArticle()` in `lib/pipeline/publishTarget.ts`. The function
signature must remain:

```ts
export async function publishArticle(article: PackagedArticle): Promise<{ slug: string }>
```

---

## 4. Phase-by-phase feature map

### Phase 1 — Transaction data moat
- `lib/pipeline/transactions.ts` — fetches and aggregates proprietary sales data
- `supabase/migrations/20250709000000_transactions.sql` — `transactions` table
- `app/api/admin/transactions/route.ts` — CSV upload / clear
- `app/(admin)/admin/(dashboard)/transactions/page.tsx` — upload UI
- `components/admin/TransactionsTab.tsx` — drag-drop CSV upload component

### Phase 2 — Measurement & ROI dashboard
- `lib/analytics/gsc.ts` — Google Search Console client + daily cache
- `app/go/whatsapp/route.ts` — public tracked redirect (`/go/whatsapp?slug=…`)
- `app/api/admin/analytics/gsc/route.ts` — fetch / cache GSC metrics
- `app/api/admin/analytics/leads/route.ts` — per-slug WhatsApp lead counts
- `supabase/migrations/20250709100000_article_metrics.sql` — `article_metrics` + `lead_events`
- `components/admin/ArticleAnalyticsDashboard.tsx` — full ROI dashboard

### Phase 3 — AI citation tracker
- `lib/analytics/aiCitations.ts` — Perplexity-powered citation detection
- `app/api/admin/analytics/citations/route.ts` — check + surface citation scores
- `supabase/migrations/20250709200000_ai_citations.sql` — `ai_citations` table
- Integrated into `ArticleAnalyticsDashboard.tsx` as a per-article column

### Phase 4 — Internal linking + real LLM audit
- `lib/pipeline/internalLinks.ts` — Claude picks 3-5 relevant existing articles and appends links
- `lib/pipeline/audit.ts` — Claude SEO/GEO/AEO rubric audit, hard gate at `PUBLISH_THRESHOLD = 8`
- `components/admin/ArticleGenerationTab.tsx` — renders LLM audit scores, override checkbox

### Phase 5 — Freshness loop
- `lib/pipeline/freshness.ts` — detects stale years, stale figures, ranking drops, article age
- `app/api/cron/freshness/route.ts` — daily cron endpoint (requires `CRON_SECRET`)
- `app/api/admin/analytics/refresh-queue/route.ts` — list + dismiss pending items
- `supabase/migrations/20250709300000_refresh_queue.sql` — `refresh_queue` table
- "Needs Refresh" card in `ArticleAnalyticsDashboard.tsx`

---

## 5. Database tables

| Table | Purpose |
|---|---|
| `playbook_videos` | Published articles (pre-existing) |
| `transactions` | Raw proprietary sales rows (admin-upload only) |
| `article_metrics` | GSC clicks/impressions/position cache (per slug per day) |
| `lead_events` | WhatsApp CTA click log (slug + timestamp) |
| `ai_citations` | Per-article, per-question citation results from Perplexity |
| `refresh_queue` | Articles flagged for review by the freshness scanner |

All new tables have RLS enabled. Writes require the service-role key.
`lead_events` additionally allows anonymous inserts (public WhatsApp tracking).

---

## 6. Cron / scheduled jobs

| Route | Schedule | Auth |
|---|---|---|
| `GET /api/cron/freshness` | `0 2 * * *` (daily 02:00 UTC) | `Authorization: Bearer CRON_SECRET` |

To wire up on Vercel, add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/freshness", "schedule": "0 2 * * *" }
  ]
}
```

Vercel automatically injects a `CRON_SECRET` header matching the project secret when calling cron routes — no manual header needed from the Vercel side.
