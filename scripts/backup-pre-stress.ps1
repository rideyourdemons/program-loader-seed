# BACKUP PRE-STRESS - Create ZIP backup before stress test
# Creates 'BACKUP_PRE_STRESS.zip' of entire project directory

param(
    [string]$ProjectPath = $PSScriptRoot + "\..",
    [string]$BackupName = "BACKUP_PRE_STRESS.zip"
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRE-STRESS BACKUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Resolve-Path $ProjectPath
$backupPath = Join-Path $projectRoot $BackupName

Write-Host "[BACKUP] Creating backup..." -ForegroundColor Yellow
Write-Host "   Source: $projectRoot" -ForegroundColor Gray
Write-Host "   Target: $backupPath" -ForegroundColor Gray
Write-Host ""

# Remove existing backup if present
if (Test-Path $backupPath) {
    Write-Host "[WARN] Removing existing backup..." -ForegroundColor Yellow
    Remove-Item $backupPath -Force
}

try {
    # Create ZIP using .NET compression (PowerShell 5.0+ compatible)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($projectRoot, $backupPath, [System.IO.Compression.CompressionLevel]::Optimal, $true)
    
    # Count files in backup
    $zip = [System.IO.Compression.ZipFile]::OpenRead($backupPath)
    $fileCount = $zip.Entries.Count
    $zip.Dispose()
    
    $backupSize = (Get-Item $backupPath).Length / 1MB
    
    Write-Host ""
    Write-Host "[SUCCESS] Backup created successfully!" -ForegroundColor Green
    Write-Host "   Files: $fileCount" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Gray
    Write-Host "   Location: $backupPath" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
    Write-Host "   Trying alternative method..." -ForegroundColor Yellow
    
    # Fallback: Use Compress-Archive (PowerShell 5.0+)
    try {
        $tempDir = Join-Path $env:TEMP "backup-temp-$(Get-Random)"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        $files = Get-ChildItem -Path $projectRoot -Recurse -File | Where-Object {
            $_.FullName -notmatch 'node_modules' -and
            $_.FullName -notmatch '\.git' -and
            $_.FullName -notmatch 'BACKUP_.*\.zip$' -and
            $_.FullName -notmatch '\.log$'
        }
        
        $fileCount = 0
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($projectRoot.Length + 1)
            $destPath = Join-Path $tempDir $relativePath
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $file.FullName $destPath -Force
            $fileCount++
            
            if ($fileCount % 100 -eq 0) {
                Write-Host "   Packed: $fileCount files..." -ForegroundColor Gray
            }
        }
        
        Compress-Archive -Path "$tempDir\*" -DestinationPath $backupPath -Force
        Remove-Item $tempDir -Recurse -Force
        
        $backupSize = (Get-Item $backupPath).Length / 1MB
        
        Write-Host ""
        Write-Host "[SUCCESS] Backup created successfully (fallback method)!" -ForegroundColor Green
        Write-Host "   Files: $fileCount" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Gray
        Write-Host "   Location: $backupPath" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "[ERROR] Fallback backup also failed: $_" -ForegroundColor Red
        exit 1
    }
}
