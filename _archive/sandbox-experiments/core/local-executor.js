import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import readOnlyMode from "./readonly-mode.js";
import sandboxTester from "./sandbox-tester.js";
import errorTracker from "./error-tracker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Local Command Executor
 * Executes commands on local computer with security and logging
 */
class LocalExecutor {
  constructor() {
    this.executionHistory = [];
    this.safeCommands = ['ls', 'dir', 'pwd', 'cd', 'cat', 'type', 'echo', 'git', 'npm', 'node'];
    this.dangerousCommands = ['rm', 'del', 'format', 'shutdown', 'reboot', 'sudo', 'su'];
  }

  /**
   * Check if command is safe to execute
   * @param {string} command
   * @returns {Object} { safe: boolean, reason: string }
   */
  isCommandSafe(command) {
    const cmd = command.trim().split(/\s+/)[0].toLowerCase();
    
    // Check for dangerous commands
    if (this.dangerousCommands.some(dangerous => cmd.includes(dangerous))) {
      return { safe: false, reason: `Command contains dangerous operation: ${cmd}` };
    }

    // Check for file system modifications
    if (command.includes('rm ') || command.includes('del ') || 
        command.includes('delete ') || command.includes('remove ')) {
      return { safe: false, reason: 'Command may delete files' };
    }

    // Check for system modifications
    if (command.includes('format') || command.includes('shutdown') || 
        command.includes('reboot') || command.includes('sudo')) {
      return { safe: false, reason: 'Command may modify system' };
    }

    return { safe: true, reason: 'Command appears safe' };
  }

  /**
   * Execute command with security checks
   * @param {string} command - Command to execute
   * @param {Object} options - { cwd, env, timeout, requireApproval }
   * @returns {Promise<Object>} Execution result
   */
  async executeCommand(command, options = {}) {
    const {
      cwd = process.cwd(),
      env = process.env,
      timeout = 30000,
      requireApproval = true
    } = options;

    // Log execution attempt
    auditSystem.log('COMMAND_EXECUTION_REQUESTED', {
      command,
      cwd,
      timestamp: new Date().toISOString()
    });

    // Check if command is safe
    const safetyCheck = this.isCommandSafe(command);
    
    if (!safetyCheck.safe && requireApproval) {
      // Check authorization
      if (!readOnlyMode.isAuthorized('execute_command', command)) {
        auditSystem.recordWriteAttempt(command, `Command execution not authorized: ${safetyCheck.reason}`);
        throw new Error(`Command execution not authorized: ${safetyCheck.reason}`);
      }
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      // Use exec for simple commands, spawn for complex ones
      const process = spawn(command, [], {
        shell: true,
        cwd,
        env: { ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('error', (error) => {
        const executionResult = {
          command,
          success: false,
          error: error.message,
          stdout: '',
          stderr: '',
          exitCode: -1,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };

        this.executionHistory.push(executionResult);
        auditSystem.log('COMMAND_EXECUTION_FAILED', executionResult);
        
        // Record error with full context
        errorTracker.recordError(error, {
          command,
          operation: 'executeCommand',
          module: 'local-executor',
          function: 'executeCommand',
          cwd,
          exitCode: -1
        });
        
        reject(error);
      });

      process.on('close', (code) => {
        const executionResult = {
          command,
          success: code === 0,
          stdout,
          stderr,
          exitCode: code,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cwd
        };

        this.executionHistory.push(executionResult);
        auditSystem.log('COMMAND_EXECUTION_COMPLETE', executionResult);

        if (code === 0) {
          resolve(executionResult);
        } else {
          const error = new Error(`Command failed with exit code ${code}: ${stderr || stdout}`);
          
          // Record error with full context
          errorTracker.recordError(error, {
            command,
            operation: 'executeCommand',
            module: 'local-executor',
            function: 'executeCommand',
            cwd,
            exitCode: code,
            stdout,
            stderr
          });
          
          reject(error);
        }
      });

      // Timeout handling
      if (timeout > 0) {
        setTimeout(() => {
          if (!process.killed) {
            process.kill();
            const error = new Error(`Command timed out after ${timeout}ms`);
            auditSystem.log('COMMAND_EXECUTION_TIMEOUT', { command, timeout });
            
            // Record timeout error
            errorTracker.recordError(error, {
              command,
              operation: 'executeCommand',
              module: 'local-executor',
              function: 'executeCommand',
              cwd,
              timeout
            });
            
            reject(error);
          }
        }, timeout);
      }
    });
  }

  /**
   * Read local file
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File content
   */
  async readFile(filePath) {
    const fullPath = path.resolve(filePath);
    
    auditSystem.log('LOCAL_FILE_READ', { filePath: fullPath });

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      auditSystem.recordFileRead(fullPath, content.length);
      return content;
    } catch (error) {
      auditSystem.recordIssue('FILE_READ_ERROR', `Failed to read file: ${filePath}`, {
        file: filePath,
        error: error.message,
        severity: 'medium'
      });
      
      // Record error with context
      errorTracker.recordError(error, {
        filePath: fullPath,
        operation: 'readFile',
        module: 'local-executor',
        function: 'readFile'
      });
      
      throw error;
    }
  }

  /**
   * Write local file (requires approval)
   * @param {string} filePath - Path to file
   * @param {string} content - File content
   * @param {string} reason - Reason for change
   * @returns {Promise<Object>} Result
   */
  async writeFile(filePath, content, reason = 'File modification') {
    const fullPath = path.resolve(filePath);

    // Check authorization
    if (!readOnlyMode.isAuthorized('write_file', fullPath)) {
      auditSystem.recordWriteAttempt(fullPath, 'File write not authorized');
      throw new Error(`File write not authorized: ${fullPath}`);
    }

    // Sandbox test if it's a code file
    const ext = path.extname(fullPath).toLowerCase();
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json'];
    
    if (codeExtensions.includes(ext)) {
      const language = ext === '.py' ? 'python' : 
                      ext === '.json' ? 'json' : 'javascript';
      
      // Read original if exists
      let originalContent = '';
      try {
        originalContent = await this.readFile(fullPath);
      } catch (error) {
        // File doesn't exist, that's okay
      }

      // Test in sandbox
      const testResults = await sandboxTester.testChange(fullPath, content, language);
      
      if (testResults.overallStatus === 'fail') {
        const error = new Error(`Sandbox test failed: ${testResults.syntaxTest.errors.join(', ')}`);
        
        // Record sandbox test error
        errorTracker.recordError(error, {
          filePath: fullPath,
          operation: 'writeFile',
          module: 'local-executor',
          function: 'writeFile',
          reason,
          testResults
        });
        
        throw error;
      }

      // Request approval
      const approvalSystem = (await import('./approval-system.js')).default;
      const approvalRequest = await approvalSystem.requestApproval(
        fullPath,
        originalContent,
        content,
        reason,
        testResults
      );

      return {
        status: 'pending_approval',
        approvalId: approvalRequest.id,
        message: `Change tested in sandbox. Approval required. ID: ${approvalRequest.id}`
      };
    }

    // For non-code files, just write (if authorized)
    fs.writeFileSync(fullPath, content, 'utf8');
    auditSystem.recordAuthorizedWrite(fullPath, content.length);
    logger.info(`File written: ${fullPath}`);

    return {
      status: 'written',
      filePath: fullPath,
      size: content.length
    };
  }

  /**
   * List directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} Directory contents
   */
  async listDirectory(dirPath) {
    const fullPath = path.resolve(dirPath);
    
    auditSystem.log('LOCAL_DIRECTORY_LIST', { dirPath: fullPath });

    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      return items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(fullPath, item.name)
      }));
    } catch (error) {
      auditSystem.recordIssue('DIRECTORY_LIST_ERROR', `Failed to list directory: ${dirPath}`, {
        error: error.message,
        severity: 'low'
      });
      
      // Record error with context
      errorTracker.recordError(error, {
        dirPath: fullPath,
        operation: 'listDirectory',
        module: 'local-executor',
        function: 'listDirectory'
      });
      
      throw error;
    }
  }

  /**
   * Get execution history
   * @returns {Array}
   */
  getExecutionHistory() {
    return this.executionHistory;
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }
}

export const localExecutor = new LocalExecutor();
export default localExecutor;

