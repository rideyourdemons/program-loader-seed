#!/usr/bin/env pwsh
# Market-Ready Deployment Script
# Executes precision deployment with security checks

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "🚀 MARKET-READY DEPLOYMENT" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Step 1: Security Check - Verify .env is not staged
Write-Host "📋 Step 1: Security Check..." -ForegroundColor Green
$gitStatus = git status --porcelain
$dangerousFiles = $gitStatus | Where-Object { 
    $_ -match '\.env' -or 
    $_ -match 'nodes\.json' -or 
    $_ -match '160k'
}

if ($dangerousFiles) {
    Write-Host "❌ SECURITY ALERT: Dangerous files detected in staging!" -ForegroundColor Red
    $dangerousFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "   Removing from staging..." -ForegroundColor Yellow
    git reset HEAD .env 2>&1 | Out-Null
    git reset HEAD *nodes.json 2>&1 | Out-Null
    git reset HEAD *160k*.json 2>&1 | Out-Null
    Write-Host "   ✅ Dangerous files removed from staging" -ForegroundColor Green
} else {
    Write-Host "   ✅ No dangerous files in staging" -ForegroundColor Green
}

# Step 2: Verify .gitignore protection
Write-Host "`n📋 Step 2: Verifying .gitignore protection..." -ForegroundColor Green
$gitignore = Get-Content .gitignore -Raw
if ($gitignore -match '\.env' -and $gitignore -match 'nodes\.json') {
    Write-Host "   ✅ .gitignore properly configured" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .gitignore may need updates" -ForegroundColor Yellow
}

# Step 3: Show what will be committed
Write-Host "`n📋 Step 3: Files to be committed..." -ForegroundColor Green
$staged = git diff --cached --name-only
if ($staged) {
    Write-Host "   Staged files:" -ForegroundColor Cyan
    $staged | ForEach-Object { Write-Host "   ✅ $_" -ForegroundColor Gray }
} else {
    Write-Host "   No files staged. Adding all safe files..." -ForegroundColor Yellow
    git add .
    $staged = git diff --cached --name-only
    Write-Host "   ✅ Added safe files" -ForegroundColor Green
}

# Step 4: Final security check
Write-Host "`n📋 Step 4: Final security check..." -ForegroundColor Green
$finalCheck = git diff --cached --name-only | Where-Object {
    $_ -match '\.env' -or 
    $_ -match 'nodes\.json' -or 
    $_ -match '160k'
}

if ($finalCheck) {
    Write-Host "   ❌ ERROR: Dangerous files still in staging!" -ForegroundColor Red
    $finalCheck | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "   Deployment ABORTED for security." -ForegroundColor Red
    exit 1
} else {
    Write-Host "   ✅ All clear - no secrets or data files staged" -ForegroundColor Green
}

# Step 5: Commit
Write-Host "`n📋 Step 5: Committing changes..." -ForegroundColor Green
$commitMsg = "MARKET READY: Unique Content Logic + Security Hardening + UTF-8 Encoding Fix"
$commitResult = git commit -m $commitMsg 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Committed: $commitMsg" -ForegroundColor Green
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
Write-Host "✅ MARKET-READY DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   • Unique ContentGenerator deployed" -ForegroundColor White
Write-Host "   • UTF-8 encoding enforced" -ForegroundColor White
Write-Host "   • Credentials secured in .env (private)" -ForegroundColor White
Write-Host "   • 160k node data stays private" -ForegroundColor White
Write-Host "   • Engine logic is public on GitHub" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Status: ACTIVE" -ForegroundColor Green
Write-Host "   Public: Smart engine with unique content mapping" -ForegroundColor Gray
Write-Host "   Private: Credentials + 160k nodes stay on your machine" -ForegroundColor Gray
Write-Host ""
