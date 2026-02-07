import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_DIR = path.join(__dirname, '..', 'tools', 'mens-mental-health');
const CURSOR_RULES_PATH = path.join(__dirname, '..', '.cursorrules');
const DISCLAIMER_TEXT = "The information provided is for educational purposes and is not a substitute for professional medical advice.";

// 1. Fix the JSON Files
console.log('--- Injecting Disclaimers into JSON ---');
const files = fs.readdirSync(TOOLS_DIR).filter(f => f.endsWith('.json'));
files.forEach(file => {
    const filePath = path.join(TOOLS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.disclaimer) {
        data.disclaimer = DISCLAIMER_TEXT;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
        console.log(`✅ Fixed: ${file}`);
    } else {
        console.log(`⏭️  Already has disclaimer: ${file}`);
    }
});

// 2. Update .cursorrules
console.log('\n--- Hardcoding Rules into .cursorrules ---');
const ruleAddition = `
# SCHEMA ENFORCEMENT PROTOCOL
- All JSON in tools/ must have a top-level "disclaimer" field.
- If validation fails, Cursor is MANDATED to fix it using this text: "${DISCLAIMER_TEXT}"
- Never mark a task as complete until 'npm run validate' passes.
`;

if (fs.existsSync(CURSOR_RULES_PATH)) {
    const currentContent = fs.readFileSync(CURSOR_RULES_PATH, 'utf8');
    // Check if rule already exists
    if (!currentContent.includes('SCHEMA ENFORCEMENT PROTOCOL')) {
        fs.appendFileSync(CURSOR_RULES_PATH, ruleAddition);
        console.log('✅ .cursorrules updated.');
    } else {
        console.log('⏭️  .cursorrules already contains schema enforcement rules.');
    }
} else {
    console.log('❌ .cursorrules file not found.');
}

// 3. Install the Gatekeeper (Husky)
console.log('\n--- Setting up Git Commit Gatekeeper ---');
try {
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Install husky if not already installed
    try {
        execSync('npm install husky --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.log('⚠️  Husky may already be installed or npm install failed.');
    }
    
    // Initialize husky
    try {
        execSync('npx husky install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.log('⚠️  Husky install may have failed or already initialized.');
    }
    
    // Create pre-commit hook
    const huskyDir = path.join(__dirname, '..', '.husky');
    if (!fs.existsSync(huskyDir)) {
        fs.mkdirSync(huskyDir, { recursive: true });
    }
    
    const preCommitHook = path.join(huskyDir, 'pre-commit');
    const hookContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run validate
`;
    fs.writeFileSync(preCommitHook, hookContent);
    // Make executable on Unix systems
    try {
        fs.chmodSync(preCommitHook, '755');
    } catch (e) {
        // Windows doesn't support chmod, that's okay
    }
    
    console.log('✅ Husky Gatekeeper active. Commits will fail if validation fails.');
} catch (e) {
    console.log('❌ Husky setup failed. Ensure you are in a Git repo.');
    console.log(`   Error: ${e.message}`);
}

console.log('\n🚀 GOLD STANDARD ACHIEVED.');
