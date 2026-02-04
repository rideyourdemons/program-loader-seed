Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Json([string]$Text) {
  try {
    $null = $Text | ConvertFrom-Json -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

function Get-CandidateFiles([string]$Root) {
  $skipDirs = @("node_modules", ".git", "dist", "build", "coverage", "logs")
  $patterns = @("*.json", "*.jsonc", "*.webmanifest", "*.geojson", "*.map", "*.tested.json")

  $all = @()
  foreach ($p in $patterns) {
    $all += Get-ChildItem -Path $Root -Recurse -File -Filter $p -ErrorAction SilentlyContinue
  }

  $filtered = $all | Where-Object {
    $path = $_.FullName
    foreach ($dir in $skipDirs) {
      if ($path -match [regex]::Escape("\$dir\")) { return $false }
      if ($path -match [regex]::Escape("/$dir/")) { return $false }
    }
    return $true
  }

  return ($filtered | Sort-Object -Property FullName -Unique)
}

$repoRoot = Get-Location
$files = Get-CandidateFiles $repoRoot

if (-not $files -or $files.Count -eq 0) {
  Write-Host "No JSON-like files found."
  exit 0
}

$invalid = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
  $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  if (-not (Test-Json $text)) {
    $invalid.Add($file.FullName)
  }
}

Write-Host "Invalid JSON files: $($invalid.Count)"
if ($invalid.Count -gt 0) {
  $invalid | Sort-Object | ForEach-Object { Write-Host $_ }
  exit 2
}

exit 0
