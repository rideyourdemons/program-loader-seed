#!/usr/bin/env node
/**
 * Pre-Launch Audit — Ride Your Demons Platform
 * Verifies: 12 gates, pain points, 3 tools per pain point, Tool of Day, search, no mojibake
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');

const errors = [];
const warnings = [];

function loadJson(name) {
  const p = path.join(DATA, name);
  if (!fs.existsSync(p)) {
    errors.push(`Missing: ${name}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    errors.push(`${name}: ${e.message}`);
    return null;
  }
}

function checkMojibake(str, label) {
  if (!str || typeof str !== 'string') return;
  const bad = [/ÃƒÂ|â†|â€|ðŸ|â±|ï¸/];
  if (bad.some(p => p.test(str))) {
    warnings.push(`Possible mojibake in ${label}: ${str.substring(0, 50)}...`);
  }
}

console.log('\n=== RYD Pre-Launch Audit ===\n');

// 1. Gates (12 anchors)
const gatesData = loadJson('gates.json');
if (gatesData) {
  const gates = gatesData.gates || [];
  if (gates.length !== 12) {
    warnings.push(`Expected 12 gates, found ${gates.length}`);
  } else {
    console.log('✅ 12 gates present');
  }
  gates.forEach(g => checkMojibake(g.title, `gate ${g.id}`));
}

// 2. Pain points (4 per gate = 48, or 40 per gate)
const painData = loadJson('pain-points.json');
if (painData) {
  const pp = painData.painPoints || {};
  const gateIds = Object.keys(pp);
  let totalPP = 0;
  gateIds.forEach(gid => {
    const arr = pp[gid] || [];
    totalPP += arr.length;
    arr.forEach(p => {
      if (!Array.isArray(p.toolIds) || p.toolIds.length !== 3) {
        warnings.push(`Pain point ${p.id} has ${(p.toolIds || []).length} tools (expected 3)`);
      }
      checkMojibake(p.title, `pain point ${p.id}`);
    });
  });
  console.log(`✅ ${gateIds.length} gates, ${totalPP} pain points`);
  if (totalPP < 48) {
    warnings.push(`Total pain points: ${totalPP} (you mentioned 48 anchors)`);
  }
}

// 3. Tools — pain-point toolIds must exist in tools
const toolsCanonical = loadJson('tools-canonical.json');
const toolIds = new Set();
if (toolsCanonical && toolsCanonical.tools) {
  toolsCanonical.tools.forEach(t => {
    if (t && t.id) toolIds.add(t.id);
  });
  console.log(`✅ tools-canonical.json: ${toolsCanonical.tools.length} tools`);
}

// Check pain-point toolIds exist
if (painData && toolsCanonical) {
  const pp = painData.painPoints || {};
  const missing = new Set();
  Object.keys(pp).forEach(gid => {
    (pp[gid] || []).forEach(p => {
      (p.toolIds || []).forEach(tid => {
        if (!toolIds.has(tid)) missing.add(tid);
      });
    });
  });
  if (missing.size > 0) {
    errors.push(`Pain points reference ${missing.size} missing tools: ${[...missing].slice(0, 5).join(', ')}${missing.size > 5 ? '...' : ''}`);
  } else {
    console.log('✅ All pain-point toolIds found in tools');
  }
}

// 4. Search bar — no mojibake in insights.html
const insightsPath = path.join(ROOT, 'public', 'insights.html');
if (fs.existsSync(insightsPath)) {
  const html = fs.readFileSync(insightsPath, 'utf8');
  if (/searchInput|search-input/.test(html)) {
    console.log('✅ Search input present in insights.html');
  }
  if (html.includes('Search for depression, anxiety, stress')) {
    console.log('✅ Search placeholder is clean English');
  }
  if (/ÃƒÂ|â†|ðŸ|â±/.test(html)) {
    warnings.push('insights.html may contain mojibake — review manually');
  }
}

// 5. Tool of the Day
if (fs.existsSync(insightsPath)) {
  const html = fs.readFileSync(insightsPath, 'utf8');
  if (html.includes('updateToolOfDay') && html.includes('getToolOfTheDay')) {
    console.log('✅ Tool of the Day rotation logic present');
  }
}

// 6. 5/15/30 min workthroughs (walkthroughs array or duration field)
if (toolsCanonical && toolsCanonical.tools) {
  const withWalkthroughs = toolsCanonical.tools.filter(t => {
    if (t.walkthroughs && Array.isArray(t.walkthroughs) && t.walkthroughs.length >= 3) return true;
    return t.duration && /5|15|30/.test(String(t.duration));
  });
  console.log(`✅ ${withWalkthroughs.length} tools with 5/15/30 min workthroughs`);
}

// Summary
console.log('\n--- Summary ---');
if (errors.length > 0) {
  console.error('\n❌ ERRORS:');
  errors.forEach(e => console.error('  ', e));
}
if (warnings.length > 0) {
  console.warn('\n⚠️ WARNINGS:');
  warnings.forEach(w => console.warn('  ', w));
}
if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ Pre-launch audit PASSED — no issues found.');
} else if (errors.length === 0) {
  console.log('\n⚠️ Pre-launch audit passed with warnings. Review before going live.');
} else {
  console.log('\n❌ Pre-launch audit FAILED. Fix errors before going live.');
  process.exit(1);
}
