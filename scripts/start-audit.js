#!/usr/bin/env node

/**
 * Start Audit Process
 * This script prepares and launches the audit system
 */

import { logger } from "../core/logger.js";
import auditSystem from "../core/audit-system.js";
import readOnlyMode from "../core/readonly-mode.js";

console.log("\n" + "=".repeat(60));
console.log("🚀 Website Code Audit System - Starting");
console.log("=".repeat(60));
console.log("\n⚠️  READ-ONLY MODE ACTIVE");
console.log("   No changes will be made without your authorization\n");

// Verify read-only mode
if (!readOnlyMode.isAuthorized('test', 'test')) {
  console.log("✅ Read-only mode: ACTIVE (writes blocked)");
} else {
  console.log("⚠️  Read-only mode: INACTIVE");
}

// Initialize audit system
auditSystem.log('SYSTEM_START', {
  timestamp: new Date().toISOString(),
  mode: 'read-only',
  website: 'https://rideyourdemons.com'
});

console.log("\n📋 System Status:");
console.log(`   Session ID: ${auditSystem.sessionId}`);
console.log(`   Audit Log: logs/audit/${auditSystem.sessionId}.jsonl`);
console.log(`   Reports: logs/audit/report_*.json/html`);

console.log("\n" + "=".repeat(60));
console.log("Ready to launch audit process");
console.log("=".repeat(60));
console.log("\nStarting audit-website script...\n");
console.log("📝 Instructions:");
console.log("   1. Browser window will open");
console.log("   2. Log in manually with your Firebase credentials");
console.log("   3. Navigate to the code/admin area you want audited");
console.log("   4. Return here and follow the prompts");
console.log("\n" + "-".repeat(60) + "\n");

// Launch the audit script
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.join(__dirname, "audit-website.js");

const child = spawn("node", [auditScript], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, "..")
});

child.on("error", (error) => {
  console.error(`\n✗ Failed to start audit: ${error.message}`);
  auditSystem.recordIssue('SYSTEM_ERROR', `Failed to start audit: ${error.message}`, {
    severity: 'high'
  });
  process.exit(1);
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log("\n✅ Audit process completed successfully");
    auditSystem.log('SYSTEM_COMPLETE', { exitCode: code });
    
    // Save final report
    const reportPath = auditSystem.saveReport('json');
    const htmlPath = auditSystem.saveReport('html');
    
    console.log(`\n📊 Reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlPath}`);
  } else {
    console.log(`\n⚠️  Audit process exited with code: ${code}`);
    auditSystem.log('SYSTEM_EXIT', { exitCode: code });
    auditSystem.saveReport('json');
  }
  
  process.exit(code);
});

// Handle cleanup
process.on("SIGINT", () => {
  console.log("\n\n⚠️  Interrupted. Saving audit log...");
  auditSystem.saveReport('json');
  child.kill();
  process.exit(0);
});

