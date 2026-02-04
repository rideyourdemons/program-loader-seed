/**
 * Build Resonance Registry (Draft-Only)
 *
 * Generates:
 * - public/matrix/resonance-nodes.json (node registry + scores)
 * - public/matrix/resonance-drafts.json (link adjustments + expansion drafts)
 *
 * RYD Governance:
 * - No auto-publishing
 * - Drafts are proposals only
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const MATRIX_DIR = path.join(PUBLIC_DIR, 'matrix');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');

const FILES = {
  gates: path.join(DATA_DIR, 'gates.json'),
  painPoints: path.join(DATA_DIR, 'pain-points.json'),
  toolsCanonical: path.join(DATA_DIR, 'tools-canonical.json'),
  tools: path.join(DATA_DIR, 'tools.json'),
  insights: path.join(DATA_DIR, 'insights.json'),
  signalsJson: path.join(LOGS_DIR, 'matrix-signals.json'),
  signalsJsonl: path.join(LOGS_DIR, 'matrix-signals.jsonl'),
  ga4Aggregate: path.join(LOGS_DIR, 'ga4-aggregate.json')
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeReadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return readJson(filePath);
  } catch (error) {
    console.warn(`[RESONANCE] Failed to read ${filePath}:`, error.message);
    return fallback;
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTool(tool) {
  if (!tool) return null;
  const id = tool.id || tool.slug || normalizeKey(tool.title || tool.name);
  if (!id) return null;
  return {
    id,
    slug: tool.slug || id,
    title: tool.title || tool.name || id,
    description: tool.description || tool.summary || '',
    gateIds: Array.isArray(tool.gateIds) ? tool.gateIds : [],
    painPointIds: Array.isArray(tool.painPointIds) ? tool.painPointIds : [],
    keywords: Array.isArray(tool.keywords) ? tool.keywords : [],
    source: tool.source || 'tools'
  };
}

function mergeTool(primary, secondary) {
  if (!secondary) return primary;
  const merged = { ...secondary, ...primary };
  Object.keys(secondary).forEach((key) => {
    const current = merged[key];
    if (current == null || current === '' || (Array.isArray(current) && current.length === 0)) {
      merged[key] = secondary[key];
    }
  });
  return merged;
}

function loadTools() {
  const canonical = safeReadJson(FILES.toolsCanonical, { tools: [] });
  const fallback = safeReadJson(FILES.tools, { tools: [] });
  const tools = [];

  (canonical.tools || []).forEach((tool) => tools.push(normalizeTool(tool)));
  (fallback.tools || []).forEach((tool) => tools.push(normalizeTool(tool)));

  const map = new Map();
  tools.filter(Boolean).forEach((tool) => {
    const key = normalizeKey(tool.slug || tool.id || tool.title);
    if (!key) return;
    const existing = map.get(key);
    map.set(key, existing ? mergeTool(existing, tool) : tool);
  });

  return Array.from(map.values());
}

function loadSignals() {
  const signals = [];

  const jsonSignals = safeReadJson(FILES.signalsJson, []);
  if (Array.isArray(jsonSignals)) {
    signals.push(...jsonSignals);
  }

  if (fs.existsSync(FILES.signalsJsonl)) {
    const lines = fs.readFileSync(FILES.signalsJsonl, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    lines.forEach((line) => {
      try {
        const entry = JSON.parse(line);
        signals.push(entry);
      } catch (error) {
        console.warn('[RESONANCE] Skipping invalid JSONL line');
      }
    });
  }

  const ga4 = safeReadJson(FILES.ga4Aggregate, []);
  if (Array.isArray(ga4)) {
    ga4.forEach((row) => {
      if (!row || !row.path) return;
      signals.push({
        source: 'ga4-aggregate',
        path: row.path,
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        dwellSeconds: row.avgEngagementTime || row.dwellSeconds || 0,
        timestamp: row.timestamp || null
      });
    });
  }

  return signals;
}

function buildNodeRegistry({ gates, painPoints, tools, insights }) {
  const nodes = [];

  gates.forEach((gate) => {
    nodes.push({
      id: gate.id,
      type: 'gate',
      title: gate.title,
      intent: gate.title,
      cluster: gate.id,
      linkWeight: 1.0,
      resonanceScore: 1.0,
      freshness: 1.0,
      decay: 0.0,
      source: 'gates.json'
    });
  });

  Object.keys(painPoints).forEach((gateId) => {
    (painPoints[gateId] || []).forEach((pp) => {
      nodes.push({
        id: `${gateId}::${pp.id}`,
        type: 'pain-point',
        title: pp.title,
        intent: pp.title,
        cluster: gateId,
        linkWeight: 0.8,
        resonanceScore: 1.0,
        freshness: 1.0,
        decay: 0.0,
        source: 'pain-points.json'
      });
    });
  });

  tools.forEach((tool) => {
    nodes.push({
      id: `tool::${tool.id}`,
      type: 'tool',
      title: tool.title,
      intent: tool.title,
      cluster: tool.gateIds && tool.gateIds[0] ? tool.gateIds[0] : 'general',
      linkWeight: 0.9,
      resonanceScore: 1.0,
      freshness: 1.0,
      decay: 0.0,
      source: tool.source || 'tools'
    });
  });

  (insights || []).forEach((insight) => {
    nodes.push({
      id: `insight::${insight.slug || normalizeKey(insight.title)}`,
      type: 'insight',
      title: insight.title || insight.slug,
      intent: insight.title || insight.slug,
      cluster: 'insights',
      linkWeight: 0.7,
      resonanceScore: 1.0,
      freshness: 1.0,
      decay: 0.0,
      source: 'insights.json'
    });
  });

  return nodes;
}

function applySignals(nodes, tools, signals) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const toolSlugMap = new Map();

  tools.forEach((tool) => {
    const slug = tool.slug || tool.id;
    toolSlugMap.set(`/tools/${slug}`, `tool::${tool.id}`);
    toolSlugMap.set(`/tools/${tool.id}`, `tool::${tool.id}`);
  });

  const now = Date.now();
  const DAY_MS = 1000 * 60 * 60 * 24;

  signals.forEach((signal) => {
    let targetId = signal.nodeId;
    if (!targetId && signal.path) {
      const pathKey = signal.path.replace(/\/+$/, '');
      targetId = toolSlugMap.get(pathKey);
    }
    if (!targetId) return;

    const node = nodeMap.get(targetId);
    if (!node) return;

    const impressions = Number(signal.impressions || 0);
    const clicks = Number(signal.clicks || 0);
    const ctr = Number(signal.ctr || (impressions ? clicks / impressions : 0));
    const dwellSeconds = Number(signal.dwellSeconds || 0);
    const navigationDepth = Number(signal.navigationDepth || 0);

    const scoreBoost =
      Math.min(ctr, 0.25) * 4 +
      Math.min(dwellSeconds / 60, 5) * 0.3 +
      Math.min(navigationDepth, 5) * 0.15;

    node.resonanceScore = Math.max(0.5, node.resonanceScore + scoreBoost);
    node.linkWeight = Math.min(2.0, node.linkWeight + scoreBoost * 0.1);
    node.freshness = Math.min(1.0, node.freshness + 0.1);
    node.lastSignalAt = signal.timestamp || new Date().toISOString();
  });

  nodes.forEach((node) => {
    if (!node.lastSignalAt) {
      node.decay = Math.min(0.3, node.decay + 0.05);
      node.resonanceScore = Math.max(0.5, node.resonanceScore - 0.05);
      return;
    }
    const ageDays = Math.max(0, (now - new Date(node.lastSignalAt).getTime()) / DAY_MS);
    const decay = Math.min(0.5, ageDays * 0.01);
    node.decay = decay;
    node.freshness = Math.max(0.2, 1 - decay);
    node.resonanceScore = Math.max(0.5, node.resonanceScore - decay);
  });
}

function buildDrafts(nodes) {
  const sorted = [...nodes].sort((a, b) => b.resonanceScore - a.resonanceScore);
  const top = sorted.slice(0, 20);

  const linkAdjustments = top.map((node) => ({
    nodeId: node.id,
    type: node.type,
    action: 'increase-internal-links',
    recommendedBoost: Math.min(0.5, node.resonanceScore / 10),
    reason: 'High resonance score',
    status: 'draft'
  }));

  const expansionCandidates = top
    .filter((node) => node.type === 'gate' || node.type === 'tool')
    .map((node) => ({
      parentNodeId: node.id,
      parentType: node.type,
      proposal: 'derive-adjacent-intent',
      intentSeed: node.intent,
      status: 'draft',
      requiresReview: true,
      reason: 'High resonance parent; draft-only expansion candidate'
    }));

  return {
    generated: new Date().toISOString(),
    status: 'draft',
    linkAdjustments,
    expansionCandidates
  };
}

function buildResonance() {
  console.log('[RESONANCE] Building resonance registry...');

  const gatesData = safeReadJson(FILES.gates, { gates: [] });
  const painPointsData = safeReadJson(FILES.painPoints, { painPoints: {} });
  const insightsData = safeReadJson(FILES.insights, { insights: [] });

  const gates = Array.isArray(gatesData.gates) ? gatesData.gates : gatesData;
  const painPoints = painPointsData.painPoints || {};
  const insights = insightsData.insights || [];
  const tools = loadTools();
  const signals = loadSignals();

  const nodes = buildNodeRegistry({ gates, painPoints, tools, insights });
  applySignals(nodes, tools, signals);

  const drafts = buildDrafts(nodes);

  ensureDir(MATRIX_DIR);
  const nodesOut = path.join(MATRIX_DIR, 'resonance-nodes.json');
  const draftsOut = path.join(MATRIX_DIR, 'resonance-drafts.json');

  fs.writeFileSync(nodesOut, JSON.stringify({
    version: '1.0',
    generated: new Date().toISOString(),
    nodes
  }, null, 2));

  fs.writeFileSync(draftsOut, JSON.stringify(drafts, null, 2));

  console.log('[RESONANCE] Nodes:', nodes.length);
  console.log('[RESONANCE] Draft adjustments:', drafts.linkAdjustments.length);
  console.log(`[RESONANCE] Output: ${nodesOut}`);
  console.log(`[RESONANCE] Output: ${draftsOut}`);
}

if (require.main === module) {
  try {
    buildResonance();
  } catch (error) {
    console.error('[RESONANCE] Build failed:', error);
    process.exit(1);
  }
}

module.exports = { buildResonance };
