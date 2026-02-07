/**
 * Local Run Pipeline: Validate First, Then Serve
 * Ensures validation passes before starting the server
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  RYD LOCAL RUN PIPELINE');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Step 1: Run validation
console.log('[1/2] Running validation...');
console.log('');

let validationPassed = false;

try {
  // Try npm run validate first
  try {
    execSync('npm run validate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    validationPassed = true;
  } catch (err) {
    // If npm run validate fails, try direct script
    console.log('   npm run validate not available, trying direct validation...');
    try {
      execSync('node scripts/validate-tools-json.cjs', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      validationPassed = true;
    } catch (err2) {
      console.error('');
      console.error('❌ VALIDATION FAILED');
      console.error('   Server will not start until validation passes.');
      console.error('');
      process.exit(1);
    }
  }
} catch (err) {
  console.error('');
  console.error('❌ VALIDATION FAILED');
  console.error('   Server will not start until validation passes.');
  console.error('');
  process.exit(1);
}

if (!validationPassed) {
  console.error('');
  console.error('❌ VALIDATION FAILED');
  console.error('   Server will not start until validation passes.');
  console.error('');
  process.exit(1);
}

console.log('');
console.log('✅ Validation passed');
console.log('');

// Step 2: Start server
console.log('[2/2] Starting local server...');
console.log('');

try {
  execSync('node scripts/serve-public.cjs', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (err) {
  // Server stopped (Ctrl+C or error)
  process.exit(err.status || 0);
}
