# Start the local PG fetch agent (Chrome opens on THIS computer).
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env.local")) {
  Write-Error ".env.local not found. Copy from team lead before running the agent."
  exit 1
}

Write-Host "Starting HomeUP PG Fetch Agent..."
Write-Host "Leave this window open. Then use Fetch on https://homeup-sg.vercel.app/admin"
npx tsx scripts/pg-fetch-agent/server.ts
