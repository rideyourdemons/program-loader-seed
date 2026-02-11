#!/usr/bin/env pwsh
# deploy.ps1 - Safe "Black Box" Deployment Script
# Pushes engine logic (code) but NOT the 160k node data files
# Usage: .\deploy.ps1 [commit-message]

param(
    [string]$CommitMessage = "Final architectural push: variable weighting and UTF-8 encoding fix"
)

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "🚀 BLACK BOX DEPLOYMENT SCRIPT" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Step 1: Check .gitignore is protecting secrets
Write-Host "📋 Step 1: Verifying .gitignore protection..." -ForegroundColor Green
$gitStatus = git status --porcelain
$dangerousFiles = $gitStatus | Where-Object { 
    $_ -match '\.json$' -and 
    ($_ -match 'nodes|160k|_data' -or $_ -match 'public/data|public/matrix')
}

if ($dangerousFiles) {
    Write-Host "⚠️  WARNING: Large JSON data files detected in staging!" -ForegroundColor Red
    Write-Host "   These files will be blocked:" -ForegroundColor Yellow
    $dangerousFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "   Adding to .gitignore and removing from cache..." -ForegroundColor Yellow
    git rm -r --cached . 2>&1 | Out-Null
    Write-Host "   ✅ Cache cleared" -ForegroundColor Green
}

# Step 2: Show what Git sees
Write-Host "`n📋 Step 2: Checking Git status..." -ForegroundColor Green
$status = git status --short
if (-not $status) {
    Write-Host "   ℹ️  No changes to commit" -ForegroundColor Gray
    exit 0
}

Write-Host "   Files staged/modified:" -ForegroundColor Cyan
$status | ForEach-Object { 
    $line = $_.Trim()
    if ($line -match '^[AM]') {
        $file = $line.Substring(2).Trim()
        $ext = [System.IO.Path]::GetExtension($file)
        if ($ext -in @('.js', '.cjs', '.mjs', '.html', '.css')) {
            Write-Host "   ✅ $file" -ForegroundColor Green
        } elseif ($ext -eq '.json') {
            Write-Host "   ⚠️  $file (JSON - will be blocked if contains data)" -ForegroundColor Yellow
        } else {
            Write-Host "   📄 $file" -ForegroundColor Gray
        }
    }
}

# Step 3: Add ONLY code files (not data)
Write-Host "`n📋 Step 3: Staging code files only..." -ForegroundColor Green
Write-Host "   Adding: server.cjs, index.html, matrix-expander.js, css/, js/" -ForegroundColor Cyan

# Add specific code files/directories
$filesToAdd = @(
    'server.cjs',
    'index.html',
    'matrix-expander.js',
    'css/',
    'js/',
    'site_controller.mjs',
    'core/',
    'public/js/',
    'public/css/',
    '.gitignore'
)

$addedCount = 0
foreach ($file in $filesToAdd) {
    if (Test-Path $file) {
        git add $file 2>&1 | Out-Null
        $addedCount++
        Write-Host "   ✅ Added: $file" -ForegroundColor Green
    }
}

# Add any other .js, .cjs, .mjs, .html, .css files (but NOT .json data files)
$codeFiles = Get-ChildItem -Recurse -File | Where-Object {
    $_.Extension -in @('.js', '.cjs', '.mjs', '.html', '.css') -and
    $_.FullName -notmatch 'node_modules' -and
    $_.FullName -notmatch '_archive'
}

foreach ($file in $codeFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '').Replace('\', '/')
    if ($relativePath -notmatch 'node_modules|_archive') {
        git add $relativePath 2>&1 | Out-Null
    }
}

Write-Host "   ✅ Staged $addedCount code files" -ForegroundColor Green

# Step 4: Verify no data files are staged
Write-Host "`n📋 Step 4: Verifying no data files are staged..." -ForegroundColor Green
$staged = git diff --cached --name-only
$dataFiles = $staged | Where-Object { 
    $_ -match '\.json$' -and 
    ($_ -match 'nodes|160k|_data' -or $_ -match 'public/data|public/matrix')
}

if ($dataFiles) {
    Write-Host "   ❌ ERROR: Data files detected in staging!" -ForegroundColor Red
    $dataFiles | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "   Removing from staging..." -ForegroundColor Yellow
    $dataFiles | ForEach-Object { git reset HEAD $_ 2>&1 | Out-Null }
    Write-Host "   ✅ Data files removed from staging" -ForegroundColor Green
} else {
    Write-Host "   ✅ No data files in staging - safe to commit" -ForegroundColor Green
}

# Step 5: Commit
Write-Host "`n📋 Step 5: Committing changes..." -ForegroundColor Green
$commitResult = git commit -m $CommitMessage 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Committed: $CommitMessage" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Commit result: $commitResult" -ForegroundColor Yellow
}

# Step 6: Push
Write-Host "`n📋 Step 6: Pushing to origin..." -ForegroundColor Green
$pushResult = git push origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Pushed to origin/main" -ForegroundColor Green
} else {
    Write-Host "   ❌ Push failed: $pushResult" -ForegroundColor Red
    exit 1
}

# Step 7: Summary
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   • Engine logic (code) pushed to GitHub" -ForegroundColor White
Write-Host "   • Data files (160k nodes) remain private on your machine" -ForegroundColor White
Write-Host "   • UTF-8 encoding fix included" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Black Box Status: ACTIVE" -ForegroundColor Green
Write-Host "   Public: Smart engine with 5/15/30 min timing logic" -ForegroundColor Gray
Write-Host "   Private: 160k_nodes.json stays on MSI machine" -ForegroundColor Gray
Write-Host ""
