import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import readOnlyMode from "./readonly-mode.js";
import sandboxTester from "./sandbox-tester.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const approvalsDir = path.join(__dirname, "../logs/approvals");

if (!fs.existsSync(approvalsDir)) {
  fs.mkdirSync(approvalsDir, { recursive: true });
}

/**
 * Approval System
 * Manages change approvals after sandbox testing
 */
class ApprovalSystem {
  constructor() {
    this.pendingApprovals = [];
    this.approvedChanges = [];
    this.rejectedChanges = [];
  }

  /**
   * Request approval for a change
   * @param {string} filePath - File to change
   * @param {string} originalContent - Original content
   * @param {string} newContent - New content
   * @param {string} reason - Reason for change
   * @param {Object} testResults - Sandbox test results
   * @returns {Promise<Object>} Approval request
   */
  async requestApproval(filePath, originalContent, newContent, reason, testResults) {
    const approvalRequest = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      filePath,
      timestamp: new Date().toISOString(),
      reason,
      testResults,
      comparison: sandboxTester.compareContent(originalContent, newContent),
      status: 'pending',
      originalSize: originalContent.length,
      newSize: newContent.length,
      originalContent: originalContent, // Store for reference
      newContent: newContent // Store for implementation
    };

    this.pendingApprovals.push(approvalRequest);
    
    // Save approval request
    const requestPath = path.join(approvalsDir, `${approvalRequest.id}.json`);
    fs.writeFileSync(requestPath, JSON.stringify(approvalRequest, null, 2), 'utf8');

    auditSystem.log('APPROVAL_REQUESTED', approvalRequest);
    logger.info(`Approval requested: ${approvalRequest.id} for ${filePath}`);

    return approvalRequest;
  }

  /**
   * Generate approval report
   * @param {Object} approvalRequest
   * @returns {string} Report content
   */
  generateApprovalReport(approvalRequest) {
    const { filePath, reason, testResults, comparison, originalSize, newSize } = approvalRequest;

    return `
═══════════════════════════════════════════════════════════════
CHANGE APPROVAL REQUEST
═══════════════════════════════════════════════════════════════

Request ID: ${approvalRequest.id}
File: ${filePath}
Timestamp: ${approvalRequest.timestamp}

REASON FOR CHANGE:
${reason}

SANDBOX TEST RESULTS:
  Status: ${testResults.overallStatus.toUpperCase()}
  Syntax Valid: ${testResults.syntaxTest.syntaxValid ? 'YES' : 'NO'}
  Errors: ${testResults.syntaxTest.errors.length}
  Warnings: ${testResults.syntaxTest.warnings.length}
  Issues: ${testResults.issues ? testResults.issues.length : 0}

CHANGE SUMMARY:
  Original Size: ${originalSize} bytes
  New Size: ${newSize} bytes
  Lines Added: ${comparison.added}
  Lines Removed: ${comparison.removed}
  Lines Modified: ${comparison.modified}
  Total Changes: ${comparison.totalChanges}

${testResults.syntaxTest.errors.length > 0 ? `
SYNTAX ERRORS:
${testResults.syntaxTest.errors.map(e => `  - ${e}`).join('\n')}
` : ''}

${testResults.issues && testResults.issues.length > 0 ? `
ISSUES DETECTED:
${testResults.issues.map(i => `  - [${i.type}] ${i.message}`).join('\n')}
` : ''}

${comparison.totalChanges > 0 ? `
CHANGE PREVIEW:
${comparison.details.added.slice(0, 5).map(c => `+ Line ${c.line}: ${c.content.substring(0, 80)}`).join('\n')}
${comparison.details.removed.slice(0, 5).map(c => `- Line ${c.line}: ${c.content.substring(0, 80)}`).join('\n')}
${comparison.details.modified.slice(0, 5).map(c => `~ Line ${c.line}:\n  - ${c.original.substring(0, 60)}\n  + ${c.new.substring(0, 60)}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════
APPROVAL REQUIRED
═══════════════════════════════════════════════════════════════

This change has been tested in sandbox.
Review the details above and approve or reject.

To approve: Run with --approve ${approvalRequest.id}
To reject: Run with --reject ${approvalRequest.id}
`;
  }

  /**
   * Approve a change
   * @param {string} approvalId
   * @returns {Object} Approved change
   */
  approve(approvalId) {
    const request = this.pendingApprovals.find(r => r.id === approvalId);
    if (!request) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }

    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    
    this.pendingApprovals = this.pendingApprovals.filter(r => r.id !== approvalId);
    this.approvedChanges.push(request);

    // Update approval file
    const requestPath = path.join(approvalsDir, `${approvalId}.json`);
    if (fs.existsSync(requestPath)) {
      fs.writeFileSync(requestPath, JSON.stringify(request, null, 2), 'utf8');
    }

    auditSystem.log('CHANGE_APPROVED', request);
    logger.info(`Change approved: ${approvalId} for ${request.filePath}`);

    return request;
  }

  /**
   * Reject a change
   * @param {string} approvalId
   * @param {string} reason
   * @returns {Object} Rejected change
   */
  reject(approvalId, reason = 'Not approved') {
    const request = this.pendingApprovals.find(r => r.id === approvalId);
    if (!request) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }

    request.status = 'rejected';
    request.rejectedAt = new Date().toISOString();
    request.rejectionReason = reason;
    
    this.pendingApprovals = this.pendingApprovals.filter(r => r.id !== approvalId);
    this.rejectedChanges.push(request);

    // Update approval file
    const requestPath = path.join(approvalsDir, `${approvalId}.json`);
    if (fs.existsSync(requestPath)) {
      fs.writeFileSync(requestPath, JSON.stringify(request, null, 2), 'utf8');
    }

    auditSystem.log('CHANGE_REJECTED', request);
    logger.info(`Change rejected: ${approvalId} for ${request.filePath}: ${reason}`);

    return request;
  }

  /**
   * Get pending approvals
   * @returns {Array}
   */
  getPendingApprovals() {
    return this.pendingApprovals;
  }

  /**
   * Get approval by ID
   * @param {string} approvalId
   * @returns {Object|null}
   */
  getApproval(approvalId) {
    return this.pendingApprovals.find(r => r.id === approvalId) ||
           this.approvedChanges.find(r => r.id === approvalId) ||
           this.rejectedChanges.find(r => r.id === approvalId) ||
           null;
  }
}

export const approvalSystem = new ApprovalSystem();
export default approvalSystem;

