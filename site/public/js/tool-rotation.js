/**
 * Tool Rotation System (Client-Side)
 * Ensures tools rotate daily on a fair, consistent schedule
 * NO BACKEND REQUIRED - works entirely client-side
 */

class ToolRotation {
  constructor() {
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
      console.warn('No tools provided for rotation');
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
        date: date,
        dateStr: this.getDateKey(date),
        tool: tool
      });
    }

    return schedule;
  }

  /**
   * Get next rotation info
   * @returns {Object} { hoursUntil, minutesUntil, formatted }
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
      hoursUntil: hoursUntil,
      minutesUntil: minutesUntil,
      formatted: `${hoursUntil}h ${minutesUntil}m`
    };
  }
}

// Make available globally
window.ToolRotation = ToolRotation;

