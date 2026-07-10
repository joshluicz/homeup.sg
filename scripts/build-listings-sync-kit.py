# Rebuild: python3 scripts/build-listings-sync-kit.py
from __future__ import annotations

import json
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
BUILD_DIR = ROOT / "tmp-listings-sync-kit"
ZIP_PATH = ROOT / "public" / "downloads" / "homeup-listings-sync-kit.zip"

COPY_PATHS = [
    "lib/listings",
    "lib/data/agents.ts",
    "lib/scripts/load-env.ts",
    "lib/seo/constants.ts",
    "scripts/pg-fetch-agent/server.ts",
    "scripts/run-pg-automation.ts",
    "scripts/run-pg-sheet-sync.ts",
]

KIT_PACKAGE_JSON = {
    "name": "homeup-listings-sync-kit",
    "version": "1.0.0",
    "private": True,
    "scripts": {
        "pg:install": "patchright install chrome",
        "pg:agent": "npx tsx scripts/pg-fetch-agent/server.ts",
        "pg:automation": "npx tsx scripts/run-pg-automation.ts",
        "pg:sheet": "npx tsx scripts/run-pg-sheet-sync.ts",
    },
    "dependencies": {
        "@anthropic-ai/sdk": "^0.104.1",
        "@supabase/supabase-js": "^2.107.0",
        "patchright": "^1.60.2",
    },
    "devDependencies": {
        "tsx": "^4.19.0",
        "typescript": "^5.7.0",
    },
}

KIT_TSCONFIG = {
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": True,
        "esModuleInterop": True,
        "skipLibCheck": True,
        "noEmit": True,
        "paths": {"@/*": ["./*"]},
    },
    "include": ["**/*.ts"],
}

ENV_EXAMPLE = """# Copy this file to .env.local and ask your team lead for the real values.
# Never commit or share .env.local.

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
"""

KIT_SUPABASE_CLIENT = """import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }
  return createSupabaseClient(url, key);
}
"""

FIRST_TIME_SETUP_BAT = r"""@echo off
cd /d "%~dp0"
echo.
echo  HomeUP Listings Sync Kit — first-time setup
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js is not installed.
  echo  Install Node 20 or newer from https://nodejs.org then run this again.
  pause
  exit /b 1
)

for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 20 (
  echo  ERROR: Node 20 or newer is required. You have:
  node -v
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo  ERROR: Missing .env.local
  echo  Ask your team lead for the .env.local file and copy it into this folder.
  echo  You can start from .env.local.example — do not commit real keys.
  pause
  exit /b 1
)

echo  Installing packages...
call npm install
if errorlevel 1 (
  echo  npm install failed.
  pause
  exit /b 1
)

echo.
echo  Installing Patchright Chrome (one-time, may take a few minutes)...
call npm run pg:install
if errorlevel 1 (
  echo  pg:install failed.
  pause
  exit /b 1
)

echo.
echo  Setup complete. Next steps:
echo    - Workflow A: double-click start-agent.bat, then use homeup.sg/admin Listings Sync
echo    - Workflow B: double-click run-full-sync.bat for a full automated sync
echo.
pause
"""

START_AGENT_BAT = r"""@echo off
cd /d "%~dp0"
if not exist ".env.local" (
  echo  ERROR: Missing .env.local — run first-time-setup.bat first.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo  ERROR: Run first-time-setup.bat before starting the agent.
  pause
  exit /b 1
)
echo.
echo  Starting HomeUP local agent...
echo  Keep this window open while syncing on https://homeup.sg/admin/listings/pg-sources
echo.
call npm run pg:agent
pause
"""

RUN_FULL_SYNC_BAT = r"""@echo off
cd /d "%~dp0"
if not exist ".env.local" (
  echo  ERROR: Missing .env.local — run first-time-setup.bat first.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo  ERROR: Run first-time-setup.bat before running a full sync.
  pause
  exit /b 1
)
echo.
echo  Running full listings sync (sheet refresh, archive, import, auto-publish)...
echo  This may take several minutes. Do not close this window.
echo.
call npm run pg:automation
echo.
echo  Done. Check https://homeup.sg/listings to verify.
pause
"""

FIRST_TIME_SETUP_COMMAND = """#!/bin/bash
set -e
cd "$(dirname "$0")"

echo ""
echo " HomeUP Listings Sync Kit — first-time setup"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo " ERROR: Node.js is not installed."
  echo " Install Node 20 or newer from https://nodejs.org then run this again."
  read -r -p "Press Enter to close..."
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo " ERROR: Node 20 or newer is required. You have: $(node -v)"
  read -r -p "Press Enter to close..."
  exit 1
fi

if [ ! -f ".env.local" ]; then
  echo " ERROR: Missing .env.local"
  echo " Ask your team lead for the .env.local file and copy it into this folder."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo " Installing packages..."
npm install

echo ""
echo " Installing Patchright Chrome (one-time, may take a few minutes)..."
npm run pg:install

echo ""
echo " Setup complete. Next steps:"
echo "   - Workflow A: double-click start-agent.command, then use homeup.sg/admin Listings Sync"
echo "   - Workflow B: double-click run-full-sync.command for a full automated sync"
echo ""
read -r -p "Press Enter to close..."
"""

START_AGENT_COMMAND = """#!/bin/bash
cd "$(dirname "$0")"
if [ ! -f ".env.local" ]; then
  echo " ERROR: Missing .env.local — run first-time-setup.command first."
  read -r -p "Press Enter to close..."
  exit 1
fi
if [ ! -d "node_modules" ]; then
  echo " ERROR: Run first-time-setup.command before starting the agent."
  read -r -p "Press Enter to close..."
  exit 1
fi
echo ""
echo " Starting HomeUP local agent..."
echo " Keep this window open while syncing on https://homeup.sg/admin/listings/pg-sources"
echo ""
npm run pg:agent
"""

RUN_FULL_SYNC_COMMAND = """#!/bin/bash
set -e
cd "$(dirname "$0")"
if [ ! -f ".env.local" ]; then
  echo " ERROR: Missing .env.local — run first-time-setup.command first."
  read -r -p "Press Enter to close..."
  exit 1
fi
if [ ! -d "node_modules" ]; then
  echo " ERROR: Run first-time-setup.command before running a full sync."
  read -r -p "Press Enter to close..."
  exit 1
fi
echo ""
echo " Running full listings sync (sheet refresh, archive, import, auto-publish)..."
echo " This may take several minutes. Do not close this window."
echo ""
npm run pg:automation
echo ""
echo " Done. Check https://homeup.sg/listings to verify."
read -r -p "Press Enter to close..."
"""

README = """HomeUP Listings Sync Kit
========================

PropertyGuru blocks cloud servers. This kit runs on YOUR computer so listing pages
can be fetched from a normal internet connection, then synced to homeup.sg.

WHAT IS INSIDE
--------------
- index.html          Open this first (step-by-step guide; works offline)
- first-time-setup    Optional shortcut if .bat/.command are not blocked
- start-agent         Optional shortcut for Workflow A
- run-full-sync       Optional shortcut for Workflow B
- .env.local.example  Template only — ask team lead for the real .env.local

ONE-TIME SETUP
--------------
1. Install Node.js 20+ from https://nodejs.org
2. Unzip this folder (e.g. Desktop/homeup-listings-sync-kit)
3. Double-click index.html and follow the steps
4. Ask your team lead for .env.local and copy it into this folder
5. Run setup via first-time-setup OR manual commands in index.html (if antivirus blocks scripts)

WORKFLOW A — Admin UI (step-by-step control)
--------------------------------------------
1. Run start-agent and keep the window open
2. Open https://homeup.sg/admin and sign in
3. Go to Listings Sync (/admin/listings/pg-sources)
4. Click Refresh from Google Sheet
5. Review the preview counts
6. Click Sync to HomeUP — listings publish immediately

WORKFLOW B — Full auto sync (one click)
---------------------------------------
1. Run run-full-sync
2. Wait until the log says Done
3. Open https://homeup.sg/listings to verify

TROUBLESHOOTING
---------------
- "Missing .env.local" → ask team lead; never put keys in email or chat
- "PropertyGuru blocked" → start-agent must be running for Workflow A
- Agent offline on admin page → run start-agent before syncing
- Windows Smart App Control → open index.html only; use manual npm commands (see index.html)
- Mac "cannot be opened" → right-click the .command file → Open

SECURITY
--------
Do not share .env.local. It contains database and API keys.
"""

SETUP_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HomeUP Listings Sync Kit</title>
  <style>
    :root { --green: #008f52; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #111;
      background: linear-gradient(160deg, #e8faf0 0%, #f8fffb 50%, #dff5ea 100%);
      line-height: 1.55;
    }
    .wrap { max-width: 720px; margin: 0 auto; padding: 32px 20px 48px; }
    .card {
      background: #fff;
      border-radius: 20px;
      border: 1px solid rgba(0,143,82,.15);
      box-shadow: 0 20px 60px rgba(0,105,58,.1);
      padding: 28px 28px 32px;
    }
    h1 { font-size: 1.75rem; margin: 0 0 8px; }
    h2 { font-size: 1.1rem; margin: 28px 0 10px; color: var(--green); }
    h3 { font-size: 1rem; margin: 20px 0 8px; }
    p, li { font-size: 0.95rem; color: #333; }
    ol, ul { padding-left: 1.25rem; }
    li { margin: 6px 0; }
    code, .file {
      font-family: ui-monospace, monospace;
      font-size: 0.85em;
      background: #f0f4f2;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 8px;
    }
    .note {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      font-size: 0.9rem;
    }
    .ok {
      background: #ecfdf5;
      border-color: #6ee7b7;
    }
    .warn { background: #fef2f2; border-color: #fca5a5; }
    .cmd {
      display: block;
      margin: 10px 0;
      padding: 12px 14px;
      border-radius: 10px;
      background: #0f172a;
      color: #e2e8f0;
      font-family: ui-monospace, monospace;
      font-size: 0.82rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .hero {
      margin: 16px 0 0;
      padding: 16px 18px;
      border-radius: 14px;
      background: #0f172a;
      color: #f8fafc;
      font-size: 0.95rem;
    }
    .hero strong { color: #6ee7b7; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <p class="badge">HomeUP Admin</p>
      <h1>Listings Sync Kit</h1>
      <p>
        Use this kit on your computer (Batam or anywhere) to sync PropertyGuru listings to
        <strong>homeup.sg</strong>. PropertyGuru blocks our cloud server — your PC fetches the pages instead.
      </p>

      <div class="hero">
        <strong>Start here:</strong> keep this page open while you work. If Windows antivirus or Smart App Control
        blocks <span class="file">.bat</span> files (same as the roadshow kit), <strong>do not run any script files</strong>
        — use the <strong>manual commands</strong> below instead.
      </div>

      <h2>Part 1 — One-time setup</h2>
      <ol>
        <li>Install <strong>Node.js 20 or newer</strong> from <a href="https://nodejs.org" target="_blank" rel="noopener">nodejs.org</a>.</li>
        <li>Unzip this folder. Keep everything together — do not move files out of the folder.</li>
        <li>Ask your team lead for <span class="file">.env.local</span> and copy it into this folder.
          <strong>Never</strong> share this file or commit it to git.</li>
        <li>
          <strong>Option A (if scripts work):</strong><br />
          Windows: double-click <span class="file">first-time-setup.bat</span><br />
          Mac: right-click <span class="file">first-time-setup.command</span> → <strong>Open</strong>
        </li>
        <li>
          <strong>Option B (antivirus blocked scripts — use this):</strong><br />
          Open <strong>Command Prompt</strong> (Windows) or <strong>Terminal</strong> (Mac) in this folder, then run:
          <code class="cmd">npm install
npm run pg:install</code>
        </li>
        <li>Wait until setup finishes (5–15 min). A <span class="file">node_modules</span> folder should appear.</li>
      </ol>

      <div class="note ok">
        <strong>Success looks like:</strong> the setup window ends with “Setup complete” and a
        <span class="file">node_modules</span> folder appears in this directory.
      </div>

      <h2>Part 2 — Workflow A (admin UI)</h2>
      <p>Use this when you want to review counts before syncing.</p>
      <ol>
        <li>
          <strong>Option A:</strong> double-click <span class="file">start-agent</span> (<span class="file">.bat</span> / <span class="file">.command</span>). <strong>Keep the window open.</strong><br />
          <strong>Option B (antivirus):</strong> in Command Prompt / Terminal in this folder:
          <code class="cmd">npm run pg:agent</code>
        </li>
        <li>You should see <span class="file">Listening on http://127.0.0.1:3921</span></li>
        <li>Open <a href="https://homeup.sg/admin/listings/pg-sources" target="_blank" rel="noopener">homeup.sg/admin → Listings Sync</a> and sign in.</li>
        <li>Green banner: <em>Local agent is running</em>. If amber → agent not running (step 1).</li>
        <li>Click <strong>Refresh from Google Sheet</strong> → review counts → <strong>Sync to HomeUP</strong>.</li>
      </ol>

      <h2>Part 3 — Workflow B (full auto sync)</h2>
      <p>One-click sync without the admin UI.</p>
      <ol>
        <li>
          <strong>Option A:</strong> double-click <span class="file">run-full-sync</span><br />
          <strong>Option B (antivirus):</strong>
          <code class="cmd">npm run pg:automation</code>
        </li>
        <li>Wait for <strong>Done</strong> (several minutes if many listings).</li>
        <li>Open <a href="https://homeup.sg/listings" target="_blank" rel="noopener">homeup.sg/listings</a> to verify.</li>
      </ol>

      <h2>Windows security (same as roadshow kit)</h2>
      <p>
        Open <span class="file">index.html</span> only — do not rely on script files if Smart App Control blocks them.
        Close any block dialog and use the manual commands above in Command Prompt opened in this folder.
      </p>
      <p>
        To open Command Prompt here: click the folder address bar, type <span class="file">cmd</span>, press Enter.
      </p>
      <h3>Mac</h3>
      <p>If macOS says a <span class="file">.command</span> file “cannot be opened”, right-click → <strong>Open</strong> → <strong>Open</strong> again, or use Terminal with the manual commands above.</p>

      <h2>Troubleshooting</h2>
      <ul>
        <li><strong>Missing .env.local</strong> — ask team lead; copy the file into this folder.</li>
        <li><strong>Imports need the local agent</strong> — run <span class="file">start-agent</span> before Workflow A.</li>
        <li><strong>PropertyGuru blocked</strong> — agent not running, or run Workflow B from this PC instead.</li>
        <li><strong>npm install failed</strong> — check internet; re-run setup commands.</li>
        <li><strong>Antivirus blocked .bat</strong> — open <span class="file">index.html</span> and use manual commands (Option B) in each section.</li>
      </ul>

      <div class="note warn">
        <strong>Credentials:</strong> The real <span class="file">.env.local</span> is never inside this ZIP.
        Your team lead sends it separately via a secure channel (e.g. 1Password).
      </div>
    </div>
  </div>
</body>
</html>
"""


def copy_tree_or_file(src_rel: str) -> None:
    src = ROOT / src_rel
    dst = BUILD_DIR / src_rel
    if not src.exists():
        raise FileNotFoundError(f"Missing required path: {src}")
    if src.is_dir():
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def write_executable(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")
    if path.suffix == ".command":
        path.chmod(0o755)


def main() -> None:
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True)
    ZIP_PATH.parent.mkdir(parents=True, exist_ok=True)

    for rel in COPY_PATHS:
        copy_tree_or_file(rel)

    (BUILD_DIR / "lib" / "supabase").mkdir(parents=True, exist_ok=True)
    (BUILD_DIR / "lib" / "supabase" / "client.ts").write_text(KIT_SUPABASE_CLIENT, encoding="utf-8")

    (BUILD_DIR / "package.json").write_text(
        json.dumps(KIT_PACKAGE_JSON, indent=2) + "\n",
        encoding="utf-8",
    )
    (BUILD_DIR / "tsconfig.json").write_text(
        json.dumps(KIT_TSCONFIG, indent=2) + "\n",
        encoding="utf-8",
    )
    (BUILD_DIR / ".env.local.example").write_text(ENV_EXAMPLE, encoding="utf-8")
    (BUILD_DIR / "README.txt").write_text(README, encoding="utf-8")
    (BUILD_DIR / "index.html").write_text(SETUP_HTML, encoding="utf-8")

    write_executable(BUILD_DIR / "first-time-setup.bat", FIRST_TIME_SETUP_BAT)
    write_executable(BUILD_DIR / "start-agent.bat", START_AGENT_BAT)
    write_executable(BUILD_DIR / "run-full-sync.bat", RUN_FULL_SYNC_BAT)
    write_executable(BUILD_DIR / "first-time-setup.command", FIRST_TIME_SETUP_COMMAND)
    write_executable(BUILD_DIR / "start-agent.command", START_AGENT_COMMAND)
    write_executable(BUILD_DIR / "run-full-sync.command", RUN_FULL_SYNC_COMMAND)

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()

    with ZipFile(ZIP_PATH, "w", compression=ZIP_DEFLATED) as zf:
        for path in sorted(BUILD_DIR.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(BUILD_DIR).as_posix())

    size = ZIP_PATH.stat().st_size
    print(f"Wrote {ZIP_PATH} ({size:,} bytes)")
    shutil.rmtree(BUILD_DIR)


if __name__ == "__main__":
    main()
