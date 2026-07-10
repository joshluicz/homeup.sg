# HomeUP listings sync — home server (Raspberry Pi)

This document describes how to run **automated listings sync** on an always-on device at home (Raspberry Pi, mini PC, NAS, etc.) so the team does not need a laptop open every day.

**For AI agents:** When the user asks about Pi setup, cron, `pg:automation`, always-on sync, or running sync without a laptop — read this file first. Implementation lives in `scripts/run-pg-automation.ts`, `scripts/install-home-sync-server.sh`, and `lib/listings/google-sheet-listings.ts`.

---

## What problem this solves

HomeUP listings are maintained in a **Google Sheet** (source of truth) and synced to Supabase / the public site. The sync pipeline must **fetch PropertyGuru listing pages** to import data via Claude. PropertyGuru **blocks datacenter IPs** (Vercel, most cloud VPS), so imports fail from the cloud. A device on a **home/residential internet connection** can fetch PG reliably.

The admin UI on Vercel can refresh the sheet and archive listings, but **full import requires a home IP** (or the optional local agent for browser-based admin sync). Remote admins (e.g. Batam) should use the **Listings Sync Kit** — see `/admin/listings/sync-kit` or `scripts/build-listings-sync-kit.py`.

---

## Architecture (current system)

```
Google Sheet (team maintains PG URLs, marks SOLD/DELISTED)
        │
        ▼
pg:automation  (runs on Pi / laptop at home)
        │
        ├─ 1. Refresh pg_listing_sources from sheet CSV
        ├─ 2. Purge soft-deleted listings older than 7 days
        ├─ 3. Archive listings no longer on sheet
        ├─ 4. Import new PG URLs (fetch HTML → Claude → Supabase)
        └─ 5. Auto-publish (status = active, no draft review step)
        │
        ▼
Supabase listings  →  public site (homeup.sg / Vercel)
```

### Google Sheet

| Item | Value |
|------|--------|
| Spreadsheet ID | `1CpaVMBfq6fJRb2ymeeBOfLYYeyfJ2hB8QzdlxdZN0io` |
| Tab gid | `550958788` |
| Constants in code | `lib/listings/google-sheet-constants.ts` |

**Active count (source of truth for sync):** rows with `Status = Listed` + PG ID + Agent column B filled + valid PG URL. The sheet currently reports **130** listed rows. This is **not** the same as legacy `COUNTA` formulas — use `Status`, not B1-style counts, for sync.

**Sheet rules (enforced in code):**

- **Required:** `Status`, `PrtyGuru ID`, `Propertygutu Link`, **`Agent` column B** (must be filled — not Months Since Listing)
- **Active:** `Status = Listed`
- **Skipped:** `Status = Sold` or `Status = Delisted`
- **Price source:** `Listed Price` is the source of truth for listing price. Sheet refresh updates matching HomeUP listings by `source_pg_listing_id`.
- **Wrong format:** agent name only in `Months Since Listing` → skipped as `agent_in_wrong_column` (move name to column B)
- **Rent vs sale:** detected from PG URL (`for-rent` vs `for-sale`), not Unit Status
- Sheet must stay **publicly readable** (CSV export) or sync will fail

**Legacy columns:** `Remarks` and `Unit Status` are no longer authoritative for active/sold/delisted decisions. Use `Status`.

### Key npm scripts

| Command | Purpose |
|---------|---------|
| `npm run pg:automation` | Full pipeline: sheet → archive → import → **auto-publish** |
| `npm run pg:automation -- --dry-run` | Preview counts only, no writes |
| `npm run pg:watch` | Loop automation every 6h (`PG_SYNC_INTERVAL_HOURS` to change) |
| `npm run pg:sheet` | Sheet refresh only |
| `npm run pg:sync` | Archive + import only (no sheet refresh; auto-publishes) |

### Important code paths

| File | Role |
|------|------|
| `scripts/run-pg-automation.ts` | Main automation entrypoint |
| `scripts/install-home-sync-server.sh` | Installs cron on Linux/Pi |
| `scripts/run-pg-automation.ps1` | Windows Task Scheduler wrapper + logging |
| `lib/listings/google-sheet-listings.ts` | Parse sheet CSV |
| `lib/listings/sync-sheet-sources.ts` | Write `pg_listing_sources` |
| `lib/listings/sync-pg-sources.ts` | Archive + import (slug suffix for multi-unit condos) |
| `lib/listings/purge-archived-listings.ts` | Hard-delete archives after 7 days |

---

## Why Raspberry Pi (not cloud VPS)

| | Home Pi / NUC | Cloud VPS |
|---|---------------|-----------|
| PG fetch | Usually works (residential IP) | Often `FETCH_BLOCKED` |
| Power | ~5W, 24/7 | N/A |
| Cost | One-time ~$50–80 | ~$5/mo + may not work |

**Alternatives that work the same way:** Intel NUC, old laptop, home NAS with Node/SSH, any always-on Linux box on home broadband.

**Do not rely on:** Vercel cron, GitHub Actions, or a datacenter VPS for the import step unless PG fetch has been tested from that IP.

---

## Hardware requirements

- Raspberry Pi 4 (2GB+) or Pi 5, or equivalent mini PC
- MicroSD 32GB+ or SSD (SSD preferred)
- Ethernet (recommended) or stable Wi‑Fi
- Raspberry Pi OS Lite 64-bit (or Ubuntu Server)

Software on the device:

- **Node.js 20+** (`node -v`)
- **git**
- Outbound HTTPS (Supabase, Google Sheets, PropertyGuru, Anthropic)

---

## One-time setup

### 1. Flash OS and connect

Install Raspberry Pi OS Lite, enable SSH, set hostname (e.g. `homeup-sync`), connect to network, `ssh pi@homeup-sync.local`.

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v   # should be v20+
```

### 3. Clone the repo

```bash
cd ~
git clone https://github.com/joshluicz/homeup.sg.git homeup
cd homeup
npm install
```

Use the actual remote URL / branch the team deploys from (`master`).

### 4. Create `.env.local`

Copy from a trusted machine (never commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://ixhikkbytusikgjiuvqa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
ANTHROPIC_API_KEY=<anthropic key>
```

Automation uses **service role** for Supabase writes. `ANTHROPIC_API_KEY` is required for PG import extraction.

### 5. Test manually

```bash
cd ~/homeup
npm run pg:automation -- --dry-run   # preview only
npm run pg:automation                # full run
```

Check `logs/pg-automation.log` after scheduled runs. Verify listings on the public site and admin (`/admin/listings`).

### 6. Install cron (twice daily default)

```bash
bash scripts/install-home-sync-server.sh
```

Default schedule: **7:00 and 19:00** server local time (`0 7,19 * * *`).

Custom schedule examples:

```bash
# Every 6 hours
PG_CRON_SCHEDULE='0 */6 * * *' bash scripts/install-home-sync-server.sh

# Once daily at 6am
PG_CRON_SCHEDULE='0 6 * * *' bash scripts/install-home-sync-server.sh
```

View cron:

```bash
crontab -l
```

---

## Batam / remote admin — Listings Sync Kit

For admins who do not run a Pi but need to sync from their laptop:

1. Download from **Admin → Listings Sync → Setup instructions** (`/admin/listings/sync-kit`)
2. Unzip, copy `.env.local` from team lead (never in the ZIP)
3. Run `first-time-setup` once (Windows `.bat`, Mac `.command`)
4. **Workflow A:** `start-agent` + use `/admin/listings/pg-sources` in the browser
5. **Workflow B:** `run-full-sync` for full `pg:automation` without the admin UI

Rebuild the ZIP after sync code changes:

```bash
python3 scripts/build-listings-sync-kit.py
```

Output: `public/downloads/homeup-listings-sync-kit.zip`

All PG sync imports (admin UI, `pg:sync`, `pg:automation`) **auto-publish** — there is no draft review step for sheet-driven imports.

---

## Windows alternative (desktop always on)

Use Task Scheduler to run:

```powershell
powershell -ExecutionPolicy Bypass -File C:\dev\homeup\scripts\run-pg-automation.ps1
```

Logs append to `logs\pg-automation.log`.

---

## Updating the Pi after code changes

On the Pi:

```bash
cd ~/homeup
git pull
npm install
npm run pg:automation -- --dry-run
```

No need to re-run `install-home-sync-server.sh` unless the cron schedule changes.

---

## Operations checklist

**Team maintains the Google Sheet:**

- Add new listings with PG URL + agent
- Remove rows or set `Remarks` to `SOLD` / `DELISTED` when off market
- Use `DELISTED, RELIST LATER` only when temporarily off PG but still tracked on sheet (not pushed to website)

**Pi does automatically:**

- Sync sheet → database
- Archive listings removed from sheet
- Import new listings and **publish live** (no draft step) — applies to Pi cron, sync kit, and admin Listings Sync page
- Delete archived rows after 7 days

**Manual admin still useful for:**

- Editing listing copy/images after import
- Debugging failed imports
- Vercel admin UI for one-off checks

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `FETCH_BLOCKED` on import | Running from cloud/datacenter IP | Must run on home network (Pi/laptop) |
| Sheet fetch failed | Sheet not public | Share sheet: anyone with link can view |
| `unknown_agent` in skip log | Agent name not in sheet | Use `Dennis`, `Kenji`, `Olivia`, `Edmund`, `Isaac`, `TongBoon` in `Agent` column |
| Import count wrong | Old slug-merge logic | Ensure latest `sync-pg-sources.ts` (unique slug per PG ID) |
| Cron not running | Wrong path or node not in PATH | Use full paths in crontab; check `logs/pg-automation.log` |
| 0 to import but sheet has rows | Rows marked SOLD/DELISTED or held | Check `Remarks` column |

**Diagnostics:**

```bash
npm run pg:diagnostic
npm run pg:automation -- --dry-run
tail -100 logs/pg-automation.log
```

---

## Security notes

- `.env.local` on the Pi holds **service role** and **Anthropic** keys — restrict SSH (key-only auth, no password), keep OS updated
- Do not expose the Pi to the public internet; it only needs outbound connections
- `logs/` is gitignored; may contain listing URLs

---

## Future agent tasks

When asked to implement or change home sync:

1. Prefer extending `scripts/run-pg-automation.ts` rather than new ad-hoc scripts
2. Sheet parsing changes → `lib/listings/google-sheet-listings.ts`
3. If adding flags (e.g. disable auto-publish), wire through automation only unless admin UI also needs it
4. Update **this document** when behavior or schedules change
5. Cloud-only solutions for PG **fetch** are unlikely to work without a residential proxy

---

## Related (legacy / optional)

- **Listings Sync Kit** — downloadable ZIP for Batam/remote admins; `scripts/build-listings-sync-kit.py` → `public/downloads/homeup-listings-sync-kit.zip`
- `npm run pg:agent` — local HTTP agent for PG fetch from **Vercel admin UI** in the browser; included in the sync kit as `start-agent`
- `npm run pg:fetch` — old Patchright PG crawl; **deprecated** in favor of Google Sheet
