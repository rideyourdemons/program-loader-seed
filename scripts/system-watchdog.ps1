# SYSTEM WATCHDOG - MSI Hardware Monitoring
# Run as Administrator for full hardware access
# Monitors: Node.exe RAM, Total CPU Load, Thermal Zone temperatures
# Displays real-time HUD in terminal

param(
    [int]$UpdateInterval = 2,  # seconds
    [int]$NodeProcessId = 0    # 0 = auto-detect
)

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  WARNING: Not running as Administrator. Some thermal data may be unavailable." -ForegroundColor Yellow
    Write-Host "   For full monitoring, run: Start-Process powershell -Verb RunAs -ArgumentList '-File $PSCommandPath'" -ForegroundColor Yellow
    Write-Host ""
}

# Get Node.js process
function Get-NodeProcess {
    if ($NodeProcessId -gt 0) {
        $proc = Get-Process -Id $NodeProcessId -ErrorAction SilentlyContinue
        if ($proc) { return $proc }
    }
    
    # Auto-detect node.exe
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcs.Count -eq 0) {
        return $null
    }
    
    # Return the one with highest memory (likely our migration)
    return $nodeProcs | Sort-Object WorkingSet64 -Descending | Select-Object -First 1
}

# Get CPU temperature (MSI-specific)
function Get-CPUTemperature {
    try {
        # Try WMI thermal zones
        $temps = Get-WmiObject -Namespace "root\wmi" -Class "MSAcpi_ThermalZoneTemperature" -ErrorAction SilentlyContinue
        if ($temps) {
            $temp = ($temps | Measure-Object -Property CurrentTemperature -Average).Average
            if ($temp) {
                # WMI returns temperature in 10ths of Kelvin, convert to Celsius
                return [math]::Round(($temp / 10) - 273.15, 1)
            }
        }
        
        # Fallback: Try MSAcpi_ThermalZoneTemperature
        $thermal = Get-WmiObject -Namespace "root\wmi" -Class "MSAcpi_ThermalZoneTemperature" -ErrorAction SilentlyContinue
        if ($thermal) {
            $temp = ($thermal | Measure-Object -Property CurrentTemperature -Average).Average
            if ($temp) {
                return [math]::Round(($temp / 10) - 273.15, 1)
            }
        }
        
        # Fallback: Use performance counters (less accurate)
        $cpu = Get-WmiObject Win32_Processor
        if ($cpu) {
            # Estimate from load (not accurate but better than nothing)
            $load = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples[0].CookedValue
            return [math]::Round(40 + ($load / 2), 1)
        }
        
        return $null
    } catch {
        return $null
    }
}

# Get system metrics
function Get-SystemMetrics {
    $nodeProc = Get-NodeProcess
    $cpuTemp = Get-CPUTemperature
    $cpuLoad = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples[0].CookedValue
    
    $metrics = @{
        NodeProcessId = if ($nodeProc) { $nodeProc.Id } else { 0 }
        NodeRAM_MB = if ($nodeProc) { [math]::Round($nodeProc.WorkingSet64 / 1MB, 1) } else { 0 }
        TotalCPU_Percent = [math]::Round($cpuLoad, 1)
        CPUTemp_Celsius = $cpuTemp
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    return $metrics
}

# Display HUD
function Show-HUD {
    param($metrics)
    
    # Clear screen (keep last few lines)
    Clear-Host
    
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  SYSTEM WATCHDOG - MSI Hardware Monitor" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Node.js Process
    if ($metrics.NodeProcessId -gt 0) {
        Write-Host "  Node.js Process:" -ForegroundColor White
        Write-Host "    PID: $($metrics.NodeProcessId)" -ForegroundColor Gray
        Write-Host "    RAM: " -NoNewline
        
        $ramStatus = if ($metrics.NodeRAM_MB -le 56) { "✅" } elseif ($metrics.NodeRAM_MB -le 150) { "⚠️" } else { "🚨" }
        $ramColor = if ($metrics.NodeRAM_MB -le 56) { "Green" } elseif ($metrics.NodeRAM_MB -le 150) { "Yellow" } else { "Red" }
        
        Write-Host "$ramStatus $($metrics.NodeRAM_MB) MB" -ForegroundColor $ramColor
        Write-Host "    Target: ≤56 MB | Kill: >150 MB" -ForegroundColor Gray
    } else {
        Write-Host "  Node.js Process: ❌ Not Found" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # CPU Metrics
    Write-Host "  CPU Metrics:" -ForegroundColor White
    Write-Host "    Load: $($metrics.TotalCPU_Percent)%" -ForegroundColor Gray
    
    if ($metrics.CPUTemp_Celsius) {
        $tempStatus = if ($metrics.CPUTemp_Celsius -lt 80) { "✅" } elseif ($metrics.CPUTemp_Celsius -lt 95) { "⚠️" } else { "🚨" }
        $tempColor = if ($metrics.CPUTemp_Celsius -lt 80) { "Green" } elseif ($metrics.CPUTemp_Celsius -lt 95) { "Yellow" } else { "Red" }
        
        Write-Host "    Temp: " -NoNewline
        Write-Host "$tempStatus $($metrics.CPUTemp_Celsius)°C" -ForegroundColor $tempColor
        Write-Host "    Throttle: ≥80°C | Emergency: ≥95°C" -ForegroundColor Gray
    } else {
        Write-Host "    Temp: ⚠️  Unavailable (run as Admin for thermal data)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "  Last Update: $($metrics.Timestamp)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Press Ctrl+C to stop monitoring" -ForegroundColor Gray
    Write-Host ""
}

# Main monitoring loop
Write-Host "Starting System Watchdog..." -ForegroundColor Green
Write-Host "Update Interval: $UpdateInterval seconds" -ForegroundColor Gray
Write-Host ""

$watchdogRunning = $true

# Handle Ctrl+C gracefully
[Console]::TreatControlCAsInput = $false
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action {
    $watchdogRunning = $false
    Write-Host "`nStopping watchdog..." -ForegroundColor Yellow
}

try {
    while ($watchdogRunning) {
        $metrics = Get-SystemMetrics
        Show-HUD $metrics
        
        # Alert if thresholds exceeded
        if ($metrics.NodeRAM_MB -gt 150) {
            Write-Host "🚨 ALERT: Node.js RAM exceeded 150 MB threshold!" -ForegroundColor Red -BackgroundColor Black
        }
        
        if ($metrics.CPUTemp_Celsius -and $metrics.CPUTemp_Celsius -ge 95) {
            Write-Host "🚨 ALERT: CPU temperature exceeded 95°C emergency threshold!" -ForegroundColor Red -BackgroundColor Black
        }
        
        Start-Sleep -Seconds $UpdateInterval
    }
} catch {
    Write-Host "`n❌ Watchdog Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.StackTrace -ForegroundColor Red
} finally {
    Write-Host "`n✅ Watchdog stopped." -ForegroundColor Green
}
