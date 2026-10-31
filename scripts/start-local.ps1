# Local POS Platform Development Startup Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$PostgresBin = "C:\Users\Ramanuj Dey Sarkar\scoop\apps\postgresql\18.6-5\bin"
$DataDir = Join-Path $RootDir ".postgres-data"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting MSME POS Platform Locally " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start PostgreSQL if not already running
$pgListening = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -InformationLevel Quiet
if (-not $pgListening) {
    Write-Host "[1/4] Starting PostgreSQL daemon..." -ForegroundColor Yellow
    Start-Process -FilePath "$PostgresBin\postgres.exe" -ArgumentList "-D", "`"$DataDir`"" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[1/4] PostgreSQL is already active on port 5432." -ForegroundColor Green
}

# 2. Run Database Migrations
Write-Host "[2/4] Verifying and applying migrations..." -ForegroundColor Yellow
Set-Location "$RootDir\apps\backend"
pnpm run migration:run
Set-Location $RootDir

# 3. Start Backend in background
Write-Host "[3/4] Launching Backend API on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@pos/backend", "start" -WorkingDirectory $RootDir

# 4. Start Web Frontend in background
Write-Host "[4/4] Launching Web POS Frontend on port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@pos/web", "start" -WorkingDirectory $RootDir

Write-Host ""
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "Web POS UI:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API:    http://localhost:3001/api/v1" -ForegroundColor Cyan
Write-Host "Swagger Docs:   http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host "Health Check:   http://localhost:3001/api/v1/health" -ForegroundColor Cyan

