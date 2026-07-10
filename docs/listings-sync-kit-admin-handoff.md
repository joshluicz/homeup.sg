# Listings Sync Kit — Guide (Batam)

**For:** Batam admin team  
**Team lead:** Joshua Lui — sends `.env.local` via 1Password (never email or WhatsApp)

---

## Overview

PropertyGuru blocks HomeUP’s cloud server. The **sync kit** is a small app you run on **your laptop** so listing pages are fetched from a normal internet connection, then synced to **homeup.sg**.

**You need (once per PC):**

1. Node.js 20+ installed
2. The sync kit ZIP (download below)
3. `.env.local` from Joshua (not included in the ZIP)

**Every sync — pick one workflow:**

| | Workflow A — Admin UI | Workflow B — Full auto |
|---|----------------------|------------------------|
| **Best for** | First time, or when you want to review counts | Routine batch sync |
| **What you do** | Run `start-agent` → use Listings Sync in browser | Double-click `run-full-sync` |
| **Admin login** | Yes | No |

Imports **publish to the live site immediately** — there is no separate publish step.

**Download:** [homeup-listings-sync-kit.zip](https://homeup.sg/downloads/homeup-listings-sync-kit.zip)  
**This guide:** https://homeup.sg/admin/sync-kit-handoff (admin login required)

---

## Step-by-step — First time on a new PC

Do these steps **once** on each admin computer.

### 1. Install Node.js

1. Open https://nodejs.org and download **LTS** (version **20 or newer**)
2. Install with default options; restart if prompted
3. Check: open Terminal (Mac) or Command Prompt (Windows) and run `node -v` — you should see `v20.x.x` or higher

### 2. Download and unzip the kit

1. Sign in to https://homeup.sg/admin
2. Download the ZIP from the button at the top of this page (or from **Listings Sync**)
3. Unzip to a permanent folder (e.g. Desktop `homeup-listings-sync-kit`)
4. Do **not** run scripts from inside the ZIP — unzip first

### 3. Add credentials

1. Joshua sends **`.env.local`** via 1Password or similar
2. Copy it into the **unzipped kit folder** (same folder as `SETUP.html`)
3. Never email, WhatsApp, or upload this file

### 4. Run first-time setup

| OS | Action |
|----|--------|
| **Windows** | Double-click `first-time-setup.bat` |
| **Mac** | Right-click `first-time-setup.command` → **Open** → **Open** again (first time only) |

Wait 5–15 minutes until you see **Setup complete** and a `node_modules` folder appears.

### 5. (Mac / Windows only) If a script is blocked

- **Windows:** Only run `.bat` files from the unzipped kit folder
- **Mac:** Right-click `.command` → Open → Open again (once per script)

**Offline copy:** After unzipping, open `SETUP.html` in the kit folder for the same steps without internet.

---

## Step-by-step — Workflow A (Admin UI)

Use this when you want to **review** import/archive counts before syncing. **Recommended for your first sync.**

| Step | What to do |
|------|------------|
| **1** | Double-click `start-agent` (`.bat` or `.command`). **Keep the window open.** You should see `Listening on http://127.0.0.1:3921` |
| **2** | Open https://homeup.sg/admin → **Listings Sync** |
| **3** | Confirm the **green banner**: “Local agent is running”. If amber → go back to step 1 |
| **4** | Click **Refresh from Google Sheet** and wait for success |
| **5** | Review counts: **New → import and publish** / **Not on sheet → archive** |
| **6** | Click **Sync to HomeUP** and wait for “N imported and published” |
| **7** | Check https://homeup.sg/listings, then close the `start-agent` window |

---

## Step-by-step — Workflow B (Full auto)

Use this for a **routine full sync** without the admin UI. First-time setup (above) must already be done.

| Step | What to do |
|------|------------|
| **1** | Double-click `run-full-sync` (`.bat` or `.command`) |
| **2** | **Do not close** the window until you see **Done** (may take several minutes) |
| **3** | Open https://homeup.sg/listings to verify |

This runs: sheet refresh → archive removed listings → import new → auto-publish.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ERROR: Node.js is not installed` | Install Node 20+ from nodejs.org, restart PC, run `first-time-setup` again |
| `ERROR: Missing .env.local` | Ask Joshua for `.env.local` and copy into kit folder |
| `ERROR: Run first-time-setup` before start-agent | Run `first-time-setup` first |
| Amber banner: agent not running | Run `start-agent` and keep window open |
| `PropertyGuru blocked server fetch` | Agent not running — start `start-agent` and sync again |
| `npm install failed` | Check internet; run `first-time-setup` again |
| Windows Smart App Control blocked script | Only run scripts from the unzipped kit folder |
| Mac “cannot be opened” | Right-click `.command` → Open → Open again |
| Some URLs fail during sync | Note the URL and tell Joshua — may be a bad sheet row |

---

## Security

- Do **not** share `.env.local` outside the admin team
- Do **not** send `.env.local` via email, WhatsApp, or Google Drive
- Only download the kit from **homeup.sg/admin**

---

## For Joshua (team lead)

### Prepare `.env.local` for Batam

Copy from Vercel env vars or local `.env.local`. Required keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ixhikkbytusikgjiuvqa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase → Settings → API → anon public>
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Settings → API → service_role>
ANTHROPIC_API_KEY=<console.anthropic.com → API keys>
```

Send via **1Password** or **Bitwarden** — not plain email.

### Rebuild kit after code changes

```bash
npm run build:sync-kit
git add public/downloads/homeup-listings-sync-kit.zip
git commit && git push
```

### Admin accounts

Ensure Batam staff can sign in at https://homeup.sg/admin (required for Workflow A).

---

## Quick reference

| File (in ZIP) | When to use |
|---------------|-------------|
| `first-time-setup` | Once per PC, after unzip + `.env.local` |
| `start-agent` | Keep open during Workflow A |
| `run-full-sync` | Workflow B |
| `SETUP.html` | Offline copy of these instructions |

| URL | Purpose |
|-----|---------|
| https://homeup.sg/admin/listings/pg-sources | Listings Sync (Workflow A) |
| https://homeup.sg/admin/sync-kit-handoff | This guide |
| https://homeup.sg/listings | Verify live listings |
| [Listings Google Sheet](https://docs.google.com/spreadsheets/d/1CpaVMBfq6fJRb2ymeeBOfLYYeyfJ2hB8QzdlxdZN0io/edit) | Source of truth |
