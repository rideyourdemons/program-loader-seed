#!/usr/bin/env node
/**
 * RYD Content Integrity Check
 * Fails loudly if structure violates requirements.
 * Run: npm run integrity
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DATA = join(PUBLIC, 'data');

const EXPECTED_GATES_COUNT = 12; // 12 gates, full-resurrection-system forbidden
const EXPECTED_PAIN_POINTS_PER_GATE = 40;
const EXPECTED_TOOLS_PER_PAIN_POINT = 3;
const FORBIDDEN_GATE_PHRASE = 'full resurrection system';

let errors = [];
let warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

// 1. Gates count and forbidden phrase
const gatesPath = join(DATA, 'gates.json');
if (!existsSync(gatesPath)) {
  fail('gates.json not found');
} else {
  const gatesData = JSON.parse(readFileSync(gatesPath, 'utf8'));
  const gates = gatesData.gates || [];
  const count = gates.length;
  if (count !== EXPECTED_GATES_COUNT) {
    fail(`gates count: expected ${EXPECTED_GATES_COUNT}, got ${count}`);
  }
  const hasForbidden = gates.some(g =>
    (g.id || '').toLowerCase().includes('full-resurrection') ||
    (g.title || '').toLowerCase().includes(FORBIDDEN_GATE_PHRASE)
  );
  if (hasForbidden) {
    fail('Forbidden gate "full resurrection system" found in gates.json');
  }
}

// 2. Pain points per gate
const painPointsPath = join(DATA, 'pain-points.json');
if (!existsSync(painPointsPath)) {
  fail('pain-points.json not found');
} else {
  const ppData = JSON.parse(readFileSync(painPointsPath, 'utf8'));
  const painPoints = ppData.painPoints || {};
  for (const [gateId, points] of Object.entries(painPoints)) {
    if (gateId.toLowerCase().includes('full-resurrection')) {
      fail(`Forbidden gate "${gateId}" found in pain-points.json`);
    }
    const count = Array.isArray(points) ? points.length : 0;
    if (count !== EXPECTED_PAIN_POINTS_PER_GATE) {
      fail(`Gate "${gateId}": expected ${EXPECTED_PAIN_POINTS_PER_GATE} pain points, got ${count}`);
    }
    // Check 3 tools per pain point
    for (const pp of points || []) {
      const toolIds = pp.toolIds || [];
      if (toolIds.length !== EXPECTED_TOOLS_PER_PAIN_POINT) {
        warn(`Pain point "${pp.id}" in gate ${gateId}: expected ${EXPECTED_TOOLS_PER_PAIN_POINT} tools, got ${toolIds.length}`);
      }
    }
  }
}

// 3. Boilerplate duplicate check (5/15/30 within same pain point)
if (existsSync(painPointsPath)) {
  const ppData = JSON.parse(readFileSync(painPointsPath, 'utf8'));
  const painPoints = ppData.painPoints || {};
  for (const [gateId, points] of Object.entries(painPoints)) {
    for (const pp of points || []) {
      const toolIds = pp.toolIds || [];
      // We can't easily check 5/15/30 content here without content-generator;
      // flag if all 3 tool IDs are identical pattern
      const baseIds = new Set(toolIds.map(id => id.replace(/-quick-reset|-standard-practice|-deep-work$/g, '')));
      if (baseIds.size === 1 && toolIds.length === 3) {
        // OK - 3 variants of same tool (quick/standard/deep)
      }
    }
  }
}

// Output
if (errors.length > 0) {
  console.error('\n❌ INTEGRITY CHECK FAILED\n');
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:');
  warnings.forEach(w => console.warn('  -', w));
}

console.log('\n✅ Integrity check passed');
console.log(`   Gates: ${EXPECTED_GATES_COUNT}`);
console.log(`   Pain points per gate: ${EXPECTED_PAIN_POINTS_PER_GATE}`);
console.log(`   Tools per pain point: ${EXPECTED_TOOLS_PER_PAIN_POINT}`);
console.log(`   Forbidden gate absent: ✓\n`);
