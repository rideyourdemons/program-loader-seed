#!/usr/bin/env node
/**
 * Matrix dry-run — validates paths and config without writing heavy outputs.
 * Use: node matrix-dry.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(PUBLIC, "data");
const CONFIG = path.join(ROOT, "config");

const checks = [
  { name: "Repo root", path: ROOT },
  { name: "public/", path: PUBLIC },
  { name: "public/data/", path: DATA },
  { name: "config/", path: CONFIG },
];

console.log("==========================================");
console.log("  MATRIX DRY-RUN — Path Validation");
console.log("==========================================\n");

let ok = 0;
for (const c of checks) {
  const exists = fs.existsSync(c.path);
  console.log(`  ${exists ? "✅" : "❌"} ${c.name}: ${c.path}`);
  if (exists) ok++;
}

console.log("\n" + (ok === checks.length ? "✅ All paths OK. Matrix tooling can run." : "❌ Some paths missing."));
console.log("==========================================\n");

process.exit(ok === checks.length ? 0 : 1);
