/**
 * Health Check Script - Verify Shard #1 communication with UI
 * Run: node scripts/health-check-shard.js
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

console.log('🏥 Shard Health Check\n');
console.log('='.repeat(60));

async function checkEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const startTime = Date.now();
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        
        if (status === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`✅ ${description}`);
            console.log(`   Status: ${status} | Duration: ${duration}ms`);
            resolve({ success: true, data: json, duration });
          } catch (e) {
            console.log(`⚠️  ${description}`);
            console.log(`   Status: ${status} | Duration: ${duration}ms`);
            console.log(`   Warning: Response is not JSON`);
            resolve({ success: true, data: data.substring(0, 100), duration });
          }
        } else {
          console.log(`❌ ${description}`);
          console.log(`   Status: ${status} | Duration: ${duration}ms`);
          reject(new Error(`HTTP ${status}`));
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${description}`);
      console.log(`   Error: ${err.message}`);
      reject(err);
    });
  });
}

async function runHealthCheck() {
  const results = {
    server: false,
    nodes: false,
    shards: false
  };
  
  try {
    // Check 1: Server is running
    console.log('\n1. Server Status');
    console.log('-'.repeat(60));
    await checkEndpoint('/', 'Server is running')
      .then(() => { results.server = true; })
      .catch(() => { results.server = false; });
    
    // Check 2: Nodes API
    console.log('\n2. Nodes API');
    console.log('-'.repeat(60));
    await checkEndpoint('/api/nodes', 'Nodes API responding')
      .then((result) => {
        results.nodes = true;
        if (result.data.shardInfo) {
          console.log(`   Node Count: ${result.data.shardInfo.nodeCount}`);
          console.log(`   Should Archive: ${result.data.shardInfo.shardInfo?.shouldArchive ? 'Yes' : 'No'}`);
        }
      })
      .catch(() => { results.nodes = false; });
    
    // Check 3: Shard Manager
    console.log('\n3. Shard Manager');
    console.log('-'.repeat(60));
    await checkEndpoint('/api/shard/list', 'Shard Manager responding')
      .then((result) => {
        results.shards = true;
        if (result.data.shards && result.data.shards.length > 0) {
          console.log(`   Archived Shards: ${result.data.shards.length}`);
          result.data.shards.slice(0, 3).forEach(shard => {
            console.log(`   - ${shard.id}: ${shard.nodeCount} nodes`);
          });
        } else {
          console.log(`   No archived shards yet (this is normal for new installations)`);
        }
      })
      .catch(() => { results.shards = false; });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));
    
    const allPassed = Object.values(results).every(r => r === true);
    
    if (allPassed) {
      console.log('\n✅ ALL CHECKS PASSED');
      console.log('🎉 Shard #1 is successfully communicating with the UI!');
    } else {
      console.log('\n⚠️  SOME CHECKS FAILED');
      Object.entries(results).forEach(([key, value]) => {
        console.log(`   ${key}: ${value ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   node server.cjs');
    process.exit(1);
  }
}

// Run health check
runHealthCheck().catch(console.error);
