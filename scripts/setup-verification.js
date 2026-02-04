import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

console.log("\n" + "=".repeat(60));
console.log("System Setup Verification");
console.log("=".repeat(60) + "\n");

let allGood = true;

// Check dependencies
console.log("📦 Checking dependencies...");
const nodeModulesPath = path.join(projectRoot, "node_modules");
if (fs.existsSync(nodeModulesPath)) {
  const required = ['puppeteer', 'axios', 'ssh2'];
  const missing = [];
  
  required.forEach(dep => {
    if (fs.existsSync(path.join(nodeModulesPath, dep))) {
      console.log(`  ✓ ${dep} installed`);
    } else {
      console.log(`  ✗ ${dep} missing`);
      missing.push(dep);
      allGood = false;
    }
  });
} else {
  console.log("  ✗ node_modules not found");
  allGood = false;
}

// Check directories
console.log("\n📁 Checking directories...");
const requiredDirs = ['logs/audit', 'config', 'core', 'scripts', 'programs'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(projectRoot, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✓ ${dir} exists`);
  } else {
    console.log(`  ✗ ${dir} missing`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ ${dir} created`);
  }
});

// Check core files
console.log("\n🔧 Checking core files...");
const coreFiles = [
  'core/readonly-mode.js',
  'core/audit-system.js',
  'core/code-auditor.js',
  'core/navigation-controller.js',
  'core/web-automation.js',
  'core/firebase-auth.js'
];

coreFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} missing`);
    allGood = false;
  }
});

// Check scripts
console.log("\n📜 Checking scripts...");
const scripts = [
  'scripts/audit-website.js',
  'scripts/remote-access-cli.js',
  'scripts/check-website.js'
];

scripts.forEach(script => {
  const scriptPath = path.join(projectRoot, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`  ✓ ${script}`);
  } else {
    console.log(`  ✗ ${script} missing`);
    allGood = false;
  }
});

// Check config
console.log("\n⚙️  Checking configuration...");
const configPath = path.join(projectRoot, "config/app.config.json");
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.website && config.website.url) {
      console.log(`  ✓ Website URL configured: ${config.website.url}`);
    } else {
      console.log(`  ⚠ Website URL not configured`);
    }
  } catch (error) {
    console.log(`  ✗ Config file invalid: ${error.message}`);
    allGood = false;
  }
} else {
  console.log(`  ✗ Config file missing`);
  allGood = false;
}

// Summary
console.log("\n" + "=".repeat(60));
if (allGood) {
  console.log("✅ System is ready!");
  console.log("\nNext steps:");
  console.log("  1. Run: npm run audit-website");
  console.log("  2. Browser will open");
  console.log("  3. Log in manually with your credentials");
  console.log("  4. Navigate to code area");
  console.log("  5. System will perform read-only audit");
  console.log("  6. Reports will be generated in logs/audit/");
} else {
  console.log("⚠️  Some issues found. Please review above.");
}
console.log("=".repeat(60) + "\n");

process.exit(allGood ? 0 : 1);

