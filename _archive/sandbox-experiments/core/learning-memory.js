import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const memoryDir = path.join(__dirname, "../memory");

// Ensure memory directory exists
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

/**
 * Learning and Memory System
 * Saves learned patterns, commands, and solutions to OS memory (disk)
 */
class LearningMemory {
  constructor() {
    this.memoryFile = path.join(memoryDir, "learned.json");
    this.commandHistoryFile = path.join(memoryDir, "commands.json");
    this.solutionsFile = path.join(memoryDir, "solutions.json");
    this.patternsFile = path.join(memoryDir, "patterns.json");
    
    this.memory = this.loadMemory();
    this.commandHistory = this.loadCommandHistory();
    this.solutions = this.loadSolutions();
    this.patterns = this.loadPatterns();
  }

  /**
   * Load memory from disk
   * @returns {Object}
   */
  loadMemory() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const content = fs.readFileSync(this.memoryFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`Failed to load memory: ${error.message}`);
    }
    return {
      learned: [],
      patterns: {},
      lastUpdated: null
    };
  }

  /**
   * Save memory to disk
   */
  saveMemory() {
    try {
      this.memory.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.memoryFile, JSON.stringify(this.memory, null, 2), 'utf8');
      auditSystem.log('MEMORY_SAVED', { file: this.memoryFile });
    } catch (error) {
      logger.error(`Failed to save memory: ${error.message}`);
    }
  }

  /**
   * Load command history
   * @returns {Array}
   */
  loadCommandHistory() {
    try {
      if (fs.existsSync(this.commandHistoryFile)) {
        const content = fs.readFileSync(this.commandHistoryFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`Failed to load command history: ${error.message}`);
    }
    return [];
  }

  /**
   * Save command history
   */
  saveCommandHistory() {
    try {
      fs.writeFileSync(
        this.commandHistoryFile, 
        JSON.stringify(this.commandHistory, null, 2), 
        'utf8'
      );
    } catch (error) {
      logger.error(`Failed to save command history: ${error.message}`);
    }
  }

  /**
   * Load solutions
   * @returns {Object}
   */
  loadSolutions() {
    try {
      if (fs.existsSync(this.solutionsFile)) {
        const content = fs.readFileSync(this.solutionsFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`Failed to load solutions: ${error.message}`);
    }
    return {};
  }

  /**
   * Save solutions
   */
  saveSolutions() {
    try {
      fs.writeFileSync(
        this.solutionsFile, 
        JSON.stringify(this.solutions, null, 2), 
        'utf8'
      );
    } catch (error) {
      logger.error(`Failed to save solutions: ${error.message}`);
    }
  }

  /**
   * Load patterns
   * @returns {Object}
   */
  loadPatterns() {
    try {
      if (fs.existsSync(this.patternsFile)) {
        const content = fs.readFileSync(this.patternsFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`Failed to load patterns: ${error.message}`);
    }
    return {};
  }

  /**
   * Save patterns
   */
  savePatterns() {
    try {
      fs.writeFileSync(
        this.patternsFile, 
        JSON.stringify(this.patterns, null, 2), 
        'utf8'
      );
    } catch (error) {
      logger.error(`Failed to save patterns: ${error.message}`);
    }
  }

  /**
   * Learn from command execution
   * @param {string} command - Command executed
   * @param {Object} result - Execution result
   * @param {string} context - Context/description
   */
  learnFromCommand(command, result, context = '') {
    const learning = {
      timestamp: new Date().toISOString(),
      command,
      result: {
        success: result.success,
        exitCode: result.exitCode,
        output: result.stdout?.substring(0, 500) // Limit output size
      },
      context
    };

    this.memory.learned.push(learning);
    
    // Keep only last 1000 learnings
    if (this.memory.learned.length > 1000) {
      this.memory.learned = this.memory.learned.slice(-1000);
    }

    this.saveMemory();
    auditSystem.log('LEARNING_RECORDED', { command, success: result.success });
  }

  /**
   * Record command execution
   * @param {string} command - Command executed
   * @param {Object} result - Execution result
   */
  recordCommand(command, result) {
    const record = {
      timestamp: new Date().toISOString(),
      command,
      success: result.success,
      exitCode: result.exitCode,
      duration: result.duration
    };

    this.commandHistory.push(record);
    
    // Keep only last 500 commands
    if (this.commandHistory.length > 500) {
      this.commandHistory = this.commandHistory.slice(-500);
    }

    this.saveCommandHistory();
  }

  /**
   * Save solution for a problem
   * @param {string} problem - Problem description
   * @param {string} solution - Solution applied
   * @param {boolean} successful - Whether solution worked
   */
  saveSolution(problem, solution, successful = true) {
    const key = problem.toLowerCase().replace(/\s+/g, '_');
    
    if (!this.solutions[key]) {
      this.solutions[key] = [];
    }

    this.solutions[key].push({
      timestamp: new Date().toISOString(),
      solution,
      successful,
      problem
    });

    // Keep only last 10 solutions per problem
    if (this.solutions[key].length > 10) {
      this.solutions[key] = this.solutions[key].slice(-10);
    }

    this.saveSolutions();
    auditSystem.log('SOLUTION_SAVED', { problem, successful });
  }

  /**
   * Get solution for a problem
   * @param {string} problem - Problem description
   * @returns {Array} Solutions
   */
  getSolutions(problem) {
    const key = problem.toLowerCase().replace(/\s+/g, '_');
    return this.solutions[key] || [];
  }

  /**
   * Learn pattern from repeated operations
   * @param {string} patternType - Type of pattern
   * @param {Object} pattern - Pattern data
   */
  learnPattern(patternType, pattern) {
    if (!this.patterns[patternType]) {
      this.patterns[patternType] = [];
    }

    this.patterns[patternType].push({
      timestamp: new Date().toISOString(),
      ...pattern
    });

    // Keep only last 50 patterns per type
    if (this.patterns[patternType].length > 50) {
      this.patterns[patternType] = this.patterns[patternType].slice(-50);
    }

    this.savePatterns();
    auditSystem.log('PATTERN_LEARNED', { type: patternType });
  }

  /**
   * Get learned patterns
   * @param {string} patternType - Type of pattern
   * @returns {Array}
   */
  getPatterns(patternType) {
    return this.patterns[patternType] || [];
  }

  /**
   * Find similar past commands
   * @param {string} command - Command to find similar to
   * @returns {Array}
   */
  findSimilarCommands(command) {
    const cmdLower = command.toLowerCase();
    return this.commandHistory
      .filter(c => c.command.toLowerCase().includes(cmdLower) || 
                   cmdLower.includes(c.command.toLowerCase()))
      .slice(-10)
      .reverse();
  }

  /**
   * Get memory statistics
   * @returns {Object}
   */
  getStats() {
    return {
      learnedCount: this.memory.learned.length,
      commandHistoryCount: this.commandHistory.length,
      solutionsCount: Object.keys(this.solutions).length,
      patternsCount: Object.keys(this.patterns).length,
      lastUpdated: this.memory.lastUpdated
    };
  }
}

export const learningMemory = new LearningMemory();
export default learningMemory;

