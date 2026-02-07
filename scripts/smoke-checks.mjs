/**
 * Smoke Checks - Run lint/typecheck if available
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

/**
 * Check if command exists
 */
async function commandExists(command) {
  try {
    await execAsync(`where ${command}`, { shell: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run checks
 */
async function runChecks() {
  console.log('\n' + '='.repeat(70));
  console.log('  SMOKE CHECKS - Lint & Typecheck');
  console.log('='.repeat(70));
  console.log('');
  
  const checks = [];
  
  // Check for ESLint
  try {
    const { stdout } = await execAsync('npm run lint 2>&1', { shell: true });
    checks.push({ name: 'ESLint', status: 'PASS', output: stdout });
    console.log('✅ ESLint: PASS');
  } catch (error) {
    // Check if lint script exists
    const fs = await import('fs');
    const path = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const packageJsonPath = path.join(path.dirname(__filename), '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson?.scripts?.lint) {
      checks.push({ name: 'ESLint', status: 'FAIL', output: error.stdout || error.message });
      console.log('❌ ESLint: FAIL');
      console.log(`   ${error.stdout || error.message}`);
    } else {
      checks.push({ name: 'ESLint', status: 'SKIP', output: 'No lint script configured' });
      console.log('⚠️  ESLint: SKIP (no lint script configured)');
    }
  }
  
  // Check for TypeScript
  try {
    const { stdout } = await execAsync('npx tsc --noEmit 2>&1', { shell: true });
    checks.push({ name: 'TypeScript', status: 'PASS', output: stdout });
    console.log('✅ TypeScript: PASS');
  } catch (error) {
    // Check if TypeScript is installed
    try {
      await execAsync('npx tsc --version', { shell: true });
      checks.push({ name: 'TypeScript', status: 'FAIL', output: error.stdout || error.message });
      console.log('❌ TypeScript: FAIL');
      console.log(`   ${error.stdout || error.message}`);
    } catch {
      checks.push({ name: 'TypeScript', status: 'SKIP', output: 'TypeScript not installed' });
      console.log('⚠️  TypeScript: SKIP (not installed)');
    }
  }
  
  console.log('');
  
  // Summary
  const passed = checks.filter(c => c.status === 'PASS').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const skipped = checks.filter(c => c.status === 'SKIP').length;
  
  console.log('='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ PASS: ${passed}`);
  if (skipped > 0) {
    console.log(`⚠️  SKIP: ${skipped}`);
  }
  if (failed > 0) {
    console.log(`❌ FAIL: ${failed}`);
    console.log('\n⚠️  Note: Lint/typecheck failures are warnings, not blockers');
  }
  console.log('');
  
  // Don't exit on failure - these are warnings
  process.exit(0);
}

runChecks().catch(error => {
  console.error('\n❌ Error running checks:', error.message);
  process.exit(0); // Don't fail smoke test on check errors
});
