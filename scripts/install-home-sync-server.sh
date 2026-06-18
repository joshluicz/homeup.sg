#!/usr/bin/env bash
# Install HomeUP listings sync on a always-on Linux box (Raspberry Pi, NUC, NAS, etc.)
# Usage: bash scripts/install-home-sync-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Create .env.local first (Supabase + ANTHROPIC_API_KEY)."
  exit 1
fi

echo "Installing dependencies…"
npm install

CRON_SCHEDULE="${PG_CRON_SCHEDULE:-0 7,19 * * *}"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

CRON_LINE="$CRON_SCHEDULE cd $ROOT && /usr/bin/npm run pg:automation >> $LOG_DIR/pg-automation.log 2>&1"

if crontab -l 2>/dev/null | grep -q "pg:automation"; then
  echo "Cron entry already exists."
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Added cron: $CRON_SCHEDULE (7am & 7pm daily by default)"
  echo "Override with PG_CRON_SCHEDULE='0 */6 * * *' bash scripts/install-home-sync-server.sh"
fi

echo ""
echo "Test run:"
echo "  npm run pg:automation -- --dry-run"
echo ""
echo "Logs: $LOG_DIR/pg-automation.log"
