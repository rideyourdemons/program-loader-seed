import approvalSystem from "../core/approval-system.js";
import navigationController from "../core/navigation-controller.js";
import { logger } from "../core/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("\nUsage: npm run implement-change <approvalId> <sessionId>");
    console.log("\nExample: npm run implement-change approval_1234567890_abc session_1234567890_xyz");
    process.exit(1);
  }

  const approvalId = args[0];
  const sessionId = args[1];

  console.log("\n" + "=".repeat(60));
  console.log("Implementing Approved Change");
  console.log("=".repeat(60) + "\n");

  try {
    // Get approval
    const approval = approvalSystem.getApproval(approvalId);
    if (!approval) {
      console.error(`✗ Approval not found: ${approvalId}`);
      process.exit(1);
    }

    if (approval.status !== 'approved') {
      console.error(`✗ Change not approved. Status: ${approval.status}`);
      process.exit(1);
    }

    console.log(`Approval ID: ${approvalId}`);
    console.log(`File: ${approval.filePath}`);
    console.log(`Session: ${sessionId}\n`);

    // Check if we have the new content
    // We need to read it from the approval file or sandbox
    const approvalFile = path.join(__dirname, "../logs/approvals", `${approvalId}.json`);
    if (!fs.existsSync(approvalFile)) {
      console.error(`✗ Approval file not found: ${approvalFile}`);
      process.exit(1);
    }

    const approvalData = JSON.parse(fs.readFileSync(approvalFile, 'utf8'));
    
    // We need to get the new content - it should be in the sandbox or we need to ask
    // For now, we'll need to read it from the original source
    // In a real implementation, we'd store the new content in the approval
    console.log("⚠️  Note: New content should be provided or retrieved from sandbox");
    console.log("   For now, you'll need to provide the new content\n");

    // Try to get from sandbox
    const sandboxPath = path.join(__dirname, "../sandbox", path.basename(approval.filePath));
    let newContent = '';
    
    if (fs.existsSync(sandboxPath)) {
      newContent = fs.readFileSync(sandboxPath, 'utf8');
      console.log(`✓ Found content in sandbox\n`);
    } else {
      console.error(`✗ Sandbox file not found. Please provide new content.`);
      process.exit(1);
    }

    // Update approval with new content
    approvalData.newContent = newContent;
    fs.writeFileSync(approvalFile, JSON.stringify(approvalData, null, 2), 'utf8');

    // Implement the change
    console.log("Implementing change...");
    const result = await navigationController.implementApprovedChange(
      sessionId,
      approvalId,
      'auto'
    );

    console.log("\n✅ Change implemented successfully!");
    console.log(`   File: ${result.filePath}`);
    console.log(`   Size: ${result.size} bytes\n`);

  } catch (error) {
    console.error(`\n✗ Implementation failed: ${error.message}\n`);
    logger.error("Implementation error:", error);
    process.exit(1);
  }
}

main();

