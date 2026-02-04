import approvalSystem from "../core/approval-system.js";
import navigationController from "../core/navigation-controller.js";
import { logger } from "../core/logger.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log("\n" + "=".repeat(60));
  console.log("Change Approval System");
  console.log("=".repeat(60) + "\n");

  if (args.length === 0) {
    // List pending approvals
    const pending = approvalSystem.getPendingApprovals();
    
    if (pending.length === 0) {
      console.log("No pending approvals.\n");
      rl.close();
      return;
    }

    console.log(`Found ${pending.length} pending approval(s):\n`);
    pending.forEach((req, index) => {
      console.log(`${index + 1}. ${req.id}`);
      console.log(`   File: ${req.filePath}`);
      console.log(`   Reason: ${req.reason}`);
      console.log(`   Status: ${req.testResults.overallStatus}`);
      console.log(`   Requested: ${req.timestamp}\n`);
    });

    const choice = await question("Enter approval ID to review (or 'all' to review all): ");
    
    if (choice === 'all') {
      for (const req of pending) {
        await reviewApproval(req.id);
      }
    } else {
      await reviewApproval(choice);
    }
  } else if (args[0] === '--approve' && args[1]) {
    await approveChange(args[1]);
  } else if (args[0] === '--reject' && args[1]) {
    const reason = args[2] || await question("Rejection reason: ");
    await rejectChange(args[1], reason);
  } else if (args[0] === '--list') {
    const pending = approvalSystem.getPendingApprovals();
    pending.forEach(req => {
      console.log(`${req.id} - ${req.filePath} - ${req.reason}`);
    });
  } else {
    console.log("Usage:");
    console.log("  node scripts/approve-change.js                    # List and review");
    console.log("  node scripts/approve-change.js --approve <ID>    # Approve change");
    console.log("  node scripts/approve-change.js --reject <ID>     # Reject change");
    console.log("  node scripts/approve-change.js --list            # List pending");
  }

  rl.close();
}

async function reviewApproval(approvalId) {
  const approval = approvalSystem.getApproval(approvalId);
  if (!approval) {
    console.log(`\n✗ Approval not found: ${approvalId}\n`);
    return;
  }

  if (approval.status !== 'pending') {
    console.log(`\n⚠ Approval ${approvalId} is already ${approval.status}\n`);
    return;
  }

  console.log("\n" + approvalSystem.generateApprovalReport(approval));

  const action = await question("\nApprove (a), Reject (r), or Skip (s): ");
  
  if (action.toLowerCase() === 'a') {
    await approveChange(approvalId);
  } else if (action.toLowerCase() === 'r') {
    const reason = await question("Rejection reason: ");
    await rejectChange(approvalId, reason);
  }
}

async function approveChange(approvalId) {
  try {
    const approval = approvalSystem.approve(approvalId);
    console.log(`\n✅ Change approved: ${approvalId}`);
    console.log(`   File: ${approval.filePath}`);
    console.log(`\n⚠️  To implement this change, you need to provide the session ID.`);
    console.log(`   Run: npm run implement-change ${approvalId} <sessionId>\n`);
  } catch (error) {
    console.error(`\n✗ Failed to approve: ${error.message}\n`);
  }
}

async function rejectChange(approvalId, reason) {
  try {
    const approval = approvalSystem.reject(approvalId, reason);
    console.log(`\n❌ Change rejected: ${approvalId}`);
    console.log(`   Reason: ${reason}\n`);
  } catch (error) {
    console.error(`\n✗ Failed to reject: ${error.message}\n`);
  }
}

main().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});

