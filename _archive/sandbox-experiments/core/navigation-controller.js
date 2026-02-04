import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import credentialManager from "./credential-manager.js";
import webAutomation from "./web-automation.js";
import apiClient from "./api-client.js";
import remoteFileSystem from "./remote-filesystem.js";
import firebaseAuth from "./firebase-auth.js";
import readOnlyMode from "./readonly-mode.js";
import auditSystem from "./audit-system.js";
import sandboxTester from "./sandbox-tester.js";
import approvalSystem from "./approval-system.js";
import localExecutor from "./local-executor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Navigation Controller
 * Unified interface for navigating and interacting with websites/backends
 * Coordinates web automation, API access, and file system operations
 */
class NavigationController {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> { type, status, context }
  }

  /**
   * Initialize session for website access
   * @param {Object} credentials - { username, password, url }
   * @param {Object} options - { headless, timeout }
   * @returns {Promise<string>} sessionId
   */
  async initWebsiteSession(credentials, options = {}) {
    const sessionId = credentialManager.generateSessionId();
    
    // Store credentials (in memory only)
    credentialManager.storeCredentials(sessionId, {
      ...credentials,
      type: 'web'
    });

    // Launch browser
    await webAutomation.launchBrowser(sessionId, options);
    
    // Navigate to URL
    await webAutomation.navigateTo(sessionId, credentials.url);

    this.activeSessions.set(sessionId, {
      type: 'web',
      status: 'active',
      url: credentials.url
    });

    logger.info(`Website session initialized: ${sessionId}`);
    return sessionId;
  }

  /**
   * Initialize session for API/backend access
   * @param {Object} credentials - { username, password, endpoint, token, apiKey }
   * @param {Object} options - { baseURL, timeout, headers }
   * @returns {Promise<string>} sessionId
   */
  async initAPISession(credentials, options = {}) {
    const sessionId = credentialManager.generateSessionId();
    
    // Store credentials (in memory only)
    credentialManager.storeCredentials(sessionId, {
      ...credentials,
      type: 'api'
    });

    // Create API client
    await apiClient.createClient(sessionId, options);

    this.activeSessions.set(sessionId, {
      type: 'api',
      status: 'active',
      endpoint: credentials.endpoint || credentials.url
    });

    logger.info(`API session initialized: ${sessionId}`);
    return sessionId;
  }

  /**
   * Initialize session for SSH access
   * @param {Object} credentials - { username, password, host, port, privateKey }
   * @returns {Promise<string>} sessionId
   */
  async initSSHSession(credentials) {
    const sessionId = credentialManager.generateSessionId();
    
    // Store credentials (in memory only)
    credentialManager.storeCredentials(sessionId, {
      ...credentials,
      type: 'ssh'
    });

    this.activeSessions.set(sessionId, {
      type: 'ssh',
      status: 'active',
      host: credentials.host
    });

    logger.info(`SSH session initialized: ${sessionId}`);
    return sessionId;
  }

  /**
   * Login to website
   * @param {string} sessionId
   * @param {Object} selectors - Login form selectors or { useFirebase: true }
   * @returns {Promise<boolean>}
   */
  async loginToWebsite(sessionId, selectors = {}) {
    if (!this.activeSessions.has(sessionId)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const session = this.activeSessions.get(sessionId);
    if (session.type !== 'web') {
      throw new Error(`Session ${sessionId} is not a web session`);
    }

    // Auto-detect Firebase if not specified
    if (selectors.useFirebase === undefined) {
      const firebaseConfig = await firebaseAuth.detectFirebaseConfig(sessionId);
      if (firebaseConfig) {
        selectors.useFirebase = true;
        logger.info(`Firebase detected, using Firebase authentication`);
      }
    }

    await webAutomation.login(sessionId, selectors);
    session.status = 'authenticated';
    
    // Verify authentication
    if (selectors.useFirebase) {
      const isAuth = await firebaseAuth.isAuthenticated(sessionId);
      if (isAuth) {
        const user = await firebaseAuth.getCurrentUser(sessionId);
        logger.info(`Firebase authentication verified. User: ${user?.email || 'Unknown'}`);
      }
    }
    
    logger.info(`Logged in to website: ${sessionId}`);
    return true;
  }

  /**
   * Navigate to page/window
   * @param {string} sessionId
   * @param {string} url - URL or route
   * @returns {Promise<void>}
   */
  async navigateTo(sessionId, url) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.type === 'web') {
      await webAutomation.navigateTo(sessionId, url);
      session.url = url;
    } else if (session.type === 'api') {
      // For API, this might be setting a base path
      logger.info(`API navigation to: ${url} (session: ${sessionId})`);
    } else {
      throw new Error(`Navigation not supported for session type: ${session.type}`);
    }
  }

  /**
   * Read code/file from remote system
   * @param {string} sessionId
   * @param {string} filePath
   * @param {string} method - 'ssh', 'api', or 'auto'
   * @returns {Promise<string>} File content
   */
  async readCode(sessionId, filePath, method = 'auto') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (method === 'auto') {
      method = session.type === 'ssh' ? 'ssh' : 'api';
    }

    if (method === 'ssh') {
      return await remoteFileSystem.readFileSSH(sessionId, filePath);
    } else if (method === 'api') {
      return await remoteFileSystem.readFileAPI(sessionId, filePath);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Write/edit code/file on remote system
   * @param {string} sessionId
   * @param {string} filePath
   * @param {string} content
   * @param {string} method - 'ssh', 'api', or 'auto'
   * @param {string} reason - Reason for change
   * @param {boolean} skipSandbox - Skip sandbox testing (not recommended)
   * @returns {Promise<Object>} Approval request or implementation result
   */
  async writeCode(sessionId, filePath, content, method = 'auto', reason = 'Code modification', skipSandbox = false) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Read original content for comparison
    let originalContent = '';
    try {
      originalContent = await this.readCode(sessionId, filePath, method);
    } catch (error) {
      logger.warn(`Could not read original file for comparison: ${error.message}`);
      originalContent = '';
    }

    // Detect language
    const language = this.detectLanguage(filePath, content);

    // Sandbox testing (unless skipped)
    if (!skipSandbox) {
      logger.info(`Testing change in sandbox: ${filePath}`);
      const testResults = await sandboxTester.testChange(filePath, content, language);

      if (testResults.overallStatus === 'fail') {
        const errorMsg = `Sandbox test failed for ${filePath}. Errors: ${testResults.syntaxTest.errors.join(', ')}`;
        auditSystem.recordIssue('SANDBOX_TEST_FAILED', errorMsg, {
          file: filePath,
          severity: 'high',
          testResults
        });
        throw new Error(errorMsg);
      }

      // Request approval
      logger.info(`Sandbox test passed. Requesting approval for: ${filePath}`);
      const approvalRequest = await approvalSystem.requestApproval(
        filePath,
        originalContent,
        content,
        reason,
        testResults
      );

      // Generate and display approval report
      const report = approvalSystem.generateApprovalReport(approvalRequest);
      console.log(report);

      // Save report to file
      const reportPath = path.join(__dirname, "../logs/approvals", `${approvalRequest.id}_report.txt`);
      fs.writeFileSync(reportPath, report, 'utf8');
      logger.info(`Approval report saved: ${reportPath}`);

      return {
        status: 'pending_approval',
        approvalId: approvalRequest.id,
        testResults,
        reportPath,
        message: `Change tested in sandbox. Approval required. ID: ${approvalRequest.id}`
      };
    }

    // If sandbox is skipped, still check authorization
    if (!readOnlyMode.isAuthorized('write_code', filePath)) {
      auditSystem.recordWriteAttempt(filePath, 'Write operation not authorized');
      throw new Error(`Write operation not authorized. Authorization required to modify: ${filePath}`);
    }

    // Implement approved change
    if (method === 'auto') {
      method = session.type === 'ssh' ? 'ssh' : 'api';
    }

    if (method === 'ssh') {
      await remoteFileSystem.writeFileSSH(sessionId, filePath, content);
    } else if (method === 'api') {
      await remoteFileSystem.writeFileAPI(sessionId, filePath, content);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }

    auditSystem.recordAuthorizedWrite(filePath, content.length);
    logger.info(`Code written: ${filePath} (session: ${sessionId})`);

    return {
      status: 'implemented',
      filePath,
      size: content.length
    };
  }

  /**
   * Implement approved change
   * @param {string} sessionId
   * @param {string} approvalId
   * @param {string} method - 'ssh', 'api', or 'auto'
   * @returns {Promise<Object>}
   */
  async implementApprovedChange(sessionId, approvalId, method = 'auto') {
    const approval = approvalSystem.getApproval(approvalId);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }

    if (approval.status !== 'approved') {
      throw new Error(`Change not approved. Status: ${approval.status}`);
    }

    // Get new content from sandbox or approval file
    let newContent = '';
    const approvalFile = path.join(__dirname, "../logs/approvals", `${approvalId}.json`);
    
    if (fs.existsSync(approvalFile)) {
      const approvalData = JSON.parse(fs.readFileSync(approvalFile, 'utf8'));
      newContent = approvalData.newContent || '';
    }

    // Try sandbox if not in approval file
    if (!newContent) {
      const sandboxPath = path.join(__dirname, "../sandbox", path.basename(approval.filePath));
      if (fs.existsSync(sandboxPath)) {
        newContent = fs.readFileSync(sandboxPath, 'utf8');
      }
    }

    if (!newContent) {
      throw new Error(`New content not found for approval ${approvalId}. Please provide content.`);
    }

    // Authorize the write
    readOnlyMode.authorize(`approval_${approvalId}`);

    // Implement the change (skip sandbox - already tested)
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (method === 'auto') {
      method = session.type === 'ssh' ? 'ssh' : 'api';
    }

    if (method === 'ssh') {
      await remoteFileSystem.writeFileSSH(sessionId, approval.filePath, newContent);
    } else if (method === 'api') {
      await remoteFileSystem.writeFileAPI(sessionId, approval.filePath, newContent);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }

    auditSystem.recordAuthorizedWrite(approval.filePath, newContent.length);
    auditSystem.log('CHANGE_IMPLEMENTED', { approvalId, filePath: approval.filePath });
    logger.info(`Approved change implemented: ${approvalId} - ${approval.filePath}`);

    return {
      status: 'implemented',
      approvalId,
      filePath: approval.filePath,
      size: newContent.length
    };
  }

  /**
   * Detect language from file path and content
   * @param {string} filePath
   * @param {string} content
   * @returns {string}
   */
  detectLanguage(filePath, content) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return langMap[ext] || 'unknown';
  }

  /**
   * List files in directory
   * @param {string} sessionId
   * @param {string} dirPath
   * @param {string} method - 'ssh', 'api', or 'auto'
   * @returns {Promise<Array>}
   */
  async listFiles(sessionId, dirPath, method = 'auto') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (method === 'auto') {
      method = session.type === 'ssh' ? 'ssh' : 'api';
    }

    if (method === 'ssh') {
      return await remoteFileSystem.listDirectorySSH(sessionId, dirPath);
    } else if (method === 'api') {
      return await remoteFileSystem.listDirectoryAPI(sessionId, dirPath);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Execute command (SSH only)
   * @param {string} sessionId
   * @param {string} command
   * @returns {Promise<Object>}
   */
  async executeCommand(sessionId, command) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.type !== 'ssh') {
      throw new Error(`Command execution only supported for SSH sessions`);
    }

    return await remoteFileSystem.executeCommandSSH(sessionId, command);
  }

  /**
   * Get current page/screen content
   * @param {string} sessionId
   * @returns {Promise<string>}
   */
  async getCurrentUrl(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.type === 'web') {
      return await webAutomation.getCurrentUrl(sessionId);
    } else if (session.type === 'api') {
      return session.endpoint || session.url || 'N/A';
    } else {
      throw new Error(`getCurrentUrl not supported for session type: ${session.type}`);
    }
  }

  async getCurrentContent(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.type === 'web') {
      return await webAutomation.getPageContent(sessionId);
    } else {
      throw new Error(`Content retrieval not supported for session type: ${session.type}`);
    }
  }

  /**
   * Take screenshot (web only)
   * @param {string} sessionId
   * @param {string} path - Optional file path
   * @returns {Promise<Buffer|string>}
   */
  async screenshot(sessionId, path = null) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.type !== 'web') {
      throw new Error(`Screenshot only supported for web sessions`);
    }

    return await webAutomation.screenshot(sessionId, path);
  }

  /**
   * Close session and cleanup
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async closeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return; // Already closed
    }

    // Close browser if web session
    if (session.type === 'web') {
      await webAutomation.closeBrowser(sessionId);
    }

    // Remove API client if API session
    if (session.type === 'api') {
      apiClient.removeClient(sessionId);
    }

    // Clear credentials
    credentialManager.clearSession(sessionId);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    logger.info(`Session closed: ${sessionId}`);
  }

  /**
   * Close all sessions
   * @returns {Promise<void>}
   */
  async closeAllSessions() {
    const sessionIds = Array.from(this.activeSessions.keys());
    await Promise.all(sessionIds.map(id => this.closeSession(id)));
    logger.info("All sessions closed");
  }

  /**
   * Get session info
   * @param {string} sessionId
   * @returns {Object}
   */
  getSessionInfo(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const credInfo = credentialManager.getSessionInfo(sessionId);
    return {
      ...session,
      ...credInfo
    };
  }

  /**
   * List all active sessions
   * @returns {Array}
   */
  listSessions() {
    return Array.from(this.activeSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      ...session,
      ...credentialManager.getSessionInfo(sessionId)
    }));
  }

  /**
   * Execute command on local computer
   * @param {string} command - Command to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>}
   */
  async executeLocalCommand(command, options = {}) {
    return await localExecutor.executeCommand(command, options);
  }

  /**
   * Read local file
   * @param {string} filePath - File path
   * @returns {Promise<string>}
   */
  async readLocalFile(filePath) {
    return await localExecutor.readFile(filePath);
  }

  /**
   * Write local file (requires approval)
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @param {string} reason - Reason for change
   * @returns {Promise<Object>}
   */
  async writeLocalFile(filePath, content, reason = 'File modification') {
    return await localExecutor.writeFile(filePath, content, reason);
  }

  /**
   * List local directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>}
   */
  async listLocalDirectory(dirPath) {
    return await localExecutor.listDirectory(dirPath);
  }
}

export const navigationController = new NavigationController();
export default navigationController;

