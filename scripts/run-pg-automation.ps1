# Run full sheet + sync automation (for Task Scheduler or manual use).
# Logs append to logs/pg-automation.log
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env.local")) {
  Write-Error ".env.local not found in project root."
  exit 1
}

$logDir = Join-Path (Get-Location) "logs"
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

$logFile = Join-Path $logDir "pg-automation.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "`n========== $stamp =========="

npm run pg:automation 2>&1 | Tee-Object -FilePath $logFile -Append
exit $LASTEXITCODE
