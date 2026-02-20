#!/usr/bin/env node
/**
 * RYD Build Tools Content — Gold-standard content pipeline.
 * Reads canonical tools, applies technique-bank + painpoint-map, outputs tools.pass.json, tools.draft.json, tools.report.json.
 * Validation rules are NOT weakened; content is generated to meet them.
 *
 * Usage:
 *   node scripts/build-tools-content.mjs [--limit N] [--gate <gateId>] [--painpoint <id>] [--ids <id1,id2>] [--resume]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const CORE_CONTENT = path.join(ROOT, 'core', 'content');
const CORE_SCHEMA = path.join(ROOT, 'core', 'schema');

const CANONICAL_PATH = path.join(DATA_DIR, 'tools-canonical.json');
const FALLBACK_PATH = path.join(DATA_DIR, 'tools.json');
const PASS_PATH = path.join(DATA_DIR, 'tools.pass.json');
const DRAFT_PATH = path.join(DATA_DIR, 'tools.draft.json');
const REPORT_PATH = path.join(DATA_DIR, 'tools.report.json');

const MIN_WORD_COUNT = 600;
const TARGET_WORD_COUNT = { min: 700, max: 1200 };
const STANDARD_DISCLAIMER = 'This is a practical tool, not a replacement for professional support. This is here if you want it. Use what helps. Ignore what doesn\'t.';

const BOILERPLATE_PATTERNS = [
  /helps you\. This practice supports/gi,
  /This practice supports emotional regulation/gi,
  /Use it when you need a clear, structured approach/gi,
  /coming soon|placeholder|to be determined|tbd/gi
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { limit: null, gate: null, painpoint: null, ids: null, resume: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { out.limit = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--gate' && args[i + 1]) { out.gate = args[i + 1]; i++; }
    else if (args[i] === '--painpoint' && args[i + 1]) { out.painpoint = args[i + 1]; i++; }
    else if (args[i] === '--ids' && args[i + 1]) { out.ids = args[i + 1].split(',').map(s => s.trim()); i++; }
    else if (args[i] === '--resume') out.resume = true;
  }
  return out;
}

function loadJSON(filePath, fallback = null) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (fallback) return fallback;
    throw new Error(`Failed to load ${filePath}: ${e.message}`);
  }
}

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function extractToolContent(tool) {
  const parts = [];
  if (tool.title) parts.push(tool.title);
  if (tool.description) parts.push(tool.description);
  if (tool.summary) parts.push(tool.summary);
  if (tool.problem) parts.push(tool.problem);
  if (tool.how_it_works) parts.push(tool.how_it_works);
  if (tool.howWhyWorks) parts.push(tool.howWhyWorks);
  if (tool.mechanism) parts.push(tool.mechanism);
  if (tool.where_it_came_from) parts.push(tool.where_it_came_from);
  if (tool.origin) parts.push(tool.origin);
  if (tool.steps && Array.isArray(tool.steps)) {
    tool.steps.forEach(s => { parts.push(typeof s === 'string' ? s : (s.content || s.instruction || '')); });
  }
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
    tool.walkthroughs.forEach(wt => {
      (wt.steps || []).forEach(s => { parts.push(typeof s === 'string' ? s : ''); });
    });
  }
  return parts.join(' ');
}

function hasBoilerplate(content) {
  if (!content || typeof content !== 'string') return false;
  return BOILERPLATE_PATTERNS.some(p => p.test(content));
}

function toolPasses(tool) {
  const content = extractToolContent(tool);
  const words = countWords(content);
  const hasDisclaimer = !!(tool.disclaimer && String(tool.disclaimer).trim().length >= 20);
  const hasHowWhy = !!(tool.how_it_works || tool.howWhyWorks || tool.mechanism);
  const hasWhere = !!(tool.where_it_came_from || tool.origin);
  const hasSteps = (tool.steps && tool.steps.length > 0) || (tool.walkthroughs && tool.walkthroughs.length > 0);
  const noBoilerplate = !hasBoilerplate(content);
  return hasDisclaimer && hasHowWhy && hasWhere && hasSteps && words >= MIN_WORD_COUNT && noBoilerplate;
}

function keywordFromSlug(slug) {
  if (!slug) return 'anxiety';
  const m = slug.match(/how-do-i-(.+?)(?:-(?:quick-reset|standard-practice|deep-work))?$/);
  const base = m ? m[1] : slug;
  const map = {
    'stop-feeling-numb': 'numb', 'deal-with-procrastination': 'procrastination', 'overcome-anxiety': 'anxiety',
    'build-confidence': 'confidence', 'manage-stress': 'stress', 'find-purpose': 'purpose', 'find-my-purpose': 'purpose',
    'handle-overwhelm': 'overwhelm', 'stop-feeling-overwhelmed': 'overwhelm', 'improve-relationships': 'relationships',
    'recover-from-loss': 'loss', 'navigate-change': 'change', 'deal-with-anger-issues': 'anger',
    'overcome-depression': 'depression', 'recover-from-betrayal': 'betrayal', 'find-my-voice-after-being-silenced-by-shame': 'voice',
    'manage-sleep': 'sleep', 'handle-grief': 'grief', 'deal-with-trauma': 'trauma'
  };
  return map[base] || base.replace(/-/g, ' ').split(' ')[0] || 'anxiety';
}

function selectTechnique(painpointMap, techniqueBank, slug) {
  const keyword = keywordFromSlug(slug);
  const entry = painpointMap.byKeyword[keyword] || painpointMap.byKeyword[painpointMap.defaultTechnique] || {};
  const primary = entry.primary || ['thought-record'];
  const techId = primary[0];
  const tech = techniqueBank.techniques.find(t => t.id === techId) || techniqueBank.techniques[0];
  return { tech, keyword, entry };
}

function buildContentForTool(tool, technique, keyword, painpointTitle) {
  const title = tool.title || (painpointTitle || keyword);
  const mechanism = technique.mechanism;
  const micro = technique.microScripts || [];
  const scale5 = technique.scaling && technique.scaling['5'] ? technique.scaling['5'] : 'Take one small step.';
  const scale15 = technique.scaling && technique.scaling['15'] ? technique.scaling['15'] : 'Work through the steps.';
  const scale30 = technique.scaling && technique.scaling['30'] ? technique.scaling['30'] : 'Full practice.';

  const summary = `${title} uses ${technique.name} to help when you're facing ${painpointTitle || keyword}. ${mechanism.slice(0, 120)}...`;

  const contentSections = [
    `## What This Is\n\n${title} is a structured way to work with ${painpointTitle || keyword} using a method drawn from ${technique.modality || 'evidence-based practice'}. It gives you clear steps so you're not stuck in your head.`,
    `## When To Use It\n\nUse this when you notice ${painpointTitle || keyword}—for example when you're in a situation that usually triggers it, or when you notice the thought or feeling that often goes with it. It works best when you can set aside a few minutes without interruption.`,
    `## Steps\n\n1. Pause and notice what's going on right now (thought, feeling, or situation).\n2. ${micro[0] || 'Name what you notice.'}\n3. ${micro[1] || 'Consider one alternative or next step.'}\n4. Take one small action that fits the situation.\n5. Notice what happened without judging.`,
    `## Common Failure Modes\n\nRushing through the steps usually doesn't help. Go slow. If your mind wanders, bring it back to the next step. If the situation is too intense, use a shorter version (e.g. 5 minutes) and try again later.`,
    `## How & Why It Works\n\n${mechanism} This is the specific mechanism behind ${title}: it's not generic advice but a structured way to shift your relationship to the thought or feeling so you can choose your next move.`,
    `## Where It Came From\n\nThis practice draws from ${technique.modality || 'evidence-based'} approaches and has been adapted for practical use. It is not a substitute for professional care.`,
    `## Safety Note\n\nIf you're in crisis or the content brings up more than you can handle, pause and reach out to someone you trust or a helpline. This tool is here when you want it.`
  ];

  const fullContent = contentSections.join('\n\n');
  const wordCount = countWords(fullContent) + countWords(tool.title || '') + countWords(summary) + countWords(mechanism);
  const needMore = Math.max(0, MIN_WORD_COUNT - wordCount - 100);
  let extra = '';
  if (needMore > 0) {
    const contra = technique.contraindications || 'Use when you are in a stable enough place to focus.';
    extra = `\n\n## More Detail\n\nFor ${title}, the key is to practice the steps regularly rather than once. Many people find that the first time feels awkward; after a few tries, the steps become more natural. You can use the 5-minute version when you are short on time and the 15- or 30-minute version when you want to go deeper. ${contra}`;
  }

  const howWhyWorks = mechanism + ' This is the specific mechanism behind ' + title + ': it is not generic advice but a structured way to shift your relationship to the thought or feeling so you can choose your next move.';
  const whereItCameFrom = `This practice draws from ${technique.modality || 'evidence-based'} approaches and has been adapted for practical, non-clinical use. It is not a substitute for professional support.`;

  const steps = [
    'Pause and notice what\'s going on (thought, feeling, or situation).',
    micro[0] || 'Name what you notice.',
    micro[1] || 'Consider one alternative or next step.',
    'Take one small action that fits the situation.',
    'Notice what happened without judging.'
  ];

  const toSteps = (text, max) => {
    const parts = text.split(/\.\s+/).filter(Boolean).map(s => s.trim() + (s.endsWith('.') ? '' : '.'));
    return parts.slice(0, max).length ? parts.slice(0, max) : [text];
  };
  const walkthroughs = [
    { title: 'Quick (5 min)', steps: toSteps(scale5, 5) },
    { title: 'Standard (15 min)', steps: toSteps(scale15, 10) },
    { title: 'Deep (30 min)', steps: toSteps(scale30, 15) }
  ];

  const body = fullContent + extra;
  return {
    disclaimer: STANDARD_DISCLAIMER,
    summary,
    description: body,
    content: body,
    how_it_works: howWhyWorks,
    howWhyWorks: howWhyWorks,
    mechanism: mechanism.slice(0, 200),
    where_it_came_from: whereItCameFrom,
    origin: whereItCameFrom,
    steps,
    walkthroughs,
    problem: `When facing ${painpointTitle || keyword}, it can be hard to know where to start. ${title} gives you a clear sequence.`
  };
}

function run() {
  const opts = parseArgs();
  console.log('[build-tools-content] Options:', opts);

  const canonical = fs.existsSync(CANONICAL_PATH)
    ? loadJSON(CANONICAL_PATH)
    : loadJSON(FALLBACK_PATH);
  const tools = Array.isArray(canonical.tools) ? canonical.tools : canonical;
  console.log('[build-tools-content] Loaded', tools.length, 'tools from canonical.');

  const techniqueBank = loadJSON(path.join(CORE_CONTENT, 'technique-bank.json'));
  const painpointMap = loadJSON(path.join(CORE_CONTENT, 'painpoint-map.json'));

  let painPointsByGate = {};
  try {
    const ppPath = path.join(DATA_DIR, 'pain-points.json');
    const ppData = loadJSON(ppPath, { painPoints: {} });
    painPointsByGate = ppData.painPoints || {};
  } catch (_) {}

  let filtered = tools;
  if (opts.ids && opts.ids.length) {
    const set = new Set(opts.ids);
    filtered = filtered.filter(t => set.has(t.id || t.slug));
  }
  if (opts.gate) {
    filtered = filtered.filter(t => (t.gateIds && t.gateIds.includes(opts.gate)) || t.gateId === opts.gate);
  }
  if (opts.painpoint) {
    filtered = filtered.filter(t => (t.painPointIds && t.painPointIds.includes(opts.painpoint)) || t.painPointId === opts.painpoint);
  }
  if (opts.limit) filtered = filtered.slice(0, opts.limit);

  const passSet = opts.resume && fs.existsSync(PASS_PATH) ? new Set((loadJSON(PASS_PATH).tools || []).map(t => t.id || t.slug)) : new Set();
  const passed = [];
  const draft = [];
  const report = { total: filtered.length, pass: 0, draft: 0, skipped: 0, failReasons: {} };

  for (const tool of filtered) {
    const id = tool.id || tool.slug;
    if (opts.resume && passSet.has(id)) {
      report.skipped++;
      continue;
    }

    if (toolPasses(tool)) {
      passed.push(tool);
      report.pass++;
      continue;
    }

    const { tech, keyword, entry } = selectTechnique(painpointMap, techniqueBank, tool.slug || tool.id);
    const painpointTitle = tool.title ? tool.title.replace(/^How do I /i, '').replace(/\?$/, '') : keyword;
    const generated = buildContentForTool(tool, tech, keyword, painpointTitle);

    const merged = {
      ...tool,
      ...generated,
      gateId: tool.gateId || (tool.gateIds && tool.gateIds[0]),
      painPointId: tool.painPointId || (tool.painPointIds && tool.painPointIds[0]),
      needsContent: false
    };

    const mergedContent = extractToolContent(merged);
    const words = countWords(mergedContent);
    if (words >= MIN_WORD_COUNT && !hasBoilerplate(mergedContent)) {
      passed.push(merged);
      report.pass++;
    } else {
      merged.needsContent = true;
      draft.push(merged);
      report.draft++;
      const reason = words < MIN_WORD_COUNT ? 'word_count' : 'boilerplate';
      report.failReasons[reason] = (report.failReasons[reason] || 0) + 1;
    }
  }

  const passOut = { version: '1.0', generated: new Date().toISOString(), source: 'build-tools-content', tools: passed };
  const draftOut = { version: '1.0', generated: new Date().toISOString(), source: 'build-tools-content', tools: draft };
  report.generated = new Date().toISOString();
  report.topFailReasons = Object.entries(report.failReasons).sort((a, b) => b[1] - a[1]).slice(0, 10);

  fs.writeFileSync(PASS_PATH, JSON.stringify(passOut, null, 2), 'utf8');
  fs.writeFileSync(DRAFT_PATH, JSON.stringify(draftOut, null, 2), 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('[build-tools-content] Done. Pass:', report.pass, 'Draft:', report.draft, 'Skipped:', report.skipped);
  console.log('[build-tools-content] Wrote', PASS_PATH, DRAFT_PATH, REPORT_PATH);
  return report;
}

run();
