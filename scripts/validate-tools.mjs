#!/usr/bin/env node
/**
 * Validate tools against RYD rules (same as tool-content-validator.js).
 * Input: public/data/tools.pass.json (or --file path).
 * Output: exit 0 if all pass, 1 otherwise; prints counts and failing ids.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_FILE = path.join(ROOT, 'public', 'data', 'tools.pass.json');

const MIN_WORD_COUNT = 600;
const BOILERPLATE = [
  /helps you\. This practice supports/gi,
  /This practice supports emotional regulation/gi,
  /Use it when you need a clear, structured approach/gi,
  /coming soon|placeholder|tbd/gi
];

function parseArgs() {
  const a = process.argv.slice(2);
  let file = DEFAULT_FILE;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--file' && a[i + 1]) { file = a[i + 1]; i++; }
  }
  return { file };
}

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function extractContent(tool) {
  const parts = [];
  ['title', 'description', 'summary', 'problem', 'how_it_works', 'howWhyWorks', 'mechanism', 'where_it_came_from', 'origin'].forEach(f => {
    if (tool[f]) parts.push(tool[f]);
  });
  (tool.steps || []).forEach(s => parts.push(typeof s === 'string' ? s : (s.content || s.instruction || '')));
  (tool.walkthroughs || []).forEach(wt => (wt.steps || []).forEach(s => parts.push(typeof s === 'string' ? s : '')));
  return parts.join(' ');
}

function hasBoilerplate(content) {
  return content && BOILERPLATE.some(p => p.test(content));
}

function validateOne(tool) {
  const errors = [];
  if (!tool.title || !String(tool.title).trim()) errors.push('missing title');
  if (!tool.disclaimer || String(tool.disclaimer).trim().length < 20) errors.push('missing disclaimer');
  const how = tool.how_it_works || tool.howWhyWorks || tool.mechanism;
  if (!how || !String(how).trim()) errors.push('missing how_it_works');
  const where = tool.where_it_came_from || tool.origin;
  if (!where || !String(where).trim()) errors.push('missing where_it_came_from');
  const hasSteps = (tool.steps && tool.steps.length > 0) || (tool.walkthroughs && tool.walkthroughs.length > 0);
  if (!hasSteps) errors.push('missing steps');
  const content = extractContent(tool);
  const words = countWords(content);
  if (words < MIN_WORD_COUNT) errors.push(`word_count ${words} < ${MIN_WORD_COUNT}`);
  if (hasBoilerplate(content)) errors.push('boilerplate');
  return { valid: errors.length === 0, errors, wordCount: words };
}

function run() {
  const { file } = parseArgs();
  if (!fs.existsSync(file)) {
    console.error('[validate-tools] File not found:', file);
    process.exit(2);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const tools = Array.isArray(data.tools) ? data.tools : data;
  let pass = 0;
  const failing = [];
  for (const tool of tools) {
    const r = validateOne(tool);
    if (r.valid) pass++; else failing.push({ id: tool.id || tool.slug, errors: r.errors });
  }
  console.log('[validate-tools] Total:', tools.length, 'Pass:', pass, 'Fail:', failing.length);
  if (failing.length) {
    failing.slice(0, 20).forEach(f => console.log('  FAIL', f.id, f.errors));
    if (failing.length > 20) console.log('  ... and', failing.length - 20, 'more');
    process.exit(1);
  }
  process.exit(0);
}

run();
