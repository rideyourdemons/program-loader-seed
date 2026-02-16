#!/usr/bin/env node
/**
 * PHASE 1: Duplication Report
 * Scans tools-canonical.json for identical/near-identical 5/15/30 workthrough patterns.
 */
import fs from 'fs';
import path from 'path';

const toolsPath = path.join(process.cwd(), 'public/data/tools-canonical.json');

const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
const tools = data.tools || [];

const stepSignatures = { '5': new Map(), '15': new Map(), '30': new Map() };
const boilerplatePhrases = [
  'Take a moment to pause and notice',
  'Identify one specific thing you can do',
  'Find a quiet space where you can focus',
  'Take three slow breaths',
  'Set aside 30 minutes',
  'Begin with five minutes of quiet breathing',
  'Break it down into smaller',
  'Reflect on what you learned',
  'Acknowledge your effort and commitment'
];

tools.forEach((t, idx) => {
  const w = t.walkthroughs || [];
  [0, 1, 2].forEach((i) => {
    const steps = (w[i] && w[i].steps) ? w[i].steps.join(' ') : '';
    const sig = steps.trim();
    const dur = ['5', '15', '30'][i];
    const map = stepSignatures[dur];
    const count = map.get(sig) || 0;
    map.set(sig, count + 1);
  });
});

console.log('\n=== RYD WORKTHROUGH DUPLICATION REPORT ===\n');
console.log('Total tools:', tools.length);
console.log('\n5-min unique step patterns:', stepSignatures['5'].size);
console.log('15-min unique step patterns:', stepSignatures['15'].size);
console.log('30-min unique step patterns:', stepSignatures['30'].size);

const dup5 = [...stepSignatures['5'].entries()].filter(([, c]) => c > 1);
const dup15 = [...stepSignatures['15'].entries()].filter(([, c]) => c > 1);
const dup30 = [...stepSignatures['30'].entries()].filter(([, c]) => c > 1);

console.log('\nDuplicate 5-min patterns (shared by >1 tool):', dup5.length);
console.log('Duplicate 15-min patterns:', dup15.length);
console.log('Duplicate 30-min patterns:', dup30.length);

if (dup5.length > 0) {
  const [sig, count] = dup5[0];
  console.log('\nMost duplicated 5-min (sample):', count, 'tools share this pattern');
  console.log('First 120 chars:', sig.substring(0, 120) + '...');
}

console.log('\nBoilerplate phrase occurrence:');
boilerplatePhrases.forEach(phrase => {
  let total = 0;
  tools.forEach(t => {
    const w = t.walkthroughs || [];
    w.forEach(wt => {
      const text = (wt.steps || []).join(' ');
      if (text.includes(phrase)) total++;
    });
  });
  console.log(`  "${phrase.substring(0, 40)}..." : ${total} occurrences`);
});

console.log('\n=== END REPORT ===\n');
