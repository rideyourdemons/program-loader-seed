const fs = require('fs');
const path = require('path');

console.log("🚀 STARTING FULL PROJECT SCOUR...");

const projectRoot = process.cwd();
const issues = [];

// 1. SCAN FOR PATH ERRORS IN JS/JSON FILES (REPORT-ONLY)
function scanAndReportPaths(dir) {
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch (error) {
    issues.push(`READ ERROR: ${dir} -> ${error.message}`);
    return;
  }

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    let stats;
    try {
      stats = fs.lstatSync(fullPath);
    } catch (error) {
      issues.push(`STAT ERROR: ${fullPath} -> ${error.message}`);
      return;
    }

    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        scanAndReportPaths(fullPath);
      }
      return;
    }

    if (!file.endsWith('.js') && !file.endsWith('.json')) return;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      issues.push(`READ ERROR: ${fullPath} -> ${error.message}`);
      return;
    }

    if (content.includes("'/data/") || content.includes('"/data/')) {
      console.log(`⚠️  Found absolute /data path in: ${fullPath}`);
    }
  });
}

// 2. CHECK ENVIRONMENT & DEPENDENCIES
console.log("📦 Checking dependencies...");
if (!fs.existsSync(path.join(projectRoot, 'node_modules'))) {
  issues.push("MISSING: node_modules. FIX: Run 'npm install'");
}

// 3. CHECK FOR THE "GRAYED OUT" CULPRIT
console.log("🕵️  Checking why files are grayed out...");
if (fs.existsSync(path.join(projectRoot, '.gitignore'))) {
  const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
  if (gitignore.includes('data') || gitignore.includes('public')) {
    console.log("⚠️  INFO: Your data/public folders are in .gitignore. That is why they are gray.");
  }
}

// 4. VERIFY JSON INTEGRITY
const dataFolder = path.join(projectRoot, 'public', 'data');
if (fs.existsSync(dataFolder)) {
  const dataFiles = fs.readdirSync(dataFolder);
  console.log(`📁 Found ${dataFiles.length} files in /public/data`);
} else {
  issues.push("MISSING: /public/data folder. This is likely why the app is crashing.");
}

// Run scan last to avoid noisy output before sanity checks
scanAndReportPaths(projectRoot);

// SUMMARY
console.log("\n--- SCOUR COMPLETE ---");
if (issues.length === 0) {
  console.log("✅ No major structural breaks found. Try running: npm start");
} else {
  console.log("❌ ISSUES FOUND:");
  issues.forEach(issue => console.log(`- ${issue}`));
}

console.log("\n💡 NEXT STEP: If the terminal still shows red, run: npm install");
