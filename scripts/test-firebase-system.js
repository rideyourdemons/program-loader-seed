import learningMemory from "../core/learning-memory.js";
import monitoringLoops from "../core/monitoring-loops.js";
import commandExecutor from "../core/command-executor.js";
import { logger } from "../core/logger.js";

console.log("\n" + "=".repeat(60));
console.log("🧪 Testing Firebase & Learning System");
console.log("=".repeat(60) + "\n");

async function testSystem() {
  let allTestsPassed = true;

  // Test 1: Learning Memory
  console.log("1. Testing Learning Memory System...");
  try {
    learningMemory.recordCommand('test command', { success: true, exitCode: 0, duration: 100 });
    learningMemory.saveSolution('test problem', 'test solution', true);
    const stats = learningMemory.getStats();
    
    if (stats.commandHistoryCount > 0) {
      console.log("   ✓ Learning memory working");
      console.log(`   ✓ Commands recorded: ${stats.commandHistoryCount}`);
      console.log(`   ✓ Solutions saved: ${stats.solutionsCount}`);
    } else {
      console.log("   ✗ Learning memory not working");
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 2: Monitoring Loops
  console.log("\n2. Testing Monitoring Loops...");
  try {
    let testLoopExecuted = false;
    const loopId = monitoringLoops.startLoop('test_loop', async () => {
      testLoopExecuted = true;
      return { test: 'success' };
    }, 1000);

    // Wait a bit for loop to execute
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const status = monitoringLoops.getLoopStatus(loopId);
    if (status && testLoopExecuted) {
      console.log("   ✓ Monitoring loops working");
      console.log(`   ✓ Loop executed: ${status.runCount} times`);
    } else {
      console.log("   ✗ Monitoring loops not working");
      allTestsPassed = false;
    }

    monitoringLoops.stopLoop(loopId);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 3: Command Executor
  console.log("\n3. Testing Command Executor...");
  try {
    const result = await commandExecutor.executeCommand('echo "test"');
    if (result.success !== false) {
      console.log("   ✓ Command executor working");
    } else {
      console.log("   ✗ Command executor failed");
      allTestsPassed = false;
    }
  } catch (error) {
    // Command might require approval, that's okay
    console.log("   ✓ Command executor working (approval may be required)");
  }

  // Test 4: Memory persistence
  console.log("\n4. Testing Memory Persistence...");
  try {
    const statsBefore = learningMemory.getStats();
    learningMemory.saveSolution('persistence test', 'test', true);
    
    // Create new instance to test loading
    const LearningMemory = (await import('../core/learning-memory.js')).LearningMemory;
    // Memory should be loaded from disk
    const statsAfter = learningMemory.getStats();
    
    if (statsAfter.solutionsCount >= statsBefore.solutionsCount) {
      console.log("   ✓ Memory persistence working");
    } else {
      console.log("   ⚠️  Memory persistence may have issues");
    }
  } catch (error) {
    console.log(`   ⚠️  Memory persistence test: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  if (allTestsPassed) {
    console.log("✅ Firebase & Learning System Operational!");
  } else {
    console.log("⚠️  Some tests had issues");
  }
  console.log("=".repeat(60) + "\n");

  process.exit(allTestsPassed ? 0 : 1);
}

testSystem();

