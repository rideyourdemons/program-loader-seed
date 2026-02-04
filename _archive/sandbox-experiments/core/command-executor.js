import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import learningMemory from "./learning-memory.js";
import localExecutor from "./local-executor.js";
import navigationController from "./navigation-controller.js";
import firebaseBackend from "./firebase-backend.js";
import readOnlyMode from "./readonly-mode.js";
import sandboxTester from "./sandbox-tester.js";
import approvalSystem from "./approval-system.js";
import errorTracker from "./error-tracker.js";

/**
 * Command Executor
 * Executes user commands with learning and adaptation
 */
class CommandExecutor {
  constructor() {
    this.commandHandlers = new Map();
    this.setupHandlers();
  }

  /**
   * Setup command handlers
   */
  setupHandlers() {
    // Local command execution
    this.commandHandlers.set('execute', async (args) => {
      const command = args.join(' ');
      const result = await localExecutor.executeCommand(command, {
        timeout: 30000,
        requireApproval: true
      });
      learningMemory.recordCommand(command, result);
      learningMemory.learnFromCommand(command, result, 'User command');
      return result;
    });

    // Read file
    this.commandHandlers.set('read', async (args) => {
      const filePath = args[0];
      const content = await localExecutor.readFile(filePath);
      return { success: true, content, size: content.length };
    });

    // Write file
    this.commandHandlers.set('write', async (args) => {
      const filePath = args[0];
      const content = args.slice(1).join(' ');
      const result = await localExecutor.writeFile(filePath, content, 'User command');
      return result;
    });

    // Firebase operations
    this.commandHandlers.set('firebase', async (args) => {
      const operation = args[0];
      const path = args[1];

      if (operation === 'read') {
        if (path.includes('/')) {
          return await firebaseBackend.readDocument(path);
        } else {
          return await firebaseBackend.readCollection(path);
        }
      } else if (operation === 'list') {
        return await firebaseBackend.listUsers();
      }

      throw new Error(`Unknown Firebase operation: ${operation}`);
    });

    // Website operations
    this.commandHandlers.set('website', async (args) => {
      const operation = args[0];
      const sessionId = args[1];

      if (operation === 'navigate') {
        const url = args[2];
        await navigationController.navigateTo(sessionId, url);
        return { success: true, url };
      } else if (operation === 'read') {
        const filePath = args[2];
        const content = await navigationController.readCode(sessionId, filePath);
        return { success: true, content };
      }

      throw new Error(`Unknown website operation: ${operation}`);
    });

    // Monitoring
    this.commandHandlers.set('monitor', async (args) => {
      const monitoringLoops = (await import('./monitoring-loops.js')).default;
      const action = args[0];

      if (action === 'start') {
        const type = args[1];
        const sessionId = args[2];
        const interval = parseInt(args[3]) || 60000;

        if (type === 'firebase') {
          const loopId = monitoringLoops.startFirebaseMonitoring(sessionId, interval);
          return { success: true, loopId, message: 'Firebase monitoring started' };
        } else if (type === 'website') {
          const loopId = monitoringLoops.startWebsiteMonitoring(sessionId, interval);
          return { success: true, loopId, message: 'Website monitoring started' };
        }
      } else if (action === 'stop') {
        const loopId = args[1];
        monitoringLoops.stopLoop(loopId);
        return { success: true, message: `Monitoring loop ${loopId} stopped` };
      } else if (action === 'list') {
        return monitoringLoops.listLoops();
      }

      throw new Error(`Unknown monitor action: ${action}`);
    });
  }

  /**
   * Execute user command
   * @param {string} commandString - Full command string
   * @param {Object} context - Execution context
   * @returns {Promise<Object>}
   */
  async executeCommand(commandString, context = {}) {
    const parts = commandString.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    auditSystem.log('USER_COMMAND_EXECUTED', {
      command: commandString,
      timestamp: new Date().toISOString()
    });

    // Check for learned patterns
    const similarCommands = learningMemory.findSimilarCommands(commandString);
    if (similarCommands.length > 0) {
      logger.info(`Found ${similarCommands.length} similar past commands`);
    }

    // Check for saved solutions
    const solutions = learningMemory.getSolutions(commandString);
    if (solutions.length > 0) {
      const successfulSolutions = solutions.filter(s => s.successful);
      if (successfulSolutions.length > 0) {
        logger.info(`Found ${successfulSolutions.length} previous successful solutions`);
      }
    }

    try {
      const handler = this.commandHandlers.get(command);
      
      if (!handler) {
        // Try as direct command execution
        const result = await localExecutor.executeCommand(commandString, {
          timeout: 30000,
          requireApproval: true
        });
        learningMemory.recordCommand(commandString, result);
        learningMemory.learnFromCommand(commandString, result, 'Direct command');
        return result;
      }

      const result = await handler(args, context);
      
      // Learn from successful execution
      learningMemory.learnFromCommand(commandString, {
        success: true,
        exitCode: 0,
        stdout: JSON.stringify(result)
      }, 'User command');

      return {
        success: true,
        command: commandString,
        result
      };

    } catch (error) {
      // Record error with full context
      const errorRecord = errorTracker.recordError(error, {
        command: commandString,
        operation: 'executeCommand',
        module: 'command-executor',
        function: handler ? 'commandHandler' : 'directCommand',
        args: args
      });

      // Learn from error
      learningMemory.saveSolution(
        `Command execution error: ${commandString}`,
        error.message,
        false
      );

      auditSystem.recordIssue('COMMAND_EXECUTION_ERROR', 
        `Command failed: ${commandString}`, {
        command: commandString,
        error: error.message,
        severity: 'medium',
        errorId: errorRecord.id
      });

      throw error;
    }
  }

  /**
   * Fix issue based on learned patterns
   * @param {string} issue - Issue description
   * @returns {Promise<Object>}
   */
  async fixIssue(issue) {
    // Get solutions for this issue
    const solutions = learningMemory.getSolutions(issue);
    const successfulSolutions = solutions.filter(s => s.successful);

    if (successfulSolutions.length > 0) {
      // Use most recent successful solution
      const solution = successfulSolutions[successfulSolutions.length - 1];
      logger.info(`Applying learned solution for: ${issue}`);

      try {
        // Execute the solution
        const result = await this.executeCommand(solution.solution);
        return {
          success: true,
          issue,
          solution: solution.solution,
          result,
          learned: true
        };
      } catch (error) {
        logger.warn(`Learned solution failed: ${error.message}`);
        // Continue to try other approaches
      }
    }

    // No learned solution, return null
    return {
      success: false,
      issue,
      message: 'No learned solution available',
      learned: false
    };
  }
}

export const commandExecutor = new CommandExecutor();
export default commandExecutor;

