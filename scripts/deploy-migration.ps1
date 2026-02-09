# DEPLOY MIGRATION - Single Command Execution
# Runs streaming migration with AboveNormal priority and system watchdog

param(
    [switch]$WithWatchdog = $true,
    [switch]$Resume = $false
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MIGRATION DEPLOYMENT - 164,000 Node Migration" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Paths
$migrationScript = Join-Path $scriptDir "streaming-migration.mjs"
$watchdogScript = Join-Path $scriptDir "system-watchdog.ps1"
$nodeExe = "node"

# Check if migration script exists
if (-not (Test-Path $migrationScript)) {
    Write-Host "❌ Migration script not found: $migrationScript" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = & $nodeExe --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start watchdog in separate window if requested
$watchdogProcess = $null
if ($WithWatchdog) {
    Write-Host "🔍 Starting System Watchdog..." -ForegroundColor Yellow
    
    try {
        # Start watchdog in new PowerShell window
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
        Write-Host "   Continuing without watchdog..." -ForegroundColor Yellow
    }
}

Write-Host ""

# Set process priority to AboveNormal
Write-Host "⚡ Setting process priority to AboveNormal..." -ForegroundColor Yellow

# Build migration command
$migrationArgs = @(
    "--expose-gc",
    "`"$migrationScript`""
)

if ($Resume) {
    Write-Host "   Resuming from last checkpoint..." -ForegroundColor Gray
}

Write-Host ""

# Start migration with AboveNormal priority
Write-Host "🚀 Starting Migration..." -ForegroundColor Green
Write-Host "   Script: $migrationScript" -ForegroundColor Gray
Write-Host "   Priority: AboveNormal" -ForegroundColor Gray
Write-Host "   RAM Target: ≤56 MB | Kill: >150 MB" -ForegroundColor Gray
Write-Host ""

try {
    # Create process with AboveNormal priority
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $nodeExe
    $processInfo.Arguments = $migrationArgs -join " "
    $processInfo.WorkingDirectory = $projectRoot
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $false
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    
    # Set priority before starting
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
    
    Write-Host "   Migration PID: $($process.Id)" -ForegroundColor Gray
    Write-Host "   Priority: $($process.PriorityClass)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Wait for completion
    $process.WaitForExit()
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ MIGRATION COMPLETE" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MIGRATION EXITED WITH CODE: $($process.ExitCode)" -ForegroundColor Yellow
        Write-Host "   Check migration-state.json for last successful node" -ForegroundColor Gray
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Stop watchdog
    if ($watchdogProcess -and -not $watchdogProcess.HasExited) {
        Write-Host "🛑 Stopping watchdog..." -ForegroundColor Yellow
        Stop-Process -Id $watchdogProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit $process.ExitCode
    
} catch {
    Write-Host "❌ DEPLOYMENT FAILED: $_" -ForegroundColor Red
    Write-Host $_.Exception.StackTrace -ForegroundColor Red
    
    # Stop watchdog on error
    if ($watchdogProcess -and -not $watchdogProcess.HasExited) {
        Stop-Process -Id $watchdogProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}
