# Dedicated Chrome for PG fetch — real profile, no automation banner.
# 1. Run this script once
# 2. In that Chrome window, open propertyguru.com.sg and pass any captcha
# 3. Add to .env.local: PG_PLAYWRIGHT_CDP_URL=http://127.0.0.1:9222
# 4. npm run dev -> PG Sync -> Fetch all agents

$repoRoot = Split-Path $PSScriptRoot -Parent
$profileDir = Join-Path $repoRoot ".chrome-pg-manual"
New-Item -ItemType Directory -Path $profileDir -Force | Out-Null

$chromePaths = @(
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chrome = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) {
  Write-Error "Google Chrome not found."
  exit 1
}

Write-Host "Starting Chrome with remote debugging on port 9222..."
Write-Host "Profile: $profileDir"
Write-Host "After Chrome opens, visit https://www.propertyguru.com.sg and solve captcha if shown."
Write-Host "Then set PG_PLAYWRIGHT_CDP_URL=http://127.0.0.1:9222 in .env.local and run npm run dev."

Start-Process -FilePath $chrome -ArgumentList @(
  "--remote-debugging-port=9222",
  "--user-data-dir=$profileDir",
  "https://www.propertyguru.com.sg"
)
