#!/usr/bin/env node
/**
 * RYD Compressed Format — Reduces tool content ~50%, line-based, max 12–14 words/sentence.
 * Adds rydCompressed to each tool: outcome, reset5, stabilize15, rebuild30, readMore.
 * Long content moved to readMore; not deleted.
 *
 * Usage: node scripts/compress-tools-ryd.mjs [--dry-run] [--limit N] [--out tools.ryd.pass.json]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const PASS_PATH = path.join(DATA_DIR, 'tools.pass.json');

const MAX_WORDS_PER_SENTENCE = 14;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: false, limit: null, outFile: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') out.dryRun = true;
    else if (args[i] === '--limit' && args[i + 1]) { out.limit = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--out' && args[i + 1]) { out.outFile = args[i + 1]; i++; }
  }
  return out;
}

/** Cap sentence to ~12–14 words; keep meaning. */
function shortenSentence(text, maxWords = MAX_WORDS_PER_SENTENCE) {
  if (!text || typeof text !== 'string') return '';
  const t = text.trim();
  if (!t) return '';
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return t;
  return words.slice(0, maxWords).join(' ') + (t.endsWith('.') ? '' : '.');
}

/** Turn long paragraph into first sentence (short) + rest in readMore. */
function firstLineOnly(paragraph, maxWords = MAX_WORDS_PER_SENTENCE) {
  if (!paragraph || typeof paragraph !== 'string') return '';
  const trimmed = paragraph.trim();
  const first = trimmed.split(/\n\n|\n/)[0] || trimmed;
  return shortenSentence(first.replace(/#{1,6}\s*/g, ''), maxWords);
}

/** Get 5-min walkthrough (first that looks like 5 min). */
function getWalk5(tool) {
  const w = tool.walkthroughs || [];
  return w.find(wt => /5|quick|5\s*min/i.test(wt.title || '')) || w[0];
}

/** Get 15-min walkthrough. */
function getWalk15(tool) {
  const w = tool.walkthroughs || [];
  return w.find(wt => /15|standard|15\s*min/i.test(wt.title || '')) || w[1] || w[0];
}

/** Get 30-min walkthrough. */
function getWalk30(tool) {
  const w = tool.walkthroughs || [];
  return w.find(wt => /30|deep|30\s*min/i.test(wt.title || '')) || w[2] || w[0];
}

/** Expand or trim steps array to target length; each step shortened. */
function toSteps(steps, targetLen, fallbackStep = 'Notice what you feel.') {
  if (!Array.isArray(steps)) steps = [];
  const out = steps.slice(0, targetLen).map(s => shortenSentence(String(s)));
  while (out.length < targetLen) {
    out.push(out.length === targetLen - 1 ? 'Notice how you feel.' : fallbackStep);
  }
  return out.slice(0, targetLen);
}

/** Build one-line outcome from summary or title. */
function outcomeLine(tool) {
  const raw = tool.summary || tool.problem || tool.title || '';
  const first = raw.split(/\.\s+/)[0] || raw;
  return shortenSentence(first.replace(/\s*\.\.\.\s*$/, '').trim());
}

/** Build RYD compressed block for one tool. */
function buildRydCompressed(tool) {
  const title = tool.title || tool.name || 'Tool';
  const wt5 = getWalk5(tool);
  const wt15 = getWalk15(tool);
  const wt30 = getWalk30(tool);
  const steps5 = (wt5 && wt5.steps) ? wt5.steps : (tool.steps || []).slice(0, 3);
  const steps15 = (wt15 && wt15.steps) ? wt15.steps : (tool.steps || []).slice(0, 5);
  const steps30 = (wt30 && wt30.steps) ? wt30.steps : (tool.steps || []).slice(0, 7);

  const reset5 = {
    goal: shortenSentence(steps5[0] || 'Pause and reset in a few minutes.'),
    do: toSteps(steps5, 3, 'Notice how you feel.'),
    done: shortenSentence('You completed a quick reset.')
  };
  const stabilize15 = {
    goal: shortenSentence(steps15[0] || 'Stabilize with clear steps.'),
    do: toSteps(steps15, 5, 'Notice what shifts.'),
    check: [
      shortenSentence('Did you complete the steps?'),
      shortenSentence('What will you do next?')
    ]
  };
  const rebuild30 = {
    goal: shortenSentence(steps30[0] || 'Rebuild with a clear plan.'),
    do: toSteps(steps30, 7, 'Take the next step.'),
    plan: [
      shortenSentence('One action today.'),
      shortenSentence('One check-in tomorrow.'),
      shortenSentence('One support to reach out to.')
    ],
    save: shortenSentence('Save one action for later.')
  };

  const fullText = String(tool.content || tool.description || '').trim();
  const howWhy = String(tool.howWhyWorks || '').trim();
  const origin = String(tool.origin || tool.where_it_came_from || '').trim();
  const readMoreParts = [];
  if (fullText.length > 100) readMoreParts.push(fullText);
  if (howWhy.length > 0 && !fullText.includes(howWhy.slice(0, 50))) readMoreParts.push('## How & Why It Works\n\n' + howWhy);
  if (origin.length > 0 && !fullText.includes(origin.slice(0, 30))) readMoreParts.push('## Where It Came From\n\n' + origin);
  const readMore = readMoreParts.length ? readMoreParts.join('\n\n') : null;

  return {
    outcome: outcomeLine(tool),
    reset5,
    stabilize15,
    rebuild30,
    readMore: readMore || undefined
  };
}

function run() {
  const opts = parseArgs();
  const outPath = opts.outFile ? path.resolve(ROOT, opts.outFile) : PASS_PATH;

  if (!fs.existsSync(PASS_PATH)) {
    console.error('[compress-tools-ryd] Not found:', PASS_PATH);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(PASS_PATH, 'utf8'));
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const limit = opts.limit ? Math.min(opts.limit, tools.length) : tools.length;

  let added = 0;
  for (let i = 0; i < limit; i++) {
    const tool = tools[i];
    if (!tool) continue;
    tool.rydCompressed = buildRydCompressed(tool);
    added++;
  }

  if (opts.dryRun) {
    console.log('[compress-tools-ryd] Dry run: would add rydCompressed to', added, 'tools.');
    if (tools[0] && tools[0].rydCompressed) {
      console.log('[compress-tools-ryd] Sample (first tool):', JSON.stringify(tools[0].rydCompressed, null, 2).slice(0, 800) + '...');
    }
    return;
  }

  const outData = opts.outFile && limit < tools.length
    ? { ...data, tools: tools.slice(0, limit) }
    : { ...data, tools };
  fs.writeFileSync(outPath, JSON.stringify(outData, null, 2), 'utf8');
  console.log('[compress-tools-ryd] Wrote rydCompressed for', added, 'tools to', outPath);
}

run();
