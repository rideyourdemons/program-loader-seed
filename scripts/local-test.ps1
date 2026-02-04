param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Section([string]$Title) {
  Write-Host ""
  Write-Host ("=" * 80)
  Write-Host $Title
  Write-Host ("=" * 80)
}

function Test-Json([string]$Text) {
  try {
    $null = $Text | ConvertFrom-Json -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

function Get-RepoRoot {
  $dir = Split-Path -Parent $PSScriptRoot
  if ([string]::IsNullOrWhiteSpace($dir)) {
    return (Get-Location)
  }
  return $dir
}

function Get-ToolsCanonicalCount([string]$ToolsPath) {
  if (-not (Test-Path $ToolsPath)) { return 0 }
  $raw = Get-Content -LiteralPath $ToolsPath -Raw -Encoding UTF8
  if (-not (Test-Json $raw)) { return 0 }
  $data = $raw | ConvertFrom-Json
  if ($data -is [System.Array]) { return $data.Count }
  if ($null -ne $data.tools -and ($data.tools -is [System.Array])) { return $data.tools.Count }
  return 0
}

function Find-LoginStrings([object]$Tools) {
  $hits = New-Object System.Collections.Generic.List[string]
  if ($null -eq $Tools) { return $hits }

  $pattern = '(?i)\b(login|log\s*in|sign\s*in|sign\s*up|get\s*started)\b'
  foreach ($tool in $Tools) {
    $fields = @(
      (Get-PropValue $tool "title"),
      (Get-PropValue $tool "name"),
      (Get-PropValue $tool "description"),
      (Get-PropValue $tool "summary"),
      (Get-PropValue $tool "howWhyWorks"),
      (Get-PropValue $tool "metaDescription")
    )
    foreach ($f in $fields) {
      if ($null -ne $f -and ($f -is [string]) -and ($f -match $pattern)) {
        $hits.Add(((Get-PropValue $tool "title"), (Get-PropValue $tool "name"), $f) -join " | ")
        break
      }
    }
  }
  return $hits
}

function Get-PropValue([object]$Object, [string]$Name) {
  if ($null -eq $Object) { return $null }
  $prop = $Object.PSObject.Properties[$Name]
  if ($null -eq $prop) { return $null }
  return $prop.Value
}

function Start-DevServer([string]$RepoRoot, [string]$LogPath) {
  if (Test-Path $LogPath) { Remove-Item -LiteralPath $LogPath -Force }
  Set-Content -LiteralPath $LogPath -Value "" -Encoding UTF8
  $proc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev:legacy 2>&1" `
    -WorkingDirectory $RepoRoot `
    -RedirectStandardOutput $LogPath `
    -NoNewWindow `
    -PassThru
  return $proc
}

function Detect-HostingUrl([string]$LogPath, [int]$TimeoutSeconds) {
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  $url = $null
  while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    if (Test-Path $LogPath) {
      $content = Get-Content -LiteralPath $LogPath -Raw -ErrorAction SilentlyContinue
      if ($content) {
        $matches = [regex]::Matches($content, 'http://(localhost|127\.0\.0\.1):\d+')
        if ($matches.Count -gt 0) {
          $url = $matches[$matches.Count - 1].Value
          break
        }
      }
    }
    Start-Sleep -Seconds 1
  }
  return $url
}

Write-Section "RYD Local Test Runner"
$repoRoot = Get-RepoRoot
Write-Host ("Repo: " + $repoRoot)

$nodeModules = Join-Path $repoRoot "node_modules"
if (-not (Test-Path $nodeModules)) {
  Write-Host "node_modules not found. Running npm install..."
  & npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed."
    exit 2
  }
}

$logPath = Join-Path $env:TEMP ("ryd-local-test-hosting_{0}.log" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
Write-Host "Starting dev server: npm run dev:legacy"
$server = Start-DevServer -RepoRoot $repoRoot -LogPath $logPath

Start-Sleep -Seconds 2
if ($server.HasExited) {
  Write-Host "Server exited early. Check log: $logPath"
  exit 2
}

$hostingUrl = Detect-HostingUrl -LogPath $logPath -TimeoutSeconds 60
if (-not $hostingUrl) {
  Write-Host "Could not detect hosting URL. Check log: $logPath"
  exit 2
}

Write-Host ("Detected URL: " + $hostingUrl)

$logContent = Get-Content -LiteralPath $logPath -Raw -ErrorAction SilentlyContinue
if ($logContent -match 'unable to start on port') {
  Write-Host "Warning: default hosting port was busy. Emulator selected an alternate port."
}
if ($logContent -match 'multiple instances of the emulator suite') {
  Write-Host "Warning: multiple emulator instances detected. Results may vary."
}

$toolsLogLine = $null
if ($logContent -match '\[RYD\].*base tools loaded:.*') {
  $toolsLogLine = $Matches[0]
}

$serverOk = $false
try {
  $resp = Invoke-WebRequest -UseBasicParsing -Uri ($hostingUrl + "/") -Method Get -TimeoutSec 10
  if ($resp.StatusCode -eq 200) { $serverOk = $true }
} catch {
  $serverOk = $false
}

$toolsPath = Join-Path $repoRoot "public\data\tools-canonical.json"
$toolsCount = Get-ToolsCanonicalCount -ToolsPath $toolsPath

$loginHits = New-Object System.Collections.Generic.List[string]
if (Test-Path $toolsPath) {
  $rawTools = Get-Content -LiteralPath $toolsPath -Raw -Encoding UTF8
  if (Test-Json $rawTools) {
    $toolsData = $rawTools | ConvertFrom-Json
    if ($toolsData -is [System.Array]) {
      $loginHits = Find-LoginStrings -Tools $toolsData
    } elseif ($null -ne $toolsData.tools -and ($toolsData.tools -is [System.Array])) {
      $loginHits = Find-LoginStrings -Tools $toolsData.tools
    }
  }
}

Write-Section "PASS/FAIL Checklist"
$checkServer = if ($serverOk) { "PASS" } else { "FAIL" }
$checkUrl = if ($hostingUrl) { "PASS" } else { "FAIL" }
$checkTools = if ($toolsCount -gt 0) { "PASS" } else { "FAIL" }
$checkLogin = if ($loginHits.Count -eq 0) { "PASS" } else { "FAIL" }

Write-Host ("1) server started: " + $checkServer)
Write-Host ("2) correct URL(s) to open: " + $checkUrl + " -> " + $hostingUrl)
Write-Host ("3) tools loaded (canonical count logged): " + $checkTools + " -> " + $toolsCount)
if ($toolsLogLine) {
  Write-Host ("   log: " + $toolsLogLine)
} else {
  Write-Host "   log: not found in server output"
}
Write-Host ("4) login/sign-in strings absent in meta/description: " + $checkLogin)

if ($loginHits.Count -gt 0) {
  Write-Host ""
  Write-Host "Found login-related strings in tool fields (first 5):"
  $loginHits | Select-Object -First 5 | ForEach-Object { Write-Host (" - " + $_) }
}

Write-Host ""
Write-Host ("Open: " + $hostingUrl + "/")
Write-Host ("Open: " + $hostingUrl + "/insights")

if ($serverOk -and $hostingUrl -and $toolsCount -gt 0 -and $loginHits.Count -eq 0) {
  exit 0
}

exit 2
