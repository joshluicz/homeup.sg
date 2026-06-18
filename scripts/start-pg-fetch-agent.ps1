# Start the local agent (optional — only needed for browser-based PG fetch from Vercel admin).
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env.local")) {
  Write-Error ".env.local not found. Copy from team lead before running the agent."
  exit 1
}

Write-Host "Starting HomeUP Local Agent..."
Write-Host "For automated sync on this PC, use: npm run pg:automation"
npx tsx scripts/pg-fetch-agent/server.ts
