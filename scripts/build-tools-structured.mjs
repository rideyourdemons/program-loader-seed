#!/usr/bin/env node
/**
 * Build structured tools data for dynamic rendering.
 *
 * Input:  public/data/tools.pass.json
 * Output: public/data/tools.structured.json
 *
 * Does NOT delete any existing tool fields.
 * Adds: outcome, reset, stabilize, rebuild, deep
 *
 * Schema per tool:
 *   title, outcome, reset, stabilize, rebuild, deep
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');

const IN_PATH = path.join(DATA_DIR, 'tools.pass.json');
const OUT_PATH = path.join(DATA_DIR, 'tools.structured.json');

function normArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean).map(String);
  return [String(x)];
}

function pickWalkthrough(tool, pattern) {
  const wts = Array.isArray(tool?.walkthroughs) ? tool.walkthroughs : [];
  return wts.find((w) => pattern.test(String(w?.title || ''))) || null;
}

function buildStructured(tool) {
  const outcome = tool.outcome || tool.summary || tool.problem || '';

  const baseSteps = normArray(tool.steps);
  const wt5 = pickWalkthrough(tool, /5|min|quick/i);
  const wt15 = pickWalkthrough(tool, /15|min|standard/i);
  const wt30 = pickWalkthrough(tool, /30|min|deep/i);

  const resetSteps = normArray(wt5?.steps).length ? normArray(wt5.steps) : baseSteps.slice(0, 3);
  const stabilizeSteps = normArray(wt15?.steps).length ? normArray(wt15.steps) : baseSteps.slice(0, 5);
  const rebuildSteps = normArray(wt30?.steps).length ? normArray(wt30.steps) : baseSteps.slice(0, 7);

  const reset = tool.reset || {
    goal: resetSteps[0] || '',
    do: resetSteps.slice(0, 3),
    done: ''
  };

  const stabilize = tool.stabilize || {
    goal: stabilizeSteps[0] || '',
    do: stabilizeSteps.slice(0, 5),
    check: []
  };

  const rebuild = tool.rebuild || {
    goal: rebuildSteps[0] || '',
    do: rebuildSteps.slice(0, 7),
    plan: [],
    save: ''
  };

  const deep = tool.deep || tool.content || tool.description || '';

  return {
    title: tool.title || tool.name || tool.id,
    outcome,
    reset,
    stabilize,
    rebuild,
    deep
  };
}

function run() {
  if (!fs.existsSync(IN_PATH)) {
    console.error('[build-tools-structured] Missing input:', IN_PATH);
    process.exit(1);
  }
  const raw = fs.readFileSync(IN_PATH, 'utf8');
  const data = JSON.parse(raw);
  const tools = Array.isArray(data.tools) ? data.tools : [];

  const structuredTools = tools.map((t) => ({
    ...t,
    ...buildStructured(t)
  }));

  const out = {
    version: data.version || '1.0',
    generated: new Date().toISOString(),
    source: 'build-tools-structured',
    tools: structuredTools
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log('[build-tools-structured] Wrote', structuredTools.length, 'tools to', OUT_PATH);
}

run();

