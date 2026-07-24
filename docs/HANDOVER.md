# HomeUp — Ownership Handover Runbook

**Purpose:** Transfer the HomeUp website, database, domain, and supporting third-party
accounts from Joshua's personal accounts to the owners' own accounts — with **no rebuild,
no data migration, and zero downtime**.

**Strategy:** *Targeted per-asset transfer.* Every platform in the stack supports moving a
single project/app/domain into a different account, so we move each asset individually
rather than transferring whole organizations (which would drag along Joshua's unrelated
assets — see [Entanglements](#8-known-entanglements--gotchas)).

> Owner of this doc: keep it updated as each step completes. Tick the checkboxes as you go.

---

## 1. Asset inventory

| Asset | Identifier / location | Currently owned by | Target owner |
|---|---|---|---|
| **Website code** | GitHub `joshluicz/homeup.sg` (Next.js) | Joshua | Owners' GitHub org |
| **Web hosting** | Vercel project (a Vercel account **not** `joshluicz's projects` — that one only holds `theshadeslab-my`; confirm which team) | Joshua (separate Vercel account) | Owners' Vercel team |
| **Database + backend** | Supabase project `HOMEUP`, ref `ixhikkbytusikgjiuvqa`, region `ap-southeast-1`, Postgres 17 | Supabase org `HOMEUP` (`rzlrerttcckczpjhpxlm`) — Joshua | Owners' new Supabase org |
| **Domain** | `homeup.sg` (registrar TBD — confirm) | Joshua | Owners' registrar account |
| **DNS** | Cloudflare zone for `homeup.sg` | Joshua's Cloudflare | Owners' Cloudflare |
| **LLM** | Anthropic API key | Joshua | Owners' Anthropic org |
| **Video pipeline** | fal.ai API key + n8n workflow (calls the `generate-room-clip` edge function) | Joshua | Owners |
| **Analytics** | GA4 property `G-FYWLSSTYJ6` + GA service-account JSON | Joshua | Owners |
| **Search Console** | GSC property `sc-domain:homeup.sg` + service account | Joshua | Owners |
| **Maps** | Google Maps API key (JS + Embed) | Joshua | Owners |
| **Listings source of truth** | Google Sheet `1CpaVMBfq6fJRb2ymeeBOfLYYeyfJ2hB8QzdlxdZN0io` | Joshua | Owners |
| **Sync kit** | `homeup-listings-sync-kit.zip` distributed to Batam admin team + their `.env.local` | Joshua | Owners |
| **(Optional) Perplexity** | `PERPLEXITY_API_KEY` (research scripts) | Joshua | Owners |

### Supabase project detail (`ixhikkbytusikgjiuvqa`)

- **Tables (15):** `listings` (149 rows), `pg_listing_sources` (136), `pg_agent_profiles`,
  `playbook_videos` (149), `profiles` (8 admin users), `media_jobs`, `media_files` (107),
  `blueprints` (24), `agent_profile_videos` (189), `media_pipeline_runs` (897),
  `media_pipeline_steps` (1,499), `rental_intakes` (**real tenant leads**), `article_metrics`
  (372), `lead_events`, `url_index_checks`. All RLS-enabled.
- **Edge functions (3):** `import-listing` (JWT), `ga4-analytics` (JWT),
  `generate-room-clip` (**no JWT** — called server-to-server by n8n).
- **Storage buckets (3, all public):** `listing-images`, `listing-photos`, `playbook videos`.
- **Migrations:** 21 files in `supabase/migrations/` (source of truth for schema).

> A **project transfer** (not org transfer) keeps the project ref, database, storage,
> edge functions, **and the anon + service_role keys and URL** — so **no code or env
> changes are needed and the site never goes down**. This is the whole reason we do it this way.

---

## 2. Prerequisites — what the owners must create first

Nothing below touches the live system; do these in advance.

- [ ] **Supabase account** + a **new organization** on a **paid plan** (the project uses
      paid features; the receiving org must be able to host it). Joshua must be added as a
      member of that org to perform the transfer.
- [ ] **Vercel team** (or account) on a plan matching current usage. Connect this account to
      a Claude Code session if you want it driven via MCP.
- [ ] **Cloudflare account** (free tier is fine for DNS).
- [ ] **Registrar access** for `homeup.sg` (confirm who the registrar is — SGNIC-accredited
      for `.sg`).
- [ ] **Anthropic** org + billing, **fal.ai** account, **Google Cloud** project (for GA/GSC
      service accounts + Maps key), **n8n** instance (or takeover of the existing one),
      **Google account** to own the listings Sheet.
- [ ] **GitHub org/account** to receive the `homeup.sg` repo (and admin rights to accept the transfer).

---

## 3. Secrets & environment inventory

Every variable the app / functions / scripts read. "Where set" = where the value must exist
after handover. **Do not paste any secret into git, chat, email, or WhatsApp** — move them
via a password manager (1Password/Bitwarden) as the existing team already does.

### Web app (Vercel project env vars)

| Variable | Purpose | Sensitivity | Handover action |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | public | Unchanged after project transfer (ref stays `ixhikkbytusikgjiuvqa`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | public | Unchanged |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin DB access | **secret** | Unchanged by transfer, but **rotate after handover** (Joshua held it) |
| `SUPABASE_DB_PASSWORD` | Direct DB password (scripts) | **secret** | **Rotate after handover** |
| `INTAKE_FORM_SECRET` | Signs rent-intake form tokens (≥16 chars) | **secret** | Regenerate; owners set a new value |
| `CRON_SECRET` | Protects cron/scheduled routes | **secret** | Regenerate |
| `ANTHROPIC_API_KEY` | Article pipeline + listing extraction | **secret** | New owner key |
| `PERPLEXITY_API_KEY` | Research scripts (optional) | **secret** | New owner key (or drop) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 tag (`G-FYWLSSTYJ6`) | public | New owner property (create new GA4, update ID) |
| `GA_PROPERTY_ID` | GA4 Data API (admin dashboard) | config | New owner property ID |
| `GA_SERVICE_ACCOUNT_JSON` | GA4 Data API auth | **secret** | New owner service account |
| `GSC_SERVICE_ACCOUNT_JSON` | Search Console API | **secret** | New owner service account (falls back to `GA_SERVICE_ACCOUNT_JSON`) |
| `GSC_SITE_URL` | GSC property | config | `sc-domain:homeup.sg` (unchanged) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JS | public (restrict by referrer) | New owner key |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Maps Embed | public | New owner key |
| `NEXT_PUBLIC_CONTACT_WHATSAPP` | Thank-you CTA number | public | Owners' number |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | public | `https://homeup.sg` (unchanged) |
| `CLOUDFLARE_API_TOKEN` | DNS-AID publish script (Zone.DNS + DNSSEC) | **secret** | New owner token |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone | config | New owner's zone ID after DNS move |
| `CLOUDFLARE_DOMAIN` | `homeup.sg` | config | Unchanged |
| `HOMEUP_LLM_MODEL` | Optional model override | config | Optional |
| `NEXT_PUBLIC_PG_FETCH_AGENT_URL` / `PG_*` | Local sync-kit agent config | config | Batam laptop `.env.local` only (not Vercel) |

### Edge function secrets (Supabase → Edge Functions → Secrets)

| Secret | Used by | Handover action |
|---|---|---|
| `ANTHROPIC_API_KEY` | `import-listing` | New owner key |
| `FAL_API_KEY` | `generate-room-clip` | New owner fal.ai key |
| `GA_SERVICE_ACCOUNT_JSON` | `ga4-analytics` | New owner service account |
| `GA_PROPERTY_ID` | `ga4-analytics` | New owner property ID |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | all | Auto-injected by Supabase — no action |

### ⚠️ Not for handover — leave with Joshua

`PROPMETA_DB_HOST`, `PROPMETA_DB_PORT`, `PROPMETA_DB_USER`, `PROPMETA_DB_PASSWORD`,
`PROPMETA_DB_DATABASE`, `PROPMETA_DB_MAX`, `PROPMETA_AUTH_SECRET` — these point at the
**separate `propmeta-console` project** and must **not** move with HomeUp. Confirm which
scripts read them and whether the handed-over site needs them at all (likely dev/admin-only).
See [Entanglements](#8-known-entanglements--gotchas).

---

## 4. Transfer sequence

Do the phases in order. After each phase, run its **Verify** step before moving on. Each
phase has a **Rollback**. Pick a low-traffic window; total hands-on time is ~1–2 hours plus
DNS propagation.

### Phase 0 — Prep & backup (no live change)
- [ ] Confirm all [prerequisites](#2-prerequisites--what-the-owners-must-create-first) are done.
- [ ] **Full DB backup**: Supabase → Database → Backups (take a fresh on-demand backup), and
      keep the `supabase/migrations/` folder as the schema source of truth.
- [ ] **Export storage** (optional safety): snapshot the 3 public buckets.
- [ ] Snapshot current **DNS records** (screenshot / export the Cloudflare zone file).
- [ ] Snapshot current **Vercel env vars** and **Supabase edge secrets** (names + values into
      the password manager).
- **Rollback:** none needed — nothing changed.

### Phase 1 — Supabase project transfer
- [ ] Add Joshua to the owners' new Supabase org (Owner/Admin).
- [ ] Supabase → project `HOMEUP` → Settings → General → **Transfer project** → select the
      owners' org → confirm.
- [ ] Re-add **edge function secrets** in the new org context if they don't carry over
      (`FAL_API_KEY`, `ANTHROPIC_API_KEY`, `GA_*`). Verify `generate-room-clip` still has
      `verify_jwt = false` (see `supabase/config.toml`).
- **Verify:** open the live site → a listings page loads (reads `listings`), submit a test
  rent-intake (writes `rental_intakes`), admin login works (`profiles`). Project ref, URL,
  and keys are unchanged, so the site should behave identically.
- **Rollback:** transfer the project back to Joshua's org (same feature, reverse direction).

### Phase 2 — Vercel project transfer
- [ ] Identify the Vercel team currently hosting `homeup.sg` (it is **not** `joshluicz's
      projects`). Connect it or get Dashboard access.
- [ ] Vercel → project → Settings → **Transfer** → owners' team.
- [ ] Confirm all **env vars** carried over; re-enter any that didn't (see §3).
- [ ] Reconnect the **Git integration** to the repo (after Phase 5 if the repo also moves).
- **Verify:** trigger a redeploy; build succeeds; `https://homeup.sg` serves the new
  deployment; check Vercel function logs for the `admin/generate` route (120s maxDuration).
- **Rollback:** transfer the project back; or the previous team's last deployment is still
  in history.

### Phase 3 — Domain & DNS
- [ ] In the owners' Cloudflare: **Add site** `homeup.sg`, let it import records, then
      **reconcile against the Phase 0 snapshot** (A/AAAA/CNAME to Vercel, MX, TXT/SPF/DKIM,
      `sc-domain` verification TXT, IndexNow/DNS-AID records).
- [ ] At the **registrar**, update nameservers to the owners' Cloudflare NS.
- [ ] After propagation, in Vercel add/verify the `homeup.sg` domain on the transferred project.
- [ ] **Transfer the domain registration** to the owners' registrar account (unlock + auth
      code / SGNIC process). This can lag DNS by days — DNS control is what matters for uptime.
- [ ] Update `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` env vars to the new account.
- **Verify:** `dig homeup.sg` resolves; HTTPS valid; site loads on the apex + `www`; email
  (if any) still flows; GSC property still verified.
- **Rollback:** revert nameservers at the registrar to Joshua's Cloudflare (keep it live
  until cutover confirmed — don't delete the old zone for ~1 week).

### Phase 4 — Third-party accounts
- [ ] **Anthropic:** owners create API key; update Vercel `ANTHROPIC_API_KEY` + edge secret.
- [ ] **fal.ai:** owners create key; update `generate-room-clip` `FAL_API_KEY`.
- [ ] **n8n:** move/recreate the workflow that calls `generate-room-clip`; update its stored
      credentials + the function URL.
- [ ] **GA4:** create new property (or transfer GA account); update `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
      `GA_PROPERTY_ID`, `GA_SERVICE_ACCOUNT_JSON`.
- [ ] **GSC:** owners verify `sc-domain:homeup.sg` (via the DNS TXT they now control); update
      `GSC_SERVICE_ACCOUNT_JSON`.
- [ ] **Google Maps:** new key, restricted to `homeup.sg` referrers; update both Maps vars.
- [ ] **Google Sheet:** transfer ownership of sheet `1Cpa…N0io` to the owners' Google account;
      re-share with the Batam admin team.
- [ ] **Sync kit:** rebuild the kit if any URL/key changed (`npm run build:sync-kit`), and
      **redistribute a fresh `.env.local`** to Batam admins via password manager (see
      `docs/listings-sync-kit-admin-handoff.md`). Old `.env.local` files become invalid once
      keys rotate.
- **Verify:** generate one room clip end-to-end (fal.ai + n8n + edge function), load a map,
  confirm GA realtime shows a hit, run one sync-kit import.

### Phase 5 — GitHub repo
- [ ] Transfer `joshluicz/homeup.sg` to the owners' org (Settings → Transfer ownership), **or**
      keep it Joshua's and add owners as admins — per the decision in prerequisites.
- [ ] Reconnect Vercel's Git integration to the new repo location.
- [ ] Move any **GitHub Actions secrets** and update branch protections.
- **Verify:** a test commit triggers a Vercel preview build.

### Phase 6 — Rotate & decommission
- [ ] **Rotate every secret Joshua held**: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`,
      `INTAKE_FORM_SECRET`, `CRON_SECRET`, and all third-party keys (done in Phase 4).
- [ ] Remove Joshua from: Supabase org, Vercel team, Cloudflare, GA/GSC, Anthropic, fal.ai,
      n8n, the Google Sheet, and the GitHub repo — **once the owners confirm everything works**.
- [ ] Delete stale `.env.local` copies; confirm no HomeUp secret remains in Joshua's password
      manager beyond an archived record.
- **Verify:** full smoke test (below) passes with Joshua's access already removed.

---

## 5. Final verification checklist

Run all of these post-cutover, ideally with Joshua's access already revoked:

- [ ] `https://homeup.sg` and `https://www.homeup.sg` load over valid HTTPS.
- [ ] Listings page renders live data; a listing detail page loads images (storage buckets).
- [ ] Rent-intake form submits and a row appears in `rental_intakes`.
- [ ] Admin login works; admin dashboards (GA/GSC metrics) render.
- [ ] Listings Sync (sync-kit Workflow A) imports and publishes.
- [ ] One `generate-room-clip` run completes (fal.ai + n8n path).
- [ ] Google Maps embed renders.
- [ ] GA4 realtime + GSC show data under the owners' accounts.
- [ ] A git push produces a successful Vercel deployment.

---

## 6. Suggested cutover order (one-line)

**Phase 0 backup → Phase 1 Supabase → verify → Phase 2 Vercel → verify → Phase 3 DNS/domain
→ verify → Phase 4 third-parties → verify → Phase 5 GitHub → Phase 6 rotate + decommission.**

Keep the old DNS zone and Joshua's access **live but idle** for ~1 week after cutover as a
safety net before final deletion.

---

## 7. Rollback summary

| Phase | How to undo |
|---|---|
| Supabase | Transfer project back to Joshua's org (keys/ref unchanged) |
| Vercel | Transfer project back; prior deployments retained in history |
| DNS | Revert nameservers at registrar to Joshua's Cloudflare (old zone kept ~1 week) |
| Domain registration | Registrar transfers are reversible within the grace window |
| Third-parties | Old keys still valid until explicitly revoked in Phase 6 — don't revoke early |

Because keys aren't revoked until Phase 6, every earlier phase is reversible.

---

## 8. Known entanglements & gotchas

1. **`propmeta-console` shares Joshua's Supabase org.** We transfer the **HomeUp project
   only**, never the org. Do not select org transfer.
2. **HomeUp code references a propmeta DB** (`PROPMETA_DB_*`, `PROPMETA_AUTH_SECRET`). Audit
   which scripts/routes read these; the public site likely doesn't need them, but confirm
   before revoking access so nothing admin-side breaks.
3. **Vercel account mismatch.** The Vercel account connected here (`joshluicz's projects`,
   team `team_H6ZrEA8iwG9PXXAEmioBpXII`) does **not** host homeup.sg — it only holds
   `theshadeslab-my`. Find the real hosting team before Phase 2.
4. **Sync kit `.env.local` redistribution.** Batam admins hold `.env.local` files with the
   service-role key. When you rotate keys (Phase 6), those files stop working — rebuild the
   kit and redistribute new `.env.local`s the same day, or listings sync breaks.
5. **`generate-room-clip` has `verify_jwt = false`** by design (n8n calls it server-to-server).
   Confirm this survives the transfer; if it flips to JWT-required, n8n calls will 401.
6. **`.sg` domain transfer** goes through SGNIC-accredited registrars and can take longer than
   a `.com`. Move DNS (nameservers) first for uptime; treat the registration transfer as a
   slower, separate track.
7. **GSC verification** rides on a DNS TXT record — don't drop it during the DNS reconcile in
   Phase 3, or Search Console access breaks.

---

*Track progress by ticking the checkboxes above. Update the "Currently owned by" column to
the owners as each asset moves.*
