#!/usr/bin/env node
/**
 * Minimal smoke test: loads key pages and checks for 200.
 * Run: node scripts/smoke-integrity.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */
const base = process.argv[2] || 'http://localhost:3000';
const routes = ['/', '/store/', '/insights', '/gates', '/tools', '/search'];

async function check(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: 0, ok: false, error: err.message };
  }
}

const results = await Promise.all(routes.map(r => check(base + r)));
const failed = results.filter(r => !r.ok || r.status !== 200);

if (failed.length > 0) {
  console.error('\n❌ Smoke test failed:\n');
  failed.forEach(f => console.error(`  ${f.url} → ${f.status} ${f.error || ''}`));
  process.exit(1);
}

console.log('\n✅ Smoke test passed: all routes return 200\n');
results.forEach(r => console.log(`  ${r.url} → ${r.status}`));
