// tools/site-doctor.mjs
// Usage:
//   node tools/site-doctor.mjs
//   node tools/site-doctor.mjs --fix
//   node tools/site-doctor.mjs --fix --serve
// Notes:
// - Scans repo (excluding node_modules/.git/etc)
// - Validates JSON (except package-lock*)
// - Verifies key web entrypoints exist
// - Detects obvious broken relative paths in index.html
// - Runs npm install if node_modules missing
// - Optionally runs npm audit fix (non-breaking) in --fix mode
// - Optionally serves /public and hits it once in --serve mode

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = new Set(process.argv.slice(2));
const FIX = args.has("--fix");
const SERVE = args.has("--serve");

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".firebase",
  ".vscode",
  ".idea",
]);

const SKIP_JSON_NAMES = [/^package-lock(\..+)?\.json$/i];

const root = process.cwd();

function say(msg) {
  process.stdout.write(msg + "\n");
}
function die(msg, code = 1) {
  say(`\n[FATAL] ${msg}`);
  process.exit(code);
}
function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: false, ...opts });
  return r.status ?? 0;
}
function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}
function readText(p) {
  return fs.readFileSync(p, "utf8");
}
function isExcludedDir(name) {
  return EXCLUDE_DIRS.has(name);
}
function shouldSkipJson(fileName) {
  return SKIP_JSON_NAMES.some((re) => re.test(fileName));
}
function walk(dir, outFiles = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (isExcludedDir(ent.name)) continue;
      walk(full, outFiles);
    } else if (ent.isFile()) {
      outFiles.push(full);
    }
  }
  return outFiles;
}

function validateJsonFile(filePath) {
  // Strict JSON parse using Node
  const txt = readText(filePath);
  JSON.parse(txt);
}

function safeNpmInstallIfNeeded() {
  const nodeModules = path.join(root, "node_modules");
  if (exists(nodeModules)) return 0;

  say("[SiteDoctor] node_modules missing → running npm install");
  const code = run("npm", ["install"]);
  return code;
}

function npmAuditFixNonBreaking() {
  // Non-breaking first. We DO NOT do --force automatically.
  say("[SiteDoctor] Running npm audit fix (non-breaking)");
  return run("npm", ["audit", "fix"]);
}

function findPackageJson() {
  const p = path.join(root, "package.json");
  if (!exists(p)) return null;
  return p;
}

function parsePackageJson(pkgPath) {
  try {
    return JSON.parse(readText(pkgPath));
  } catch (e) {
    return { __parseError: e?.message || String(e) };
  }
}

function checkEntrypoints() {
  const candidates = [
    path.join(root, "public", "index.html"),
    path.join(root, "index.html"),
  ];
  const hit = candidates.find(exists);
  return { candidates, hit };
}

function extractLocalRefsFromHtml(htmlText) {
  // Simple scrape for src/href that look like local relative paths
  // (won't catch everything, but catches obvious "404 at runtime" stuff)
  const refs = [];
  const patterns = [
    /(?:src|href)=["']([^"']+)["']/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(htmlText)) !== null) {
      const url = match[1];
      // Skip absolute URLs, data URIs, and anchors
      if (url.startsWith("http://") || url.startsWith("https://") || 
          url.startsWith("//") || url.startsWith("data:") || 
          url.startsWith("mailto:") || url.startsWith("tel:") ||
          url.startsWith("#") || url.startsWith("javascript:")) {
        continue;
      }
      // Only care about relative paths that look like file references
      if (url.startsWith("/") || url.startsWith("./") || !url.includes("://")) {
        refs.push(url);
      }
    }
  }
  
  return [...new Set(refs)]; // dedupe
}

function checkBrokenPaths(htmlPath, publicDir) {
  const htmlText = readText(htmlPath);
  const refs = extractLocalRefsFromHtml(htmlText);
  const broken = [];
  
  for (const ref of refs) {
    let checkPath;
    if (ref.startsWith("/")) {
      // Absolute from public root
      checkPath = path.join(publicDir, ref.slice(1));
    } else if (ref.startsWith("./")) {
      // Relative to HTML file
      checkPath = path.resolve(path.dirname(htmlPath), ref.slice(2));
    } else {
      // Relative to HTML file (no ./)
      checkPath = path.resolve(path.dirname(htmlPath), ref);
    }
    
    // Normalize and check if it's within public directory
    const normalized = path.normalize(checkPath);
    const publicNormalized = path.normalize(publicDir);
    
    if (!normalized.startsWith(publicNormalized)) {
      // Path outside public - might be intentional, skip
      continue;
    }
    
    // Check if file exists
    if (!exists(normalized)) {
      // Also check if it's a directory (for clean URLs)
      const asDir = path.join(normalized, "index.html");
      if (!exists(asDir)) {
        broken.push({ ref, expected: normalized });
      }
    }
  }
  
  return broken;
}

function serveAndTest(publicDir, port = 3000) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(publicDir, req.url === "/" ? "index.html" : req.url);
      
      // Security: ensure path is within publicDir
      const normalized = path.normalize(filePath);
      const publicNormalized = path.normalize(publicDir);
      if (!normalized.startsWith(publicNormalized)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      
      // Check if file exists
      if (!exists(filePath)) {
        // Try as directory with index.html
        const dirPath = path.join(filePath, "index.html");
        if (exists(dirPath)) {
          filePath = dirPath;
        } else {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }
      }
      
      // Simple content-type detection
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
      };
      const contentType = contentTypes[ext] || "application/octet-stream";
      
      try {
        const content = readText(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch (err) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });
    
    server.listen(port, "localhost", () => {
      say(`[SiteDoctor] Serving on http://localhost:${port}`);
      
      // Make a test request
      const req = http.get(`http://localhost:${port}/`, (res) => {
        const statusCode = res.statusCode;
        say(`[SiteDoctor] Test request: ${statusCode} ${res.statusMessage}`);
        
        server.close(() => {
          if (statusCode === 200) {
            resolve(0);
          } else {
            reject(new Error(`Test request failed with status ${statusCode}`));
          }
        });
      });
      
      req.on("error", (err) => {
        server.close(() => {
          reject(err);
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        server.close(() => {
          reject(new Error("Test request timeout"));
        });
      });
    });
    
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });
  });
}

// Main execution
async function main() {
  say("\n============================================================");
  say("SiteDoctor: Website Health Check");
  say("============================================================\n");
  
  let errors = 0;
  let warnings = 0;
  
  // Step 1: Find and validate JSON files
  say("[1/5] Scanning and validating JSON files...");
  const allFiles = walk(root);
  const jsonFiles = allFiles.filter((f) => {
    const name = path.basename(f);
    const ext = path.extname(f).toLowerCase();
    return (ext === ".json" || ext === ".jsonc" || 
            name.endsWith(".webmanifest") || name.endsWith(".geojson") ||
            name.endsWith(".map") || name.endsWith(".tested.json")) &&
           !shouldSkipJson(name);
  });
  
  say(`   Found ${jsonFiles.length} JSON-like files (excluding package-lock.json)`);
  
  const invalidJson = [];
  for (const jsonFile of jsonFiles) {
    try {
      validateJsonFile(jsonFile);
    } catch (e) {
      invalidJson.push({ file: jsonFile, error: e.message });
      errors++;
    }
  }
  
  if (invalidJson.length > 0) {
    say(`   ❌ ${invalidJson.length} invalid JSON file(s):`);
    for (const { file, error } of invalidJson) {
      say(`      - ${path.relative(root, file)}: ${error}`);
    }
  } else {
    say(`   ✅ All JSON files valid`);
  }
  
  // Step 2: Check entrypoints
  say("\n[2/5] Checking web entrypoints...");
  const { hit: entrypoint } = checkEntrypoints();
  if (!entrypoint) {
    say("   ❌ No index.html found in public/ or root/");
    errors++;
  } else {
    say(`   ✅ Found entrypoint: ${path.relative(root, entrypoint)}`);
  }
  
  // Step 3: Check for broken paths in HTML
  say("\n[3/5] Checking for broken relative paths...");
  if (entrypoint) {
    const publicDir = path.join(root, "public");
    const broken = checkBrokenPaths(entrypoint, publicDir);
    if (broken.length > 0) {
      say(`   ⚠️  ${broken.length} potentially broken path(s):`);
      for (const { ref, expected } of broken.slice(0, 10)) {
        say(`      - ${ref} → ${path.relative(root, expected)}`);
      }
      if (broken.length > 10) {
        say(`      ... and ${broken.length - 10} more`);
      }
      warnings += broken.length;
    } else {
      say("   ✅ No obvious broken paths detected");
    }
  }
  
  // Step 4: Check node_modules
  say("\n[4/5] Checking dependencies...");
  const nodeModules = path.join(root, "node_modules");
  if (!exists(nodeModules)) {
    say("   ⚠️  node_modules missing");
    if (FIX) {
      const code = safeNpmInstallIfNeeded();
      if (code !== 0) {
        say("   ❌ npm install failed");
        errors++;
      } else {
        say("   ✅ npm install completed");
      }
    } else {
      say("   💡 Run with --fix to install dependencies");
      warnings++;
    }
  } else {
    say("   ✅ node_modules present");
  }
  
  // Step 5: Optional npm audit fix
  if (FIX) {
    say("\n[5/5] Running npm audit fix (non-breaking)...");
    const code = npmAuditFixNonBreaking();
    if (code !== 0) {
      say("   ⚠️  npm audit fix had issues (this is often normal)");
      warnings++;
    } else {
      say("   ✅ npm audit fix completed");
    }
  } else {
    say("\n[5/5] Skipping npm audit fix (use --fix to enable)");
  }
  
  // Step 6: Optional serve and test
  if (SERVE && entrypoint) {
    say("\n[6/6] Serving and testing...");
    const publicDir = path.join(root, "public");
    if (!exists(publicDir)) {
      say("   ❌ public/ directory not found");
      errors++;
    } else {
      try {
        await serveAndTest(publicDir);
        say("   ✅ Server test passed");
      } catch (e) {
        say(`   ❌ Server test failed: ${e.message}`);
        errors++;
      }
    }
  }
  
  // Summary
  say("\n============================================================");
  say("Summary");
  say("============================================================");
  say(`Errors: ${errors}`);
  say(`Warnings: ${warnings}`);
  
  if (errors > 0) {
    say("\n❌ SiteDoctor found issues that need attention.");
    process.exit(1);
  } else if (warnings > 0) {
    say("\n⚠️  SiteDoctor found warnings (non-critical).");
    process.exit(0);
  } else {
    say("\n✅ SiteDoctor: All checks passed!");
    process.exit(0);
  }
}

main().catch((err) => {
  die(`Unexpected error: ${err.message}`, 1);
});
