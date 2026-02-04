/**
 * AI-Guided Tour System
 * Provides step-by-step guidance with progress tracking
 */

import { logger } from './logger.js';

export class AITourGuide {
  constructor(storageBackend = null) {
    this.storageBackend = storageBackend; // Could be Firebase, localStorage, etc.
    this.currentStep = 0;
    this.isActive = false;
    this.isCompleted = false;
    this.tourSteps = this.getDefaultTourSteps();
  }

  /**
   * Default tour steps configuration
   * @returns {Array}
   */
  getDefaultTourSteps() {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Ride Your Demons',
        description: 'Let us guide you through the platform to help you get the most out of your journey.',
        targetElement: null, // No specific target for welcome
        position: 'center', // center, top, bottom, left, right
        content: `
          <h3>Welcome!</h3>
          <p>This brief tour will help you navigate our platform and discover tools that can support your journey.</p>
          <p>You can skip or pause at any time and return later.</p>
        `,
        actionButton: 'Start Tour'
      },
      {
        id: 'search',
        title: 'Search for What You Need',
        description: 'Search for any challenge, pain point, or topic you\'re dealing with.',
        targetElement: '[data-tour="search"]', // CSS selector
        position: 'bottom',
        content: `
          <h3>Find Support</h3>
          <p>Use the search to find specific challenges or pain points you're experiencing.</p>
          <p>We have tools and resources for a wide range of topics.</p>
        `,
        actionButton: 'Next'
      },
      {
        id: 'tools',
        title: 'Explore Tools',
        description: 'Discover practical, research-backed tools to help you work through challenges.',
        targetElement: '[data-tour="tools"]',
        position: 'right',
        content: `
          <h3>Self-Help Tools</h3>
          <p>Each challenge includes three evidence-based tools you can use right away.</p>
          <p>Tools include step-by-step guides and explanations of how they work.</p>
        `,
        actionButton: 'Next'
      },
      {
        id: 'tool-of-day',
        title: 'Tool of the Day',
        description: 'Check out our featured tool that changes daily.',
        targetElement: '[data-tour="tool-of-day"]',
        position: 'bottom',
        content: `
          <h3>Daily Inspiration</h3>
          <p>We feature a different tool every day to help you discover new resources.</p>
          <p>Come back daily to explore something new!</p>
        `,
        actionButton: 'Next'
      },
      {
        id: 'research',
        title: 'Research-Backed Information',
        description: 'All our content is backed by scientific research and properly cited.',
        targetElement: '[data-tour="research"]',
        position: 'top',
        content: `
          <h3>Evidence-Based</h3>
          <p>Everything on our platform is supported by research and properly cited.</p>
          <p>You can explore the science behind each tool to understand how and why it works.</p>
        `,
        actionButton: 'Next'
      },
      {
        id: 'navigation',
        title: 'Navigate with Ease',
        description: 'Use the navigation to explore different sections and find what you need.',
        targetElement: '[data-tour="navigation"]',
        position: 'bottom',
        content: `
          <h3>Easy Navigation</h3>
          <p>Use the main navigation to explore different areas of the platform.</p>
          <p>Everything is organized to help you find support quickly.</p>
        `,
        actionButton: 'Next'
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        description: 'You\'re ready to explore and find the support you need.',
        targetElement: null,
        position: 'center',
        content: `
          <h3>Ready to Begin</h3>
          <p>You now know the basics of navigating our platform.</p>
          <p>Start by searching for something you're dealing with, or explore the tool of the day!</p>
        `,
        actionButton: 'Start Exploring'
      }
    ];
  }

  /**
   * Start the tour
   * @param {number} startStep - Optional step to start from (0-based)
   */
  start(startStep = 0) {
    this.isActive = true;
    this.currentStep = startStep;
    this.isCompleted = false;
    
    logger.info(`Tour started at step ${startStep + 1}/${this.tourSteps.length}`);
    
    // Save tour state
    this.saveTourState();
    
    return this.getCurrentStepData();
  }

  /**
   * Move to next step
   * @returns {Object|null} Next step data or null if completed
   */
  next() {
    if (!this.isActive) {
      logger.warn('Tour is not active. Call start() first.');
      return null;
    }

    if (this.currentStep >= this.tourSteps.length - 1) {
      return this.complete();
    }

    this.currentStep++;
    this.saveTourState();
    
    logger.info(`Tour advanced to step ${this.currentStep + 1}/${this.tourSteps.length}`);
    
    return this.getCurrentStepData();
  }

  /**
   * Move to previous step
   * @returns {Object|null} Previous step data or null if at start
   */
  previous() {
    if (!this.isActive) {
      return null;
    }

    if (this.currentStep <= 0) {
      return this.getCurrentStepData(); // Already at first step
    }

    this.currentStep--;
    this.saveTourState();
    
    logger.info(`Tour went back to step ${this.currentStep + 1}/${this.tourSteps.length}`);
    
    return this.getCurrentStepData();
  }

  /**
   * Skip to a specific step
   * @param {number} stepIndex
   * @returns {Object|null}
   */
  goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.tourSteps.length) {
      logger.warn(`Invalid step index: ${stepIndex}`);
      return null;
    }

    this.currentStep = stepIndex;
    this.saveTourState();
    
    return this.getCurrentStepData();
  }

  /**
   * Complete the tour
   * @returns {Object} Completion data
   */
  complete() {
    this.isActive = false;
    this.isCompleted = true;
    this.currentStep = this.tourSteps.length - 1;
    
    logger.info('Tour completed');
    
    this.saveTourState();
    
    return {
      completed: true,
      step: this.getCurrentStepData(),
      progress: 100
    };
  }

  /**
   * Skip/exit the tour
   */
  skip() {
    this.isActive = false;
    logger.info('Tour skipped');
    this.saveTourState();
  }

  /**
   * Reset the tour (allow it to be taken again)
   */
  reset() {
    this.isActive = false;
    this.isCompleted = false;
    this.currentStep = 0;
    
    logger.info('Tour reset');
    
    // Clear stored state
    if (this.storageBackend) {
      this.clearTourState();
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('ryd_tour_state');
      window.localStorage.removeItem('ryd_tour_completed');
    }
  }

  /**
   * Get current step data
   * @returns {Object}
   */
  getCurrentStepData() {
    if (this.currentStep < 0 || this.currentStep >= this.tourSteps.length) {
      return null;
    }

    const step = this.tourSteps[this.currentStep];
    return {
      ...step,
      stepNumber: this.currentStep + 1,
      totalSteps: this.tourSteps.length,
      progress: Math.round(((this.currentStep + 1) / this.tourSteps.length) * 100),
      isFirst: this.currentStep === 0,
      isLast: this.currentStep === this.tourSteps.length - 1
    };
  }

  /**
   * Get progress percentage
   * @returns {number} 0-100
   */
  getProgress() {
    if (!this.isActive) {
      return this.isCompleted ? 100 : 0;
    }
    return Math.round(((this.currentStep + 1) / this.tourSteps.length) * 100);
  }

  /**
   * Check if tour has been completed before
   * @returns {Promise<boolean>}
   */
  async hasBeenCompleted() {
    if (this.storageBackend) {
      try {
        const state = await this.loadTourState();
        return state?.completed || false;
      } catch (error) {
        logger.warn(`Error checking tour completion: ${error.message}`);
        return false;
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('ryd_tour_completed') === 'true';
    }
    return false;
  }

  /**
   * Save tour state
   */
  saveTourState() {
    const state = {
      currentStep: this.currentStep,
      isActive: this.isActive,
      completed: this.isCompleted,
      lastUpdated: new Date().toISOString()
    };

    if (this.storageBackend) {
      // Save to Firebase or other backend
      // This would need to be implemented based on storage backend
      logger.info('Tour state saved to backend');
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('ryd_tour_state', JSON.stringify(state));
      if (this.isCompleted) {
        window.localStorage.setItem('ryd_tour_completed', 'true');
      }
    }
  }

  /**
   * Load tour state
   * @returns {Promise<Object|null>}
   */
  async loadTourState() {
    if (this.storageBackend) {
      // Load from Firebase or other backend
      // This would need to be implemented based on storage backend
      return null;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const stateStr = window.localStorage.getItem('ryd_tour_state');
      if (stateStr) {
        try {
          return JSON.parse(stateStr);
        } catch (error) {
          logger.warn(`Error parsing tour state: ${error.message}`);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Clear tour state
   */
  clearTourState() {
    if (this.storageBackend) {
      // Clear from backend
      logger.info('Tour state cleared from backend');
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('ryd_tour_state');
      window.localStorage.removeItem('ryd_tour_completed');
    }
  }

  /**
   * Customize tour steps
   * @param {Array} customSteps
   */
  setTourSteps(customSteps) {
    if (Array.isArray(customSteps) && customSteps.length > 0) {
      this.tourSteps = customSteps;
      logger.info(`Tour steps customized: ${customSteps.length} steps`);
    } else {
      logger.warn('Invalid tour steps provided, using defaults');
    }
  }

  /**
   * Add custom step
   * @param {Object} step
   * @param {number} position - Optional position (defaults to end)
   */
  addStep(step, position = null) {
    if (!step.id || !step.title) {
      logger.warn('Step must have id and title');
      return;
    }

    if (position !== null && position >= 0 && position <= this.tourSteps.length) {
      this.tourSteps.splice(position, 0, step);
    } else {
      this.tourSteps.push(step);
    }

    logger.info(`Step added: ${step.id}`);
  }
}

export const aiTourGuide = new AITourGuide();
export default aiTourGuide;




