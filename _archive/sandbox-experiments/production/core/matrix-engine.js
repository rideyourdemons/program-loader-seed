/**
 * Production Matrix Engine - Routing & Relevance Only
 * 
 * PURPOSE: Route users to relevant educational self-help tools based on engagement signals
 * CONSTRAINTS: No persuasion, no emotional inference, no diagnostic language
 * SCOPE: Educational routing and relevance scoring only
 */

import { EthicsGuard } from './ethics-guard.js';
import { AnalyticsGuard } from './analytics-guard.js';

export class MatrixEngine {
  constructor() {
    this.ethicsGuard = new EthicsGuard();
    this.analyticsGuard = new AnalyticsGuard();
    this.stateRegistry = null; // Loaded from state-registry.json
    this.weightTable = null; // Loaded from weight-table.json
    this.auditLog = []; // In-memory cache of audit-log.json
  }

  /**
   * Initialize engine with state registry and weight table
   * @param {Object} stateRegistry - Loaded from state-registry.json
   * @param {Object} weightTable - Loaded from weight-table.json
   */
  async initialize(stateRegistry, weightTable) {
    this.stateRegistry = stateRegistry;
    this.weightTable = weightTable;
  }

  /**
   * Classify user interaction into educational/self-help state
   * NON-CLINICAL: Only educational states, no emotional or diagnostic inference
   * @param {Object} interaction - User interaction data
   * @returns {string} State ID from state-registry.json
   */
  classifyInteraction(interaction) {
    // Check content for ethics violations first
    if (interaction.content) {
      const ethicsCheck = this.ethicsGuard.checkContent(interaction.content);
      if (!ethicsCheck.allowed) {
        this.logAudit('ethics_violation', {
          action: 'Interaction blocked by ethics guard',
          violations: ethicsCheck.violations,
          interaction
        });
        return null; // Block interaction
      }
    }

    // Simple state classification based on user actions (no emotional inference)
    if (interaction.action === 'browse' || interaction.action === 'search') {
      return 'seeking_information';
    }
    
    if (interaction.action === 'use_tool' || interaction.action === 'practice') {
      return 'practicing_technique';
    }
    
    if (interaction.action === 'review' || interaction.action === 'reflect') {
      return 'reflecting';
    }
    
    if (interaction.action === 'explore' || interaction.action === 'compare') {
      return 'exploring_options';
    }
    
    if (interaction.action === 'schedule' || interaction.action === 'track') {
      return 'building_habit';
    }

    // Default to seeking information
    return 'seeking_information';
  }

  /**
   * Route to tools based on relevance signals only
   * NO PERSUASION: Only relevance scoring based on engagement, clarity, usefulness
   * @param {string} stateId - Current user state
   * @param {Object} signals - Engagement signals (completion, time_spent, return_visit, etc.)
   * @returns {Array} Array of tool recommendations with relevance scores
   */
  routeToTools(stateId, signals = {}) {
    if (!this.stateRegistry || !this.weightTable) {
      throw new Error('MatrixEngine not initialized. Call initialize() first.');
    }

    const state = this.stateRegistry.states[stateId];
    if (!state) {
      return [];
    }

    // Get allowed actions for this state
    const allowedActions = state.allowed_actions || [];
    
    // Get tools with weights
    const tools = Object.entries(this.weightTable.tools || {})
      .map(([toolId, toolData]) => {
        // Calculate relevance score based on:
        // 1. Tool weight (from engagement history)
        // 2. Engagement signals (if available)
        // 3. State compatibility
        
        let relevanceScore = toolData.weight || 1.0;

        // Adjust based on positive engagement signals (bounded)
        if (signals.positive_engagement) {
          relevanceScore = Math.min(
            relevanceScore + (signals.positive_engagement * 0.1),
            this.weightTable.constraints.max_weight
          );
        }

        // Adjust based on negative engagement signals (bounded)
        if (signals.negative_engagement) {
          relevanceScore = Math.max(
            relevanceScore - (signals.negative_engagement * 0.05),
            this.weightTable.constraints.min_weight
          );
        }

        return {
          toolId,
          relevanceScore,
          weight: toolData.weight,
          allowed: allowedActions.includes('use_tool') || allowedActions.includes('browse_tools')
        };
      })
      .filter(tool => tool.allowed) // Only include tools allowed in current state
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance

    return tools;
  }

  /**
   * Update tool weight based on engagement signal
   * BOUNDED: All adjustments are capped and logged
   * ANALYTICS-GUARDED: If signal comes from analytics, must pass analytics guard validation
   * @param {string} toolId - Tool identifier
   * @param {string} signalType - 'positive' | 'negative' | 'neutral'
   * @param {Object} signalData - Additional signal data (may include analytics data)
   */
  updateToolWeight(toolId, signalType, signalData = {}) {
    // If signal data comes from analytics, validate it through analytics guard
    if (signalData.source === 'analytics' && signalData.analyticsData) {
      const analyticsValidation = this.analyticsGuard.validateMatrixUse(
        signalData.analyticsData,
        'weight_adjustment'
      );
      
      if (!analyticsValidation.allowed) {
        this.logAudit('analytics_matrix_use', {
          action: `Blocked analytics-based weight adjustment for ${toolId}`,
          reason: `Analytics guard violation: ${analyticsValidation.violations.join('; ')}`,
          approved_by: 'analytics_guard',
          reversible: false
        });
        return; // Fail closed - don't adjust weight
      }

      // Sanitize analytics data before use
      signalData.analyticsData = this.analyticsGuard.sanitizeForMatrix(signalData.analyticsData);
    }
    if (!this.weightTable || !this.weightTable.tools[toolId]) {
      return;
    }

    const tool = this.weightTable.tools[toolId];
    const rules = this.weightTable.adjustment_rules;
    const constraints = this.weightTable.constraints;

    // Get adjustment amount based on signal type
    let adjustment = 0;
    if (signalType === 'positive') {
      adjustment = parseFloat(rules.positive_engagement.weight_change);
    } else if (signalType === 'negative') {
      adjustment = parseFloat(rules.negative_engagement.weight_change);
    }

    // Apply daily adjustment cap
    const today = new Date().toISOString().split('T')[0];
    const todayAdjustments = tool.adjustment_history
      .filter(adj => adj.date === today)
      .reduce((sum, adj) => sum + Math.abs(adj.adjustment), 0);

    if (Math.abs(adjustment) + todayAdjustments > constraints.max_daily_adjustment) {
      adjustment = Math.sign(adjustment) * (constraints.max_daily_adjustment - todayAdjustments);
    }

    // Apply adjustment (bounded)
    const oldWeight = tool.weight;
    const newWeight = Math.max(
      constraints.min_weight,
      Math.min(constraints.max_weight, oldWeight + adjustment)
    );

    // Update tool data
    tool.weight = newWeight;
    tool.last_updated = new Date().toISOString();
    tool.engagement_signals[signalType] = (tool.engagement_signals[signalType] || 0) + 1;
    tool.adjustment_history.push({
      date: today,
      adjustment,
      oldWeight,
      newWeight,
      signalType,
      reason: signalData.reason || 'Engagement signal'
    });

    // Log to audit
    this.logAudit('weight_adjustment', {
      action: `Updated weight for ${toolId}`,
      before: oldWeight,
      after: newWeight,
      reason: `Engagement signal: ${signalType}`,
      approved_by: 'system',
      reversible: true,
      reversal_method: `Revert weight to ${oldWeight} and remove adjustment entry`
    });
  }

  /**
   * Self-correct: Reduce prominence of tools with negative signals
   * SAFE: Never deletes, only reduces prominence
   * @param {string} toolId - Tool identifier
   * @param {Object} negativeSignals - Drop-offs, confusion, negative feedback
   */
  selfCorrect(toolId, negativeSignals) {
    if (!negativeSignals || Object.keys(negativeSignals).length === 0) {
      return;
    }

    // Count negative signals
    const dropOffs = negativeSignals.drop_off || 0;
    const confusion = negativeSignals.confusion || 0;
    const negativeFeedback = negativeSignals.negative_feedback || 0;

    // Apply correction (reduce weight)
    if (dropOffs > 0 || confusion > 0 || negativeFeedback > 0) {
      this.updateToolWeight(toolId, 'negative', {
        reason: `Self-correction: drop_off=${dropOffs}, confusion=${confusion}, negative_feedback=${negativeFeedback}`
      });
    }

    this.logAudit('self_correction', {
      action: `Self-corrected ${toolId}`,
      reason: 'Negative engagement signals detected',
      signals: negativeSignals
    });
  }

  /**
   * Log audit entry (append-only)
   * @param {string} type - Audit entry type
   * @param {Object} data - Audit data
   */
  logAudit(type, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      ...data
    };

    this.auditLog.push(entry);

    // In production, this would also append to audit-log.json
    // For now, we keep it in memory
  }

  /**
   * Get audit log entries
   * @param {Object} filters - Optional filters
   * @returns {Array} Audit log entries
   */
  getAuditLog(filters = {}) {
    let entries = [...this.auditLog];

    if (filters.type) {
      entries = entries.filter(e => e.type === filters.type);
    }

    if (filters.since) {
      entries = entries.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    return entries;
  }
}

