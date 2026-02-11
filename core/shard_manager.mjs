/**
 * Shard Manager - Infinite Scaling Architecture
 * 
 * When a cluster exceeds 1,000,000 nodes, archive the current state
 * and re-initialize using core Seed Nodes (Pumps/Gates).
 * 
 * Enables federated queries across archived shards.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARDS_DIR = path.join(__dirname, '..', 'shards');

// Ensure shards directory exists
if (!fs.existsSync(SHARDS_DIR)) {
  fs.mkdirSync(SHARDS_DIR, { recursive: true });
}

/**
 * Archive current cluster state to a timestamped JSON file
 */
export function archiveShard(clusterData, metadata = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shardId = `shard-${timestamp}`;
  const shardPath = path.join(SHARDS_DIR, `${shardId}.json`);
  
  const shard = {
    id: shardId,
    timestamp: new Date().toISOString(),
    nodeCount: clusterData?.nodes?.length || 0,
    metadata: {
      ...metadata,
      clusteringCoefficient: metadata.clusteringCoefficient || 0.82,
      version: '1.0.0'
    },
    nodes: clusterData?.nodes || [],
    seedNodes: clusterData?.seedNodes || [] // Core Pumps/Gates
  };
  
  try {
    fs.writeFileSync(shardPath, JSON.stringify(shard, null, 2), 'utf8');
    console.log(`[Shard Manager] Archived shard: ${shardId} (${shard.nodeCount} nodes)`);
    return shardId;
  } catch (error) {
    console.error(`[Shard Manager] Failed to archive shard:`, error);
    throw error;
  }
}

/**
 * Load an archived shard
 */
export function loadShard(shardId) {
  const shardPath = path.join(SHARDS_DIR, `${shardId}.json`);
  
  if (!fs.existsSync(shardPath)) {
    throw new Error(`Shard not found: ${shardId}`);
  }
  
  try {
    const shardData = fs.readFileSync(shardPath, 'utf8');
    const shard = JSON.parse(shardData);
    console.log(`[Shard Manager] Loaded shard: ${shardId} (${shard.nodeCount} nodes)`);
    return shard;
  } catch (error) {
    console.error(`[Shard Manager] Failed to load shard ${shardId}:`, error);
    throw error;
  }
}

/**
 * List all archived shards
 */
export function listShards() {
  if (!fs.existsSync(SHARDS_DIR)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(SHARDS_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const shardPath = path.join(SHARDS_DIR, file);
        const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
        return {
          id: shardData.id,
          timestamp: shardData.timestamp,
          nodeCount: shardData.nodeCount,
          metadata: shardData.metadata
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error(`[Shard Manager] Failed to list shards:`, error);
    return [];
  }
}

/**
 * Perform federated query across all shards
 */
export async function federatedQuery(queryFn) {
  const shards = listShards();
  const results = [];
  
  for (const shardInfo of shards) {
    try {
      const shard = loadShard(shardInfo.id);
      const shardResults = queryFn(shard);
      if (shardResults && shardResults.length > 0) {
        results.push({
          shardId: shardInfo.id,
          results: shardResults
        });
      }
    } catch (error) {
      console.warn(`[Shard Manager] Failed to query shard ${shardInfo.id}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Check if cluster should be archived (exceeds 1M nodes)
 */
export function shouldArchive(nodeCount) {
  return nodeCount >= 1_000_000;
}

/**
 * Get core Seed Nodes (Pumps/Gates) for re-initialization
 */
export function getSeedNodes() {
  // Core Seed Nodes are the 12 Gates (Pumps)
  // These are the foundational nodes that never get archived
  return [
    { id: 'gate-1', type: 'gate', name: 'Gate 1' },
    { id: 'gate-2', type: 'gate', name: 'Gate 2' },
    { id: 'gate-3', type: 'gate', name: 'Gate 3' },
    { id: 'gate-4', type: 'gate', name: 'Gate 4' },
    { id: 'gate-5', type: 'gate', name: 'Gate 5' },
    { id: 'gate-6', type: 'gate', name: 'Gate 6' },
    { id: 'gate-7', type: 'gate', name: 'Gate 7' },
    { id: 'gate-8', type: 'gate', name: 'Gate 8' },
    { id: 'gate-9', type: 'gate', name: 'Gate 9' },
    { id: 'gate-10', type: 'gate', name: 'Gate 10' },
    { id: 'gate-11', type: 'gate', name: 'Gate 11' },
    { id: 'gate-12', type: 'gate', name: 'Gate 12' }
  ];
}
