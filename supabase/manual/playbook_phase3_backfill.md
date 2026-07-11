# Phase 3 — Playbook article backfill

## 1. Apply DB migrations (required before `--apply`)

Run in Supabase SQL Editor (or `psql`):

```sql
-- From supabase/migrations/20250711000000_playbook_article_sections.sql
alter table playbook_videos
  add column if not exists article_sections jsonb;

-- From supabase/migrations/20250711100000_playbook_article_legacy.sql
alter table playbook_videos
  add column if not exists article_legacy text;
```

These are **additive only** — no data is deleted.

## 2. Dry-run (safe, no writes)

```bash
npm run playbook:backfill
# or
npx tsx scripts/backfill-playbook-article-sections.ts --dry-run
```

Writes a JSON report to `scripts/output/playbook-backfill-YYYY-MM-DD.json`.

## 3. Apply backfill

```bash
npm run playbook:backfill:apply
# or
npx tsx scripts/backfill-playbook-article-sections.ts --apply
```

- Backs up original `article` → `article_legacy` (once per row, never overwritten)
- Writes `article_sections`, serialized `article`, and `faq` (extracted from body when empty)
- Skips rows already structured
- Skips **manual** and **low** confidence — fix those in admin or re-run with `--include-low`

Single slug:

```bash
npx tsx scripts/backfill-playbook-article-sections.ts --apply --slug=case-study-why-a-148m-condo-was-the-right-choice-mradre8y
```

## 4. Audit only

```bash
npm run playbook:backfill:audit
```

## 5. Revalidate live pages

After apply, warm ISR:

```bash
npm run playbook:warm
```

Or save any article in Admin → Articles (triggers revalidate).

## Reversibility

Original HTML/markdown is preserved in `article_legacy`. To restore:

```sql
update playbook_videos
set article = article_legacy
where article_legacy is not null and slug = 'your-slug';
```

Structured fields can be cleared separately if needed.
