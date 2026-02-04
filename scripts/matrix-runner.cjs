/**
 * Matrix Runner (MVP)
 *
 * Builds:
 * - public/data/matrix/registry.json
 * - public/data/matrix/link-map.json
 * - public/data/matrix/node-proposals.json
 *
 * Signal ingestion (aggregate only):
 * - public/data/signals/latest.json
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const MATRIX_DIR = path.join(DATA_DIR, 'matrix');
const SIGNALS_FILE = path.join(DATA_DIR, 'signals', 'latest.json');

const FILES = {
  gates: path.join(DATA_DIR, 'gates.json'),
  painPoints: path.join(DATA_DIR, 'pain-points.json'),
  toolsCanonical: path.join(DATA_DIR, 'tools-canonical.json'),
  tools: path.join(DATA_DIR, 'tools.json'),
  insights: path.join(DATA_DIR, 'insights.json')
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeReadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return readJson(filePath);
  } catch (error) {
    console.warn(`[MATRIX] Failed to read ${filePath}:`, error.message);
    return fallback;
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
    keywords: Array.isArray(tool.keywords) ? tool.keywords : []
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
  const data = safeReadJson(SIGNALS_FILE, []);
  return Array.isArray(data) ? data : [];
}

function buildRegistry({ gates, painPoints, tools, insights }) {
  const nodes = [];

  gates.forEach((gate) => {
    nodes.push({
      id: `gate::${gate.id}`,
      path: `/gates/${gate.id}`,
      title: gate.title,
      tags: [gate.id],
      cluster: gate.id,
      inboundLinks: [],
      outboundLinks: [],
      resonanceScore: 1.0,
      lastUpdated: null,
      decayScore: 0.0
    });
  });

  Object.keys(painPoints).forEach((gateId) => {
    (painPoints[gateId] || []).forEach((pp) => {
      nodes.push({
        id: `pain::${gateId}::${pp.id}`,
        path: `/gates/${gateId}/${pp.id}`,
        title: pp.title,
        tags: [gateId, pp.id],
        cluster: gateId,
        inboundLinks: [],
        outboundLinks: [],
        resonanceScore: 1.0,
        lastUpdated: null,
        decayScore: 0.0
      });
    });
  });

  tools.forEach((tool) => {
    nodes.push({
      id: `tool::${tool.id}`,
      path: `/tools/${tool.slug || tool.id}`,
      title: tool.title,
      tags: tool.gateIds.length ? tool.gateIds : ['tools'],
      cluster: tool.gateIds[0] || 'tools',
      inboundLinks: [],
      outboundLinks: [],
      resonanceScore: 1.0,
      lastUpdated: null,
      decayScore: 0.0
    });
  });

  (insights || []).forEach((insight) => {
    nodes.push({
      id: `insight::${insight.slug || normalizeKey(insight.title)}`,
      path: `/insights/${insight.slug || ''}`.replace(/\/+$/, ''),
      title: insight.title || insight.slug,
      tags: ['insights'],
      cluster: 'insights',
      inboundLinks: [],
      outboundLinks: [],
      resonanceScore: 1.0,
      lastUpdated: null,
      decayScore: 0.0
    });
  });

  return nodes;
}

function indexNodes(nodes) {
  const byPath = new Map();
  const byId = new Map();
  nodes.forEach((node) => {
    if (node.path) {
      const normalized = node.path.replace(/\/+$/, '');
      byPath.set(normalized, node);
    }
    byId.set(node.id, node);
  });
  return { byPath, byId };
}

function applySignals(nodes, signals) {
  const { byPath, byId } = indexNodes(nodes);
  const now = Date.now();
  const DAY_MS = 1000 * 60 * 60 * 24;

  signals.forEach((signal) => {
    if (!signal) return;
    let target = null;
    if (signal.nodeId && byId.has(signal.nodeId)) {
      target = byId.get(signal.nodeId);
    } else if (signal.path) {
      const pathKey = String(signal.path).replace(/\/+$/, '');
      target = byPath.get(pathKey) || null;
    }
    if (!target) return;

    const impressions = Number(signal.impressions || 0);
    const clicks = Number(signal.clicks || 0);
    const ctr = Number(signal.ctr || (impressions ? clicks / impressions : 0));
    const dwellSeconds = Number(signal.dwellSeconds || 0);
    const traversalDepth = Number(signal.traversalDepth || 0);
    const returnVisits = Number(signal.returnVisits || 0);

    const scoreBoost =
      Math.min(ctr, 0.25) * 4 +
      Math.min(dwellSeconds / 60, 5) * 0.3 +
      Math.min(traversalDepth, 5) * 0.15 +
      Math.min(returnVisits, 5) * 0.2;

    target.resonanceScore = Math.max(0.5, target.resonanceScore + scoreBoost);
    target.lastUpdated = signal.timestamp || new Date().toISOString();
  });

  nodes.forEach((node) => {
    if (!node.lastUpdated) {
      node.decayScore = Math.min(0.3, node.decayScore + 0.05);
      node.resonanceScore = Math.max(0.5, node.resonanceScore - 0.05);
      return;
    }
    const ageDays = Math.max(0, (now - new Date(node.lastUpdated).getTime()) / DAY_MS);
    const decay = Math.min(0.5, ageDays * 0.01);
    node.decayScore = decay;
    node.resonanceScore = Math.max(0.5, node.resonanceScore - decay);
  });
}

function buildLinkMap(nodes) {
  const byCluster = new Map();
  nodes.forEach((node) => {
    const list = byCluster.get(node.cluster) || [];
    list.push(node);
    byCluster.set(node.cluster, list);
  });

  const recommendations = [];
  byCluster.forEach((clusterNodes, clusterId) => {
    const sorted = [...clusterNodes].sort((a, b) => b.resonanceScore - a.resonanceScore);
    const top = sorted.slice(0, 5);
    sorted.forEach((node) => {
      if (top.find((t) => t.id === node.id)) return;
      recommendations.push({
        from: node.id,
        to: top.map((t) => t.id),
        cluster: clusterId,
        reason: 'Promote high-resonance nodes within cluster',
        status: 'draft'
      });
    });
  });

  return recommendations;
}

function buildProposals(nodes) {
  const threshold = 2.5;
  const proposals = nodes
    .filter((node) => node.resonanceScore >= threshold)
    .map((node) => ({
      parentNodeId: node.id,
      parentPath: node.path,
      proposal: 'adjacent-intent-draft',
      intentSeed: node.title,
      status: 'draft',
      requiresReview: true
    }));

  return proposals;
}

function runMatrix() {
  console.log('[MATRIX] Building matrix registry + drafts...');

  const gatesData = safeReadJson(FILES.gates, { gates: [] });
  const painPointsData = safeReadJson(FILES.painPoints, { painPoints: {} });
  const insightsData = safeReadJson(FILES.insights, { insights: [] });

  const gates = Array.isArray(gatesData.gates) ? gatesData.gates : gatesData;
  const painPoints = painPointsData.painPoints || {};
  const insights = insightsData.insights || [];
  const tools = loadTools();
  const signals = loadSignals();

  const nodes = buildRegistry({ gates, painPoints, tools, insights });
  applySignals(nodes, signals);

  const linkMap = buildLinkMap(nodes);
  const proposals = buildProposals(nodes);

  ensureDir(MATRIX_DIR);
  const registryOut = path.join(MATRIX_DIR, 'registry.json');
  const linkMapOut = path.join(MATRIX_DIR, 'link-map.json');
  const proposalsOut = path.join(MATRIX_DIR, 'node-proposals.json');

  fs.writeFileSync(registryOut, JSON.stringify({
    version: '1.0',
    generated: new Date().toISOString(),
    nodes
  }, null, 2));

  fs.writeFileSync(linkMapOut, JSON.stringify({
    version: '1.0',
    generated: new Date().toISOString(),
    recommendations: linkMap
  }, null, 2));

  fs.writeFileSync(proposalsOut, JSON.stringify({
    version: '1.0',
    generated: new Date().toISOString(),
    status: 'draft',
    proposals
  }, null, 2));

  console.log('[MATRIX] Nodes:', nodes.length);
  console.log('[MATRIX] Link recommendations:', linkMap.length);
  console.log('[MATRIX] Proposals:', proposals.length);
  console.log(`[MATRIX] Output: ${registryOut}`);
  console.log(`[MATRIX] Output: ${linkMapOut}`);
  console.log(`[MATRIX] Output: ${proposalsOut}`);
}

if (require.main === module) {
  try {
    runMatrix();
  } catch (error) {
    console.error('[MATRIX] Build failed:', error);
    process.exit(1);
  }
}

module.exports = { runMatrix };
