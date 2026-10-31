# Stop MSME POS Platform Local Services (Windows PowerShell)

Write-Host "Stopping MSME POS Platform Services..." -ForegroundColor Yellow

# Stop Node processes (Next.js and NestJS)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*nodejs*"
} | ForEach-Object {
    Write-Host "Stopping Node process ($($_.Id))..."
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Stop PostgreSQL
$PostgresBin = "C:\Users\Ramanuj Dey Sarkar\scoop\apps\postgresql\18.6-5\bin"
$RootDir = Split-Path -Parent $PSScriptRoot
$DataDir = Join-Path $RootDir ".postgres-data"

if (Test-Path "$PostgresBin\pg_ctl.exe") {
    Write-Host "Stopping PostgreSQL..."
    & "$PostgresBin\pg_ctl.exe" -D "$DataDir" stop -m fast
}

Write-Host "All local services stopped." -ForegroundColor Green

