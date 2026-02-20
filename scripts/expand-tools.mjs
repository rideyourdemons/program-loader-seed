#!/usr/bin/env node
/**
 * Batch run Tool Content Expander.
 * Loads tools from public/data/tools.json, expands each, logs report.
 *
 * Usage: node scripts/expand-tools.mjs [--sample N] [--out path]
 *   --sample N   Process only first N tools (default: all)
 *   --out path   Write expanded tools to JSON file
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { toolContentExpander, expandToolsBatch, countWords } from '../core/tools/tool-content-expander.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const sampleIdx = args.indexOf('--sample');
const sampleN = sampleIdx >= 0 ? parseInt(args[sampleIdx + 1], 10) : null;
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

const toolsPath = join(ROOT, 'public', 'data', 'tools.json');
let data;
try {
  data = JSON.parse(readFileSync(toolsPath, 'utf8'));
} catch (e) {
  console.error('Failed to load tools.json:', e.message);
  process.exit(1);
}

const raw = Array.isArray(data) ? data : (data.tools || []);
let tools = raw;
if (sampleN != null && sampleN > 0) {
  tools = raw.slice(0, sampleN);
  console.log(`Processing sample of ${tools.length} tools`);
}

const log = (msg) => console.log(msg);
const expanded = expandToolsBatch(tools, { log });

if (expanded.length > 0) {
  const sample = expanded[0];
  const sampleContent = [
    sample.purpose,
    sample.problem,
    sample.mechanism,
    sample.how_it_works,
    sample.where_it_came_from,
    (sample.steps || []).join(' '),
  ].join(' ');
  console.log(`Sample tool "${sample.title}" word count: ${countWords(sampleContent)}`);
}

if (outPath) {
  const output = { version: '1.0', expanded: true, tools: expanded };
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Wrote ${expanded.length} expanded tools to ${outPath}`);
}
