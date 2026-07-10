# Listings Sync Kit — Admin Team Handoff (Batam)

**Last updated:** July 2026  
**For:** Batam admin team  
**Team lead:** Joshua Lui — supplies `.env.local` separately (never in the ZIP or this doc’s live keys section)

---

## Is it live?

| Item | Status |
|------|--------|
| Live on homeup.sg | **Yes** — merged July 2026 |
| Download ZIP | https://homeup.sg/downloads/homeup-listings-sync-kit.zip |
| Setup page | https://homeup.sg/admin/listings/sync-kit |
| Full handoff (admin login) | https://homeup.sg/admin/sync-kit-handoff |

---

## What the kit does

PropertyGuru blocks HomeUP’s cloud server. The sync kit runs on **your laptop** so listing pages are fetched from a normal internet connection, then synced to **homeup.sg**.

Two ways to sync:

| Workflow | When to use | What you do |
|----------|-------------|-------------|
| **A — Admin UI** | You want to review counts before syncing | Run `start-agent` → open Listings Sync in browser → Refresh → Sync |
| **B — Full auto** | One-click batch sync | Run `run-full-sync` → wait for Done |

Imports **publish to the live site immediately** (no separate publish step).

---

## One-time setup (every admin PC)

### Step 1 — Install Node.js

1. Open https://nodejs.org
2. Download **LTS** (must be **version 20 or newer**)
3. Install with default options
4. Restart the computer if the installer asks you to

**Check it worked:** open Terminal (Mac) or Command Prompt (Windows) and run:

```
node -v
```

You should see `v20.x.x` or higher.

### Step 2 — Download the sync kit

**After the site is deployed:**

1. Sign in to https://homeup.sg/admin
2. Go to **Listings Sync** → **Setup instructions**  
   Or open https://homeup.sg/admin/listings/sync-kit  
   (Full guide after admin login: https://homeup.sg/admin/sync-kit-handoff)
3. Click **Download sync kit (ZIP)**
4. Save the file (e.g. Downloads)

### Step 3 — Unzip

1. Unzip to a permanent folder, e.g.:
   - Windows: `C:\Users\You\Desktop\homeup-listings-sync-kit`
   - Mac: `~/Desktop/homeup-listings-sync-kit`
2. Do **not** run scripts from inside the ZIP — unzip first

### Step 4 — Add credentials (team lead sends this)

1. Your team lead will send a file named **`.env.local`** via a secure channel (1Password, encrypted message, etc.)
2. Copy that file into the **unzipped kit folder** (same folder as `SETUP.html`)
3. **Never** email this file, put it in WhatsApp, or commit it to git

If you only have `.env.local.example`, ask Joshua for the real file — the kit will not work without it.

### Step 5 — First-time setup (once per PC)

**Windows:** double-click `first-time-setup.bat`  
**Mac:** right-click `first-time-setup.command` → **Open** → **Open** again (first time only)

Wait until you see **Setup complete**. This can take 5–15 minutes (downloads npm packages and Chrome for Patchright).

**Success looks like:**

- Message: “Setup complete”
- A `node_modules` folder appears in the kit directory
- No red ERROR lines at the end

---

## Workflow A — Admin UI (recommended for first time)

Use this when you want to see how many listings will import before syncing.

### 1. Start the local agent

**Windows:** double-click `start-agent.bat`  
**Mac:** double-click `start-agent.command` (or right-click → Open first time)

- A terminal window opens
- **Leave this window open** the whole time you sync
- You should see: `Listening on http://127.0.0.1:3921`

### 2. Open the admin Listings Sync page

1. Open Chrome or Edge
2. Go to https://homeup.sg/admin and **sign in**
3. Open **Listings Sync** (or https://homeup.sg/admin/listings/pg-sources)

### 3. Confirm the agent is connected

- You should see a **green banner**: “Local agent is running”
- If you see **amber** “Imports need the local agent” → go back to step 1

### 4. Refresh from Google Sheet

1. Click **Refresh from Google Sheet**
2. Wait for the success message
3. Check the counts (sale + rent, skipped sold/delisted)

### 5. Review changes

- **New → import and publish:** listings that will be added
- **Not on sheet → archive:** listings that will be removed from the site

### 6. Sync

1. Click **Sync to HomeUP**
2. Wait for “Importing X of Y…” to finish
3. Success message: “N imported and published”

### 7. Verify

Open https://homeup.sg/listings and spot-check new listings.

### 8. Stop the agent

When finished, close the `start-agent` terminal window.

---

## Workflow B — Full auto sync

Use this for a routine full sync without clicking through the admin UI.

1. Make sure **first-time setup** was done on this PC
2. **Windows:** double-click `run-full-sync.bat`  
   **Mac:** double-click `run-full-sync.command`
3. **Do not close** the window until you see **Done**
4. Open https://homeup.sg/listings to verify

This runs: sheet refresh → archive removed listings → import new → auto-publish.

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| `ERROR: Node.js is not installed` | Install Node 20+ from nodejs.org, restart PC, run first-time-setup again |
| `ERROR: Missing .env.local` | Ask Joshua for `.env.local` and copy it into the kit folder |
| `ERROR: Run first-time-setup` before start-agent | Run `first-time-setup` first |
| Amber banner: agent not running | Run `start-agent` and keep window open |
| `PropertyGuru blocked server fetch` | Agent not running — start `start-agent` and sync again |
| `npm install failed` | Check internet; run first-time-setup again |
| Windows Smart App Control blocked script | Only run `.bat` files from the unzipped kit folder |
| Mac “cannot be opened” | Right-click `.command` → Open → Open again |
| Sync shows failures for some URLs | Note the URL in the error list; tell Joshua — may be bad sheet row or PG page issue |

---

## Security rules

- Do **not** share `.env.local` with anyone outside the admin team
- Do **not** upload `.env.local` to Google Drive, WhatsApp, or email
- Do **not** commit `.env.local` to GitHub
- Only download the kit from **homeup.sg/admin** (official site)

---

## Offline guide in the ZIP

After unzipping, open **`SETUP.html`** in Chrome, Edge, or Safari for the same instructions (works without internet after download).

---

## For Joshua (team lead) — before Batam can start

### 1. Deploy to production

Deployed July 2026. Verify if needed:

1. https://homeup.sg/downloads/homeup-listings-sync-kit.zip returns **200**
2. https://homeup.sg/admin/listings/sync-kit loads after admin login
3. https://homeup.sg/admin/sync-kit-handoff shows the full handoff guide

### 2. Prepare `.env.local` for each admin PC

Copy from your production env (Vercel → Project → Settings → Environment Variables) or your local `.env.local`.

Required keys for the sync kit:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ixhikkbytusikgjiuvqa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Dashboard → Settings → API → anon public>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API → service_role secret>
ANTHROPIC_API_KEY=<from console.anthropic.com → API keys>
```

Send the completed file to Batam via **1Password**, **Bitwarden send**, or similar — **not** plain email.

### 3. Optional: rebuild kit after future code changes

```bash
npm run build:sync-kit
git add public/downloads/homeup-listings-sync-kit.zip
git commit && git push
```

### 4. Admin accounts

Ensure Batam staff have **admin login** to https://homeup.sg/admin (Workflow A).

---

## Quick reference

| File (in ZIP) | Purpose |
|---------------|---------|
| `SETUP.html` | Full instructions in browser |
| `README.txt` | Plain-text instructions |
| `.env.local` | **From team lead** — not in ZIP |
| `first-time-setup.bat` / `.command` | Run once after unzip |
| `start-agent.bat` / `.command` | Keep open for Workflow A |
| `run-full-sync.bat` / `.command` | Workflow B full sync |

| URL | Purpose |
|-----|---------|
| https://homeup.sg/admin/listings/pg-sources | Listings Sync (Workflow A) |
| https://homeup.sg/admin/listings/sync-kit | Download + setup guide |
| https://homeup.sg/admin/sync-kit-handoff | Full handoff guide (admin login) |
| https://homeup.sg/listings | Public site to verify |
| https://docs.google.com/spreadsheets/d/1CpaVMBfq6fJRb2ymeeBOfLYYeyfJ2hB8QzdlxdZN0io/edit | Listings Google Sheet |
