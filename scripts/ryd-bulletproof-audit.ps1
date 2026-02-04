param(
  [switch]$Apply,
  [switch]$VerboseReport
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Section($t) {
  Write-Host ""
  Write-Host ("=" * 80)
  Write-Host $t
  Write-Host ("=" * 80)
}

function Get-RepoRoot {
  # Walk upward until we find .git or firebase.json or package.json
  $dir = Get-Location
  while ($true) {
    if (Test-Path (Join-Path $dir ".git")) { return $dir }
    if (Test-Path (Join-Path $dir "firebase.json")) { return $dir }
    if (Test-Path (Join-Path $dir "package.json")) { return $dir }
    $parent = Split-Path $dir -Parent
    if ($parent -eq $dir -or [string]::IsNullOrWhiteSpace($parent)) {
      return (Get-Location)
    }
    $dir = $parent
  }
}

function Read-TextSafe([string]$path) {
  return Get-Content -LiteralPath $path -Raw -Encoding UTF8
}

function LooksLikeJavaScriptPretendingJson([string]$text) {
  # Heuristics: if ANY of these exist, it’s not JSON data.
  $patterns = @(
    '^\s*import\s+',
    '^\s*export\s+',
    '^\s*const\s+',
    '^\s*let\s+',
    '^\s*var\s+',
    'function\s*\(',
    '=>',
    '\/\/',          # line comment
    '\/\*',          # block comment start
    '\*\/',          # block comment end
    'module\.exports',
    'require\s*\('
  )
  foreach ($p in $patterns) {
    if ($text -match $p) { return $true }
  }
  return $false
}

function Test-JsonStrict([string]$path) {
  # Use PowerShell’s JSON parser; it is strict enough to catch common issues.
  # (Still: it can accept some things; so we also flag obvious unquoted keys via regex.)
  $text = Read-TextSafe $path

  # Quick unquoted-key heuristic: { key: ... } or , key: ...
  # Valid JSON requires "key":
  $unquotedKey = $false
  if ($text -match '(?m)(\{|\s|,)\s*[A-Za-z_][A-Za-z0-9_]*\s*:') {
    # This can false-positive inside strings; we still treat as warning signal.
    $unquotedKey = $true
  }

  try {
    $null = $text | ConvertFrom-Json -ErrorAction Stop
    return [pscustomobject]@{
      Path = $path
      Ok = $true
      Error = $null
      UnquotedKeyHeuristic = $unquotedKey
      LooksJS = (LooksLikeJavaScriptPretendingJson $text)
    }
  } catch {
    return [pscustomobject]@{
      Path = $path
      Ok = $false
      Error = $_.Exception.Message
      UnquotedKeyHeuristic = $unquotedKey
      LooksJS = (LooksLikeJavaScriptPretendingJson $text)
    }
  }
}

function Backup-File([string]$path) {
  $ts = Get-Date -Format "yyyyMMdd-HHmmss"
  $bak = "$path.bak.$ts"
  Copy-Item -LiteralPath $path -Destination $bak -Force
  return $bak
}

function Rename-JsonToJs([string]$path) {
  $dir = Split-Path $path -Parent
  $name = Split-Path $path -Leaf
  $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
  $new = Join-Path $dir ($base + ".js")
  if (Test-Path $new) {
    throw "Refusing to rename: target already exists: $new"
  }
  Move-Item -LiteralPath $path -Destination $new
  return $new
}

function Find-FirebaseHostingRoots([string]$repoRoot) {
  $fb = Join-Path $repoRoot "firebase.json"
  if (-not (Test-Path $fb)) { return @() }

  $text = Read-TextSafe $fb
  try {
    $obj = $text | ConvertFrom-Json -ErrorAction Stop
  } catch {
    Write-Host "firebase.json exists but failed to parse as JSON: $($_.Exception.Message)"
    return @()
  }

  $roots = @()
  # hosting can be object or array
  if ($obj.hosting -is [System.Collections.IEnumerable] -and -not ($obj.hosting -is [string])) {
    foreach ($h in $obj.hosting) {
      if ($null -ne $h.public) { $roots += $h.public }
    }
  } else {
    if ($null -ne $obj.hosting.public) { $roots += $obj.hosting.public }
  }

  $roots = $roots | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
  return $roots
}

# MAIN
$repoRoot = Get-RepoRoot
Set-Location $repoRoot

Write-Section "RYD Bulletproof Audit/Fix (Repo Root: $repoRoot)"
Write-Host "Mode: " -NoNewline
if ($Apply) { Write-Host "APPLY (safe renames + backups)" } else { Write-Host "AUDIT ONLY" }

# 0) Quick git status check if git exists
Write-Section "Git sanity (if available)"
try {
  $git = Get-Command git -ErrorAction Stop
  $status = git status --porcelain
  if ($status) {
    Write-Host "WARNING: Working tree not clean. Consider committing/stashing before applying changes."
    if ($VerboseReport) { Write-Host $status }
  } else {
    Write-Host "OK: Working tree clean."
  }
} catch {
  Write-Host "git not found or not a git repo. Skipping git checks."
}

# 1) JSON validation sweep
Write-Section "Scan: validate all *.json"
$jsonFiles = Get-ChildItem -Path $repoRoot -Recurse -File -Filter "*.json" -ErrorAction SilentlyContinue

if (-not $jsonFiles -or $jsonFiles.Count -eq 0) {
  Write-Host "No .json files found."
  exit 0
}

$results = @()
foreach ($f in $jsonFiles) {
  $results += (Test-JsonStrict $f.FullName)
}

$ok = $results | Where-Object { $_.Ok -eq $true }
$bad = $results | Where-Object { $_.Ok -eq $false }

Write-Host ("Total JSON files: {0}" -f $results.Count)
Write-Host ("Valid JSON:       {0}" -f $ok.Count)
Write-Host ("Invalid JSON:     {0}" -f $bad.Count)

# 2) Report invalids with classification
Write-Section "Invalid JSON files (classified)"
if ($bad.Count -eq 0) {
  Write-Host "✅ No invalid JSON detected by parser."
} else {
  foreach ($r in $bad) {
    $tag = if ($r.LooksJS) { "JS-PRETENDING-JSON" } else { "DATA-JSON-BROKEN" }
    Write-Host ""
    Write-Host "File: $($r.Path)"
    Write-Host "Type: $tag"
    Write-Host "Err:  $($r.Error)"
    if ($r.UnquotedKeyHeuristic) {
      Write-Host "Note: Unquoted-key heuristic triggered (likely { key: value } style)."
    }

    if ($Apply -and $r.LooksJS) {
      Write-Host "Apply: backing up and renaming to .js ..."
      $bak = Backup-File $r.Path
      $new = Rename-JsonToJs $r.Path
      Write-Host "Backup: $bak"
      Write-Host "Renamed: $new"
      Write-Host "IMPORTANT: You still must update imports/refs in code to use .js instead of .json."
    } elseif ($Apply -and -not $r.LooksJS) {
      Write-Host "Apply: NOT auto-fixing data JSON (unsafe). Fix manually with strict JSON rules."
    }
  }
}

# 3) Warn about “valid but suspicious” JSON (unquoted key heuristic)
Write-Section "Suspicious-but-parseable JSON (heuristic)"
$suspicious = $ok | Where-Object { $_.UnquotedKeyHeuristic -eq $true }
if ($suspicious.Count -eq 0) {
  Write-Host "No suspicious JSON files flagged."
} else {
  Write-Host "These parsed, but look like they might contain unquoted keys or JS-ish shapes:"
  foreach ($s in $suspicious) {
    Write-Host " - $($s.Path)"
  }
  Write-Host "If VS Code still shows json(528) errors, open these first."
}

# 4) Required data files check (gates/pain-points/tools)
Write-Section "Required data files presence"
$requiredNames = @("gates.json", "pain-points.json", "tools.json", "tools-canonical.json")
$found = @{}

foreach ($n in $requiredNames) {
  $matches = Get-ChildItem -Path $repoRoot -Recurse -File -Filter $n -ErrorAction SilentlyContinue
  $found[$n] = $matches
  if ($matches.Count -eq 0) {
    Write-Host "MISSING: $n"
  } else {
    Write-Host "FOUND: $n"
    foreach ($m in $matches) {
      Write-Host ("  - {0}" -f $m.FullName)
    }
  }
}

# 5) Hosting root detection and /data expectation
Write-Section "Firebase hosting roots (from firebase.json)"
$roots = Find-FirebaseHostingRoots $repoRoot
if ($roots.Count -eq 0) {
  Write-Host "No hosting.public roots detected (or firebase.json missing/unparseable)."
} else {
  foreach ($r in $roots) {
    $abs = Join-Path $repoRoot $r
    Write-Host "Hosting public: $r"
    Write-Host "Absolute:       $abs"
    if (-not (Test-Path $abs)) {
      Write-Host "  WARNING: hosting public directory does not exist."
      continue
    }

    $dataDir = Join-Path $abs "data"
    if (Test-Path $dataDir) {
      Write-Host "  OK: data dir exists: $dataDir"
      foreach ($n in $requiredNames) {
        $p = Join-Path $dataDir $n
        if (Test-Path $p) {
          Write-Host "    OK: $n"
        } else {
          Write-Host "    MISSING in hosting /data: $n"
        }
      }
    } else {
      Write-Host "  WARNING: no /data directory under hosting public root."
    }
  }
}

# 6) Sandbox deployment risk scan
Write-Section "Sandbox deployment risk scan"
$firebasePath = Join-Path $repoRoot "firebase.json"
if (Test-Path $firebasePath) {
  $fbText = Read-TextSafe $firebasePath
  if ($fbText -match '(?i)sandbox') {
    Write-Host "NOTE: 'sandbox' appears in firebase.json. Inspect ignores/rewrites to ensure sandbox is not deployed."
  } else {
    Write-Host "OK: No obvious 'sandbox' string in firebase.json."
  }
} else {
  Write-Host "firebase.json not found; cannot evaluate deployment scope."
}

Write-Section "DONE"
Write-Host "Next actions:"
Write-Host "1) Fix remaining invalid JSON manually OR rename JS-as-JSON and update references."
Write-Host "2) Run your node scripts and confirm VS Code Problems panel is clean."
Write-Host "3) If hosting /data missing files, consolidate the correct versions into hosting-root/data."
