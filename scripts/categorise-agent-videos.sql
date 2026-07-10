-- ============================================================
-- Auto-categorise agent_profile_videos by scanning titles
-- ============================================================
-- Paste this into your Supabase SQL editor and run.
-- Safe to re-run — later steps never override earlier ones.
--
-- Categories applied (in priority order):
--   1. home_tour    — property walkthroughs, showflats, open houses
--   2. landed       — landed-property-specific content
--   3. property_tips — advice, market commentary, legal/financial tips
--   (anything unmatched stays as 'others')
-- ============================================================

-- ── PREVIEW (run this first to see what will change) ──────────
-- SELECT title, category FROM agent_profile_videos ORDER BY category, title;

-- ── Step 1: Home Tour ─────────────────────────────────────────
UPDATE agent_profile_videos
SET category = 'home_tour', updated_at = NOW()
WHERE (
  LOWER(title) LIKE '%home tour%'
  OR LOWER(title) LIKE '%hometour%'
  OR LOWER(title) LIKE '%showflat%'
  OR LOWER(title) LIKE '%show flat%'
  OR LOWER(title) LIKE '%open house%'
  OR LOWER(title) LIKE '%live balloting%'
  OR LOWER(title) LIKE '%outdoor live%'
);

-- ── Step 2: Landed ────────────────────────────────────────────
-- Only applies where Step 1 did not match
UPDATE agent_profile_videos
SET category = 'landed', updated_at = NOW()
WHERE category NOT IN ('home_tour')
  AND (
    LOWER(title) LIKE '%bungalow%'
    OR LOWER(title) LIKE '%cluster house%'
    OR LOWER(title) LIKE '%private lift%'
    OR LOWER(title) LIKE '%smaller landed%'
    OR (LOWER(title) LIKE '%terrace%'
        AND LOWER(title) NOT LIKE '%testimonial%')
    OR (LOWER(title) LIKE '%freehold%' AND LOWER(title) LIKE '%terrace%')
    OR (LOWER(title) LIKE '%landed%'
        AND LOWER(title) NOT LIKE '%testimonial%'
        AND LOWER(title) NOT LIKE '%inherited%'
        AND LOWER(title) NOT LIKE '%hdb%'
        AND LOWER(title) NOT LIKE '%seller%')
  );

-- ── Step 3: Property Tips ─────────────────────────────────────
-- Only applies where Steps 1 & 2 did not match
UPDATE agent_profile_videos
SET category = 'property_tips', updated_at = NOW()
WHERE category NOT IN ('home_tour', 'landed')
  AND (
    LOWER(title) LIKE '%should you%'
    OR LOWER(title) LIKE '%why%'
    OR LOWER(title) LIKE '%how%'
    OR LOWER(title) LIKE '%tip%'
    OR LOWER(title) LIKE '%absd%'
    OR LOWER(title) LIKE '%en bloc%'
    OR LOWER(title) LIKE '%enbloc%'
    OR LOWER(title) LIKE '%psf%'
    OR LOWER(title) LIKE '%capital appreciation%'
    OR LOWER(title) LIKE '%resale%'
    OR LOWER(title) LIKE '%99-1%'
    OR LOWER(title) LIKE '%decouple%'
    OR LOWER(title) LIKE '%new launch%'
    OR LOWER(title) LIKE '%hdb%'
    OR LOWER(title) LIKE '%condo%'
    OR LOWER(title) LIKE '%testimonial%'
    OR LOWER(title) LIKE '%sold%'
    OR LOWER(title) LIKE '%freehold%'
    OR LOWER(title) LIKE '%inherited%'
    OR LOWER(title) LIKE '%interview%'
    OR LOWER(title) LIKE '%buyer%'
    OR LOWER(title) LIKE '%owner%'
    OR LOWER(title) LIKE '%sell%'
    OR LOWER(title) LIKE '%buy%'
    OR LOWER(title) LIKE '%government%'
    OR LOWER(title) LIKE '%policy%'
    OR LOWER(title) LIKE '%iras%'
    OR LOWER(title) LIKE '%retire%'
    OR LOWER(title) LIKE '%high floor%'
    OR LOWER(title) LIKE '%low floor%'
    OR LOWER(title) LIKE '%pre war%'
    OR LOWER(title) LIKE '%sue%'
    OR LOWER(title) LIKE '%charged%'
    OR LOWER(title) LIKE '%integrated%'
    OR LOWER(title) LIKE '%concurrent%'
    OR LOWER(title) LIKE '%commission%'
    OR LOWER(title) LIKE '%law firm%'
    OR LOWER(title) LIKE '%upgrader%'
    OR LOWER(title) LIKE '%starpoint%'
    OR LOWER(title) LIKE '%mandarin garden%'
    OR LOWER(title) LIKE '%citylife%'
    OR LOWER(title) LIKE '%braddell%'
    OR LOWER(title) LIKE '%watercolour%'
    OR LOWER(title) LIKE '%regentville%'
    OR LOWER(title) LIKE '%promise%'
    OR LOWER(title) LIKE '%wait%'
    OR LOWER(title) LIKE '%age %'
    OR LOWER(title) LIKE '%invest%'
    OR LOWER(title) LIKE '%first%'
    OR LOWER(title) LIKE '%rivelle%'
  );

-- ── Results summary ───────────────────────────────────────────
SELECT category, COUNT(*) AS count
FROM agent_profile_videos
GROUP BY category
ORDER BY category;
