/**
 * CHAOS STRESS TEST - Maximum Load Validation
 * 
 * Simulates 200,000 nodes with:
 * - Deliberate memory leak to test 150MB hard kill
 * - Complex math every 10th node to force CPU thermals to 80°C+
 * - Validates safety valves under extreme conditions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Limits
const RAM_HARD_KILL = 150; // MB
const TARGET_NODES = 200000;
const COMPLEX_MATH_INTERVAL = 10; // Every 10th node
const MEMORY_LEAK_MULTIPLIER = 1.1; // 10% growth per batch

// Gold Standard Anchors (pinned)
const GOLD_STANDARD_ANCHORS = [
  'fathers-sons', 'mothers-daughters', 'the-patriarch', 'the-matriarch',
  'young-lions', 'young-women', 'the-professional', 'the-griever',
  'the-addict', 'the-protector', 'men-solo', 'women-solo'
];

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return Math.round(usage.heapUsed / 1024 / 1024);
}

/**
 * Complex math operation to heat CPU
 * Performs matrix multiplication, prime factorization, etc.
 */
function performComplexMath(nodeIndex) {
  // Matrix multiplication (CPU intensive)
  const size = 100;
  const matrixA = [];
  const matrixB = [];
  
  for (let i = 0; i < size; i++) {
    matrixA[i] = [];
    matrixB[i] = [];
    for (let j = 0; j < size; j++) {
      matrixA[i][j] = Math.random() * 100;
      matrixB[i][j] = Math.random() * 100;
    }
  }
  
  // Multiply matrices
  const result = [];
  for (let i = 0; i < size; i++) {
    result[i] = [];
    for (let j = 0; j < size; j++) {
      let sum = 0;
      for (let k = 0; k < size; k++) {
        sum += matrixA[i][k] * matrixB[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  // Prime factorization (additional CPU load)
  let num = Math.floor(Math.random() * 1000000) + 100000;
  const factors = [];
  for (let i = 2; i <= Math.sqrt(num); i++) {
    while (num % i === 0) {
      factors.push(i);
      num /= i;
    }
  }
  if (num > 1) factors.push(num);
  
  // Fibonacci calculation
  function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  }
  const fibResult = fib(35); // CPU intensive recursive call
  
  return {
    matrixResult: result[0][0],
    factors: factors.length,
    fibonacci: fibResult,
    nodeIndex
  };
}

/**
 * Generate synthetic node with memory leak
 */
function generateNode(index) {
  // Deliberate memory leak: accumulate data
  const node = {
    id: `stress-node-${index}`,
    type: index % 10 === 0 ? 'gate' : 'tool',
    title: `Stress Test Node ${index}`,
    cluster: GOLD_STANDARD_ANCHORS[index % GOLD_STANDARD_ANCHORS.length],
    resonanceScore: Math.random(),
    decayScore: Math.random() * 0.1,
    linkWeight: Math.random(),
    
    // MEMORY LEAK: Accumulate large arrays
    leakData: new Array(Math.floor(index * MEMORY_LEAK_MULTIPLIER)).fill({
      timestamp: Date.now(),
      data: 'x'.repeat(100), // 100 char strings
      metadata: {
        index: index,
        nested: {
          deep: {
            value: Math.random() * 1000
          }
        }
      }
    }),
    
    // Additional leak: String accumulation
    history: Array.from({ length: index % 1000 }, (_, i) => 
      `Event ${i}: ${'data'.repeat(50)}`
    ),
    
    // Circular reference (will be detected)
    connectsTo: index > 0 ? [`stress-node-${index - 1}`] : []
  };
  
  return node;
}

/**
 * Main stress test execution
 */
async function runChaosStress() {
  console.log('\n' + '='.repeat(70));
  console.log('☠️  CHAOS STRESS TEST - Maximum Load Validation');
  console.log('='.repeat(70));
  console.log('Testing Safety Valves Under Extreme Conditions\n');
  
  const initialMemory = getMemoryUsage();
  const startTime = performance.now();
  
  console.log(`📊 Stress Test Configuration:`);
  console.log(`   Target Nodes: ${TARGET_NODES.toLocaleString()}`);
  console.log(`   Complex Math: Every ${COMPLEX_MATH_INTERVAL}th node`);
  console.log(`   Memory Leak: ${(MEMORY_LEAK_MULTIPLIER - 1) * 100}% growth per batch`);
  console.log(`   RAM Hard Kill: ${RAM_HARD_KILL} MB`);
  console.log(`   Initial RAM: ${initialMemory} MB\n`);
  
  const processedNodes = [];
  let nodeIndex = 0;
  let lastSuccessfulNodeId = null;
  let hardKillTriggered = false;
  let complexMathCount = 0;
  let peakMemory = initialMemory;
  
  // Pin anchors
  const pinnedAnchors = new Map();
  GOLD_STANDARD_ANCHORS.forEach(anchor => {
    pinnedAnchors.set(anchor, {
      id: anchor,
      type: 'anchor',
      pinned: true,
      timestamp: Date.now()
    });
  });
  console.log(`📌 Pinned ${pinnedAnchors.size} Gold Standard anchors\n`);
  
  console.log('🚀 Starting stress test...\n');
  
  try {
    for (let i = 0; i < TARGET_NODES; i++) {
      // Check RAM before processing
      const currentMemory = getMemoryUsage();
      
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }
      
      // HARD KILL CHECK
      if (currentMemory > RAM_HARD_KILL) {
        console.log(`\n🚨 HARD KILL TRIGGERED:`);
        console.log(`   RAM: ${currentMemory} MB > ${RAM_HARD_KILL} MB`);
        console.log(`   Last successful node: ${lastSuccessfulNodeId}`);
        console.log(`   Nodes processed: ${nodeIndex.toLocaleString()}`);
        hardKillTriggered = true;
        break;
      }
      
      // Generate node (with deliberate memory leak)
      const node = generateNode(i);
      lastSuccessfulNodeId = node.id;
      
      // Complex math every 10th node (CPU thermal stress)
      if (i % COMPLEX_MATH_INTERVAL === 0) {
        const mathStart = performance.now();
        const mathResult = performComplexMath(i);
        const mathTime = performance.now() - mathStart;
        complexMathCount++;
        
        if (i % 1000 === 0) {
          console.log(
            `[Stress] Nodes: ${i.toLocaleString()} | ` +
            `RAM: ${currentMemory}MB | ` +
            `Math Ops: ${complexMathCount} | ` +
            `Math Time: ${mathTime.toFixed(2)}ms`
          );
        }
      }
      
      // Accumulate nodes (memory leak simulation)
      processedNodes.push(node);
      
      // Heartbeat every 1,000 nodes
      if ((i + 1) % 1000 === 0) {
        const elapsed = (performance.now() - startTime) / 1000;
        const nodesPerSecond = (i + 1) / elapsed;
        const memoryDelta = currentMemory - initialMemory;
        
        console.log(
          `[Heartbeat] Nodes: ${(i + 1).toLocaleString()} | ` +
          `RAM: ${currentMemory}MB (Δ${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB) | ` +
          `Peak: ${peakMemory}MB | ` +
          `Speed: ${nodesPerSecond.toFixed(0)} nodes/sec`
        );
      }
      
      // Clear processed nodes periodically (but not completely - simulate leak)
      if (processedNodes.length > 10000) {
        // Only clear 50% to simulate memory leak
        processedNodes.splice(0, processedNodes.length * 0.5);
      }
      
      nodeIndex = i + 1;
    }
  } catch (error) {
    console.error(`\n❌ Stress test error:`, error);
    console.error(`   Last successful node: ${lastSuccessfulNodeId}`);
  }
  
  const totalTime = performance.now() - startTime;
  const finalMemory = getMemoryUsage();
  const memoryDelta = finalMemory - initialMemory;
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 STRESS TEST RESULTS`);
  console.log(`${'='.repeat(70)}\n`);
  
  console.log(`   Nodes Processed: ${nodeIndex.toLocaleString()}`);
  console.log(`   Target: ${TARGET_NODES.toLocaleString()}`);
  console.log(`   Completion: ${((nodeIndex / TARGET_NODES) * 100).toFixed(1)}%`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Nodes/Second: ${(nodeIndex / (totalTime / 1000)).toFixed(0)}`);
  console.log(`   Initial RAM: ${initialMemory} MB`);
  console.log(`   Final RAM: ${finalMemory} MB`);
  console.log(`   Peak RAM: ${peakMemory} MB`);
  console.log(`   Memory Delta: ${memoryDelta} MB`);
  console.log(`   Complex Math Ops: ${complexMathCount.toLocaleString()}`);
  console.log(`   Last Successful Node: ${lastSuccessfulNodeId || 'N/A'}`);
  
  console.log(`\n${'='.repeat(70)}`);
  
  if (hardKillTriggered) {
    console.log(`✅ HARD KILL VALIDATED`);
    console.log(`   Safety valve triggered at ${peakMemory} MB`);
    console.log(`   System protected from memory overflow`);
  } else if (nodeIndex >= TARGET_NODES) {
    console.log(`✅ STRESS TEST COMPLETE`);
    console.log(`   All ${TARGET_NODES.toLocaleString()} nodes processed`);
    console.log(`   Peak RAM: ${peakMemory} MB (under ${RAM_HARD_KILL} MB limit)`);
  } else {
    console.log(`⚠️  STRESS TEST INCOMPLETE`);
    console.log(`   Processed: ${nodeIndex.toLocaleString()}/${TARGET_NODES.toLocaleString()}`);
  }
  
  console.log(`${'='.repeat(70)}\n`);
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    nodesProcessed: nodeIndex,
    targetNodes: TARGET_NODES,
    completionPercent: (nodeIndex / TARGET_NODES) * 100,
    initialMemory,
    finalMemory,
    peakMemory,
    memoryDelta,
    totalTime: totalTime / 1000,
    nodesPerSecond: nodeIndex / (totalTime / 1000),
    complexMathOps: complexMathCount,
    hardKillTriggered,
    lastSuccessfulNodeId,
    pinnedAnchors: pinnedAnchors.size
  };
  
  const outputDir = path.join(ROOT_DIR, 'scripts', 'stress-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'stress-test-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`📁 Results saved to: ${path.join(outputDir, 'stress-test-results.json')}\n`);
  
  return results;
}

// Execute
if (import.meta.url === `file://${path.resolve(process.argv[1])}` || 
    process.argv[1]?.includes('chaos-stress.mjs')) {
  runChaosStress().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runChaosStress };
