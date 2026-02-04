/**
 * Tool of the Day Rotation System
 * Ensures tools rotate daily on a fair, consistent schedule
 */

import { logger } from './logger.js';

export class ToolRotation {
  constructor(firebaseBackend = null) {
    this.firebaseBackend = firebaseBackend;
    this.cache = {
      currentTool: null,
      lastRotationDate: null,
      toolList: []
    };
  }

  /**
   * Get today's tool (rotates daily)
   * @param {Array} tools - Array of tool objects with id
   * @param {Date} targetDate - Optional date (defaults to today)
   * @returns {Object} Today's tool
   */
  getToolOfTheDay(tools, targetDate = null) {
    if (!tools || tools.length === 0) {
      logger.warn('No tools provided for rotation');
      return null;
    }

    const today = targetDate || new Date();
    const todayKey = this.getDateKey(today);

    // Check cache
    if (this.cache.lastRotationDate === todayKey && this.cache.currentTool) {
      return this.cache.currentTool;
    }

    // Get tool index based on date
    const toolIndex = this.getToolIndexForDate(today, tools.length);
    const selectedTool = tools[toolIndex];

    // Update cache
    this.cache.currentTool = selectedTool;
    this.cache.lastRotationDate = todayKey;
    this.cache.toolList = tools;

    logger.info(`Tool of the day selected: ${selectedTool.id || selectedTool.title} (index: ${toolIndex})`);

    return selectedTool;
  }

  /**
   * Get tool index for a specific date
   * Uses a date-based seed for consistent rotation
   * @param {Date} date
   * @param {number} toolCount
   * @returns {number}
   */
  getToolIndexForDate(date, toolCount) {
    // Create a consistent seed from the date
    // Using year * 366 + dayOfYear ensures same day = same tool
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    
    // Use a hash that cycles through all tools
    const seed = year * 366 + dayOfYear;
    
    // Modulo to cycle through tools
    return seed % toolCount;
  }

  /**
   * Get date key for caching (YYYY-MM-DD)
   * @param {Date} date
   * @returns {string}
   */
  getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get tool rotation schedule
   * @param {Array} tools
   * @param {number} daysAhead - How many days to show ahead
   * @returns {Array} Schedule array
   */
  getRotationSchedule(tools, daysAhead = 7) {
    if (!tools || tools.length === 0) {
      return [];
    }

    const schedule = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const toolIndex = this.getToolIndexForDate(date, tools.length);
      const tool = tools[toolIndex];

      schedule.push({
        date: date.toISOString().split('T')[0],
        dateKey: this.getDateKey(date),
        tool: tool,
        toolIndex: toolIndex,
        isToday: i === 0
      });
    }

    return schedule;
  }

  /**
   * Get next rotation info (when tool will change)
   * @returns {Object} Next rotation info
   */
  getNextRotationInfo() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow - now;
    const hoursUntil = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));

    return {
      nextRotationDate: tomorrow,
      hoursUntil: hoursUntil,
      minutesUntil: minutesUntil,
      formatted: `${hoursUntil}h ${minutesUntil}m`
    };
  }

  /**
   * Get tool from Firebase backend
   * @param {string} toolId
   * @returns {Promise<Object>}
   */
  async getToolFromFirebase(toolId) {
    if (!this.firebaseBackend) {
      throw new Error('Firebase backend not initialized');
    }

    try {
      const tool = await this.firebaseBackend.readDocument(`tools/${toolId}`);
      return tool ? { id: tool.id, ...tool.data } : null;
    } catch (error) {
      logger.error(`Error fetching tool from Firebase: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all tools from Firebase
   * @returns {Promise<Array>}
   */
  async getAllToolsFromFirebase() {
    if (!this.firebaseBackend) {
      throw new Error('Firebase backend not initialized');
    }

    try {
      const tools = await this.firebaseBackend.readCollection('tools', {
        orderBy: [{ field: 'createdAt', direction: 'asc' }]
      });

      return tools.map(tool => ({
        id: tool.id,
        ...tool.data
      }));
    } catch (error) {
      logger.error(`Error fetching tools from Firebase: ${error.message}`);
      return [];
    }
  }

  /**
   * Get today's tool from Firebase
   * @returns {Promise<Object>}
   */
  async getToolOfTheDayFromFirebase() {
    try {
      const tools = await this.getAllToolsFromFirebase();
      if (tools.length === 0) {
        logger.warn('No tools found in Firebase');
        return null;
      }

      return this.getToolOfTheDay(tools);
    } catch (error) {
      logger.error(`Error getting tool of the day from Firebase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify rotation is working correctly
   * Tests that tools rotate properly over time
   * @param {Array} tools
   * @param {number} testDays
   * @returns {Object} Test results
   */
  verifyRotation(tools, testDays = 30) {
    if (!tools || tools.length === 0) {
      return { valid: false, error: 'No tools provided' };
    }

    const today = new Date();
    const toolCounts = {};
    const toolIndices = {};

    // Initialize counts
    tools.forEach((tool, index) => {
      toolCounts[index] = 0;
    });

    // Test rotation over testDays
    for (let i = 0; i < testDays; i++) {
      const testDate = new Date(today);
      testDate.setDate(today.getDate() + i);

      const toolIndex = this.getToolIndexForDate(testDate, tools.length);
      toolCounts[toolIndex] = (toolCounts[toolIndex] || 0) + 1;
      toolIndices[testDate.toISOString().split('T')[0]] = toolIndex;
    }

    // Check distribution (should be roughly equal)
    const expectedCount = Math.floor(testDays / tools.length);
    const counts = Object.values(toolCounts);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    return {
      valid: true,
      toolCounts,
      toolIndices,
      distribution: {
        expected: expectedCount,
        min: minCount,
        max: maxCount,
        variance: maxCount - minCount,
        isEven: (maxCount - minCount) <= 1 // Allow 1 day variance
      },
      testDays
    };
  }

  /**
   * Clear cache (force refresh)
   */
  clearCache() {
    this.cache = {
      currentTool: null,
      lastRotationDate: null,
      toolList: []
    };
    logger.info('Tool rotation cache cleared');
  }
}

export const toolRotation = new ToolRotation();
export default toolRotation;




