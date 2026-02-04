# ryd-fix.ps1 - Fixed Syntax Version
Write-Host "Starting System Assessment..." -ForegroundColor Cyan

# 1. Check for Admin Rights
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if ($currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[OK] Running as Administrator." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Please run Cursor as Administrator!" -ForegroundColor Red
    return
}

# 2. Sample Assessment Logic
$cpuUsage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
if ($cpuUsage -gt 80) {
    Write-Host "[WARNING] High CPU Usage: $cpuUsage%" -ForegroundColor Yellow
} else {
    Write-Host "[OK] CPU Usage is normal: $cpuUsage%" -ForegroundColor Green
}

Write-Host "Assessment Complete." -ForegroundColor Cyan