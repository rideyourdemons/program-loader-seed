/**
 * QUICK TEST - Verify streaming migration works
 * Tests with first 100 nodes only
 */

import { StreamingNodeReader } from './streaming-migration.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const FILES = {
  resonanceNodes: path.join(ROOT_DIR, 'public', 'matrix', 'resonance-nodes.json')
};

async function quickTest() {
  console.log('🧪 Quick Test: Streaming Migration\n');
  
  const reader = new StreamingNodeReader(FILES.resonanceNodes);
  const total = await reader.getTotalCount();
  
  console.log(`Total nodes: ${total.toLocaleString()}\n`);
  console.log('Testing first 100 nodes...\n');
  
  let count = 0;
  for await (const node of reader.readNodes()) {
    count++;
    if (count <= 10) {
      console.log(`  ${count}. ${node.id} (${node.type})`);
    }
    if (count >= 100) break;
  }
  
  console.log(`\n✅ Processed ${count} nodes successfully\n`);
}

quickTest().catch(console.error);
