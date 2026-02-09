# CANARY TEST RUNNER
# Executes 1% canary test (1,640 nodes) with monitoring

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CANARY TEST - 1% Migration Validation (1,640 nodes)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

$migrationScript = Join-Path $scriptDir "shadow-migration.mjs"
$watchdogScript = Join-Path $scriptDir "system-watchdog.ps1"
$validationScript = Join-Path $scriptDir "validate-canary-results.mjs"

# Check if migration script exists
if (-not (Test-Path $migrationScript)) {
    Write-Host "[ERROR] Migration script not found: $migrationScript" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Canary Test Configuration:" -ForegroundColor Yellow
Write-Host "   Nodes: 1,640 (1% of 164,000)" -ForegroundColor Gray
Write-Host "   Mode: Dry Run (validation only)" -ForegroundColor Gray
Write-Host "   RAM Limit: 150 MB hard kill" -ForegroundColor Gray
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Start Canary Test? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Start watchdog
$watchdogProcess = $null
$startWatchdog = Read-Host "Start System Watchdog for monitoring? (Y/N)"
if ($startWatchdog -eq 'Y' -or $startWatchdog -eq 'y') {
    Write-Host "[WATCHDOG] Starting System Watchdog..." -ForegroundColor Yellow
    
    try {
        $watchdogProcess = Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy", "Bypass",
            "-File", "`"$watchdogScript`""
        ) -PassThru -WindowStyle Normal
        
        Write-Host "   Watchdog PID: $($watchdogProcess.Id)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "[WARN] Could not start watchdog: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RUNNING CANARY TEST" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Run canary test
try {
    Push-Location $projectRoot
    
    $process = Start-Process node -ArgumentList @(
        "--expose-gc",
        "`"$migrationScript`"",
        "--dry-run",
        "--limit=1640"
    ) -PassThru -NoNewWindow -Wait
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if ($process.ExitCode -eq 0) {
        Write-Host "[SUCCESS] Canary Test Complete" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Canary Test Exited: $($process.ExitCode)" -ForegroundColor Yellow
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Run validation
    Write-Host "[VALIDATION] Running result validation..." -ForegroundColor Yellow
    Write-Host ""
    
    $validationProcess = Start-Process node -ArgumentList @(
        "`"$validationScript`""
    ) -PassThru -NoNewWindow -Wait
    
    Write-Host ""
    
    if ($validationProcess.ExitCode -eq 0) {
        Write-Host "[SUCCESS] Validation Passed - Safe to proceed with full migration" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Validation Found Issues - Review results before full migration" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "[ERROR] Canary test failed: $_" -ForegroundColor Red
} finally {
    Pop-Location
    
    # Stop watchdog
    if ($watchdogProcess -and -not $watchdogProcess.HasExited) {
        Write-Host ""
        Write-Host "[STOP] Stopping watchdog..." -ForegroundColor Yellow
        Stop-Process -Id $watchdogProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Canary test complete. Review results above." -ForegroundColor Gray
Read-Host "Press Enter to close"
