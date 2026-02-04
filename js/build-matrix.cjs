/**
 * Build SEO Matrix
 *
 * Generates public/matrix/seo-matrix.json from canonical tools data.
 * Uses __dirname so it works from any working directory.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const MATRIX_DIR = path.join(PUBLIC_DIR, 'matrix');

const TOOLS_CANONICAL_FILE = path.join(DATA_DIR, 'tools-canonical.json');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
const OUTPUT_FILE = path.join(MATRIX_DIR, 'seo-matrix.json');

const isDev = process.argv.includes('--dev');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadTools() {
  if (fs.existsSync(TOOLS_CANONICAL_FILE)) {
    const data = readJson(TOOLS_CANONICAL_FILE);
    if (Array.isArray(data.tools)) return data.tools;
    if (Array.isArray(data)) return data;
  }
  if (fs.existsSync(TOOLS_FILE)) {
    const data = readJson(TOOLS_FILE);
    if (Array.isArray(data.tools)) return data.tools;
    if (Array.isArray(data)) return data;
  }
  return [];
}

function pickToolOfTheDay(tools, existingToolOfTheDay) {
  if (existingToolOfTheDay && existingToolOfTheDay.id) {
    const match = tools.find(t => t && (t.id === existingToolOfTheDay.id || t.slug === existingToolOfTheDay.id));
    if (match) return normalizeTool(match);
  }
  const first = tools.find(Boolean);
  if (first) return normalizeTool(first);
  return {
    id: 'grounding-reset',
    title: 'Grounding Reset',
    description: 'A short reset to calm your nervous system and regain focus.',
    duration: '5 minutes',
    difficulty: 'beginner',
    category: 'anxiety',
    cta: '/tools/grounding-reset',
    summary: 'Calm your body and mind in under 5 minutes.',
    slug: 'grounding-reset'
  };
}

function normalizeTool(tool) {
  if (!tool || typeof tool !== 'object') return null;
  const id = tool.id || tool.slug;
  const title = tool.title || tool.name || id;
  return {
    id,
    name: tool.name || title,
    title,
    description: tool.description || '',
    duration: tool.duration || '',
    difficulty: tool.difficulty || '',
    category: tool.category || '',
    summary: tool.summary || '',
    cta: tool.cta || (id ? `/tools/${id}` : ''),
    slug: tool.slug || id,
    gateIds: Array.isArray(tool.gateIds) ? tool.gateIds : [],
    painPointIds: Array.isArray(tool.painPointIds) ? tool.painPointIds : [],
    keywords: Array.isArray(tool.keywords) ? tool.keywords : [],
    walkthroughs: Array.isArray(tool.walkthroughs) ? tool.walkthroughs : [],
    howWhyWorks: tool.howWhyWorks || '',
    citations: Array.isArray(tool.citations) ? tool.citations : []
  };
}

function buildMatrix() {
  if (isDev) {
    console.log('[BUILD] Matrix build running in dev mode');
  }
  console.log('[BUILD] Building SEO matrix...\n');

  if (!fs.existsSync(MATRIX_DIR)) {
    fs.mkdirSync(MATRIX_DIR, { recursive: true });
  }

  const tools = loadTools();
  console.log(`[BUILD] Loaded ${tools.length} tools`);

  let existing = null;
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = readJson(OUTPUT_FILE);
    } catch (error) {
      console.warn('[BUILD] Existing seo-matrix.json is invalid JSON, regenerating.');
    }
  }

  const normalizedTools = tools.map(normalizeTool).filter(Boolean);
  const toolOfTheDay = pickToolOfTheDay(normalizedTools, existing?.toolOfTheDay);

  const matrix = {
    version: '1.0',
    generated: new Date().toISOString(),
    toolOfTheDay,
    tools: normalizedTools
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(matrix, null, 2), 'utf8');

  console.log('\n===== MATRIX BUILD COMPLETE =====');
  console.log(`Tools: ${normalizedTools.length}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('=================================\n');

  return matrix;
}

if (require.main === module) {
  try {
    buildMatrix();
  } catch (error) {
    console.error('[BUILD] Error building matrix:', error);
    process.exit(1);
  }
}

module.exports = { buildMatrix };
