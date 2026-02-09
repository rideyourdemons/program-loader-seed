# RUN STRESS TEST - Execute chaos stress with watchdog
# Validates safety valves under maximum load

param(
    [switch]$WithWatchdog = $true,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  CHAOS STRESS TEST - Maximum Load Validation" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Paths
$stressScript = Join-Path $scriptDir "chaos-stress.mjs"
$watchdogScript = Join-Path $scriptDir "system-watchdog.ps1"
$backupScript = Join-Path $scriptDir "backup-pre-stress.ps1"
$nodeExe = "node"

# Check if stress script exists
if (-not (Test-Path $stressScript)) {
    Write-Host "[ERROR] Stress test script not found: $stressScript" -ForegroundColor Red
    exit 1
}

# Create backup first
if (-not $SkipBackup) {
    Write-Host "[BACKUP] Creating pre-stress backup..." -ForegroundColor Yellow
    try {
        & $backupScript
        Write-Host ""
    } catch {
        Write-Host "[WARN] Backup failed, continuing anyway: $_" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Start watchdog
$watchdogProcess = $null
if ($WithWatchdog) {
    Write-Host "[WATCHDOG] Starting System Watchdog..." -ForegroundColor Yellow
    
    try {
        $watchdogProcess = Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy", "Bypass",
            "-File", "`"$watchdogScript`""
        ) -PassThru -WindowStyle Normal
        
        Write-Host "   Watchdog PID: $($watchdogProcess.Id)" -ForegroundColor Gray
        Write-Host "   Monitoring: RAM, CPU Temp, Thermal Zones" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "⚠️  Could not start watchdog: $_" -ForegroundColor Yellow
    }
}

Write-Host ""

# Build stress test command
$stressArgs = @(
    "--expose-gc",
    "`"$stressScript`""
)

Write-Host "[STRESS] Starting Chaos Stress Test..." -ForegroundColor Red
Write-Host "   Script: $stressScript" -ForegroundColor Gray
Write-Host "   Target: 200,000 nodes" -ForegroundColor Gray
Write-Host "   Memory Leak: Enabled (tests 150MB hard kill)" -ForegroundColor Gray
Write-Host "   Complex Math: Every 10th node (CPU thermal stress)" -ForegroundColor Gray
Write-Host ""

try {
    # Create process with AboveNormal priority
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $nodeExe
    $processInfo.Arguments = $stressArgs -join " "
    $processInfo.WorkingDirectory = $projectRoot
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $false
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::AboveNormal
    
    # Output handlers
    $process.add_OutputDataReceived({
        param($sender, $e)
        if ($e.Data) {
            Write-Host $e.Data
        }
    })
    
    $process.add_ErrorDataReceived({
        param($sender, $e)
        if ($e.Data) {
            Write-Host $e.Data -ForegroundColor Red
        }
    })
    
    # Start process
    $process.Start() | Out-Null
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()
    
    Write-Host "   Stress Test PID: $($process.Id)" -ForegroundColor Gray
    Write-Host "   Priority: $($process.PriorityClass)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    
    # Wait for completion
    $process.WaitForExit()
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    
    if ($process.ExitCode -eq 0) {
        Write-Host "[SUCCESS] STRESS TEST COMPLETE" -ForegroundColor Green
    } else {
        Write-Host "[WARN] STRESS TEST EXITED: $($process.ExitCode)" -ForegroundColor Yellow
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    
    # Stop watchdog
    if ($watchdogProcess -and -not $watchdogProcess.HasExited) {
        Write-Host "[STOP] Stopping watchdog..." -ForegroundColor Yellow
        Stop-Process -Id $watchdogProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit $process.ExitCode
    
} catch {
    Write-Host "[ERROR] STRESS TEST FAILED: $_" -ForegroundColor Red
    Write-Host $_.Exception.StackTrace -ForegroundColor Red
    
    if ($watchdogProcess -and -not $watchdogProcess.HasExited) {
        Stop-Process -Id $watchdogProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}
