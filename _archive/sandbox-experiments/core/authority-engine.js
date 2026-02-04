/**
 * Enhanced Authority Engine
 * Calculates and amplifies authority scores for self-strengthening SEO matrix
 */

import { logger } from './logger.js';

export class AuthorityEngine {
  constructor(firebaseBackend) {
    this.firebaseBackend = firebaseBackend;
    
    // Authority calculation weights
    this.weights = {
      searchVolume: 0.25,
      userEngagement: 0.30,
      contentDepth: 0.20,
      researchBacking: 0.15,
      matrixResonance: 0.10
    };
  }

  /**
   * Calculate comprehensive authority score for a pain point
   * @param {string} painPointId
   * @returns {Promise<Object>}
   */
  async calculateAuthorityScore(painPointId) {
    try {
      const painPoint = await this.firebaseBackend.readDocument(`painPoints/${painPointId}`);
      if (!painPoint) {
        throw new Error(`Pain point not found: ${painPointId}`);
      }

      const data = painPoint.data;

      // 1. Search Volume Weight
      const searchVolumeWeight = await this.calculateSearchVolumeWeight(data);

      // 2. User Engagement Weight
      const userEngagementWeight = await this.calculateUserEngagementWeight(painPointId, data);

      // 3. Content Depth Weight
      const contentDepthWeight = await this.calculateContentDepthWeight(painPointId, data);

      // 4. Research Backing Weight
      const researchBackingWeight = await this.calculateResearchBackingWeight(painPointId, data);

      // 5. Matrix Resonance Weight
      const matrixResonanceWeight = await this.calculateMatrixResonanceWeight(painPointId, data);

      // Calculate final authority score (0-100)
      const authorityScore = 
        (searchVolumeWeight * this.weights.searchVolume) +
        (userEngagementWeight * this.weights.userEngagement) +
        (contentDepthWeight * this.weights.contentDepth) +
        (researchBackingWeight * this.weights.researchBacking) +
        (matrixResonanceWeight * this.weights.matrixResonance);

      // Calculate E-A-T signals
      const eatSignals = await this.calculateEATSignals(painPointId, data);

      // Calculate freshness score
      const freshnessScore = this.calculateFreshnessScore(data);

      return {
        authorityScore: Math.round(authorityScore * 100) / 100,
        breakdown: {
          searchVolume: searchVolumeWeight,
          userEngagement: userEngagementWeight,
          contentDepth: contentDepthWeight,
          researchBacking: researchBackingWeight,
          matrixResonance: matrixResonanceWeight
        },
        eatSignals,
        freshnessScore,
        trend: data.authorityTrend || 'stable',
        lastCalculated: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Error calculating authority score: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate search volume weight (0-100)
   */
  async calculateSearchVolumeWeight(data) {
    const baseVolume = data.searchVolume || 0;
    const trend = data.searchTrend || 'stable'; // 'up', 'down', 'stable'
    
    // Normalize search volume (0-100 scale)
    // Assuming max search volume in system is ~1M
    const normalizedVolume = Math.min((baseVolume / 10000) * 10, 100);
    
    // Apply trend multiplier
    let trendMultiplier = 1.0;
    if (trend === 'up') trendMultiplier = 1.2;
    if (trend === 'down') trendMultiplier = 0.9;
    
    // Competition factor (lower competition = higher weight)
    const competition = data.competition || 'medium'; // 'low', 'medium', 'high'
    let competitionMultiplier = 1.0;
    if (competition === 'low') competitionMultiplier = 1.3;
    if (competition === 'medium') competitionMultiplier = 1.0;
    if (competition === 'high') competitionMultiplier = 0.7;
    
    const weightedScore = normalizedVolume * trendMultiplier * competitionMultiplier;
    return Math.min(weightedScore, 100);
  }

  /**
   * Calculate user engagement weight (0-100)
   */
  async calculateUserEngagementWeight(painPointId, data) {
    const stats = data.userFeedback || {};
    
    // Completion rate (0-1)
    const completionRate = data.completions && data.views 
      ? data.completions / data.views 
      : 0;
    
    // Success rate (users who report success)
    const successRate = stats.successRate || 0;
    
    // Return visit rate
    const returnRate = stats.returnRate || 0;
    
    // Average time on page (normalized)
    const avgTimeOnPage = data.avgTimeOnPage || 0; // seconds
    const normalizedTime = Math.min((avgTimeOnPage / 300) * 100, 100); // 5 min = 100
    
    // Tool completion rate
    const toolCompletionRate = stats.toolCompletionRate || 0;
    
    // Calculate weighted engagement
    const engagementScore = 
      (completionRate * 0.25) +
      (successRate * 0.30) +
      (returnRate * 0.20) +
      (normalizedTime * 0.15) +
      (toolCompletionRate * 0.10);
    
    return Math.min(engagementScore * 100, 100);
  }

  /**
   * Calculate content depth weight (0-100)
   */
  async calculateContentDepthWeight(painPointId, data) {
    // Word count (comprehensive = better)
    const wordCount = data.wordCount || 0;
    const wordCountScore = Math.min((wordCount / 2000) * 100, 100); // 2000 words = 100
    
    // Number of tools
    const toolCount = (data.tools || []).length;
    const toolScore = Math.min((toolCount / 3) * 100, 100); // 3+ tools = 100
    
    // Research citations
    const researchCount = (data.researchIds || []).length;
    const researchScore = Math.min((researchCount / 3) * 100, 100); // 3+ = 100
    
    // Media/visuals count
    const mediaCount = data.mediaCount || 0;
    const mediaScore = Math.min((mediaCount / 5) * 100, 100); // 5+ = 100
    
    // Tool step depth (average steps per tool)
    const avgSteps = await this.calculateAverageToolSteps(painPointId, data);
    const stepScore = Math.min((avgSteps / 5) * 100, 100); // 5+ steps = 100
    
    const depthScore = 
      (wordCountScore * 0.30) +
      (toolScore * 0.25) +
      (researchScore * 0.20) +
      (mediaScore * 0.15) +
      (stepScore * 0.10);
    
    return Math.min(depthScore, 100);
  }

  /**
   * Calculate average tool steps
   */
  async calculateAverageToolSteps(painPointId, data) {
    if (!data.tools || data.tools.length === 0) return 0;
    
    try {
      const toolDocs = await Promise.all(
        data.tools.slice(0, 3).map(toolId =>
          this.firebaseBackend.readDocument(`tools/${toolId}`)
        )
      );
      
      const validTools = toolDocs.filter(t => t && t.data);
      if (validTools.length === 0) return 0;
      
      const totalSteps = validTools.reduce((sum, tool) => {
        return sum + (tool.data.steps?.length || 0);
      }, 0);
      
      return totalSteps / validTools.length;
    } catch (error) {
      logger.warn(`Error calculating tool steps: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate research backing weight (0-100)
   */
  async calculateResearchBackingWeight(painPointId, data) {
    if (!data.researchIds || data.researchIds.length === 0) {
      return 0;
    }
    
    try {
      const researchDocs = await Promise.all(
        data.researchIds.map(researchId =>
          this.firebaseBackend.readDocument(`research/${researchId}`)
        )
      );
      
      const validResearch = researchDocs.filter(r => r && r.data);
      if (validResearch.length === 0) return 0;
      
      // Citation count score
      const citationCountScore = Math.min((validResearch.length / 5) * 100, 100);
      
      // Authority of sources (high-impact journals = better)
      const avgAuthority = validResearch.reduce((sum, r) => {
        const credibility = r.data.credibility || 'medium';
        const score = credibility === 'high' ? 100 : credibility === 'medium' ? 70 : 40;
        return sum + score;
      }, 0) / validResearch.length;
      
      // Recency (recent research = bonus)
      const currentYear = new Date().getFullYear();
      const recentCount = validResearch.filter(r => {
        const year = r.data.year || 0;
        return (currentYear - year) <= 2;
      }).length;
      const recencyScore = (recentCount / validResearch.length) * 100;
      
      // Meta-analysis bonus
      const metaAnalysisCount = validResearch.filter(r => 
        r.data.type === 'meta-analysis' || r.data.type === 'systematic-review'
      ).length;
      const metaScore = Math.min((metaAnalysisCount / validResearch.length) * 100, 100);
      
      const researchScore = 
        (citationCountScore * 0.30) +
        (avgAuthority * 0.30) +
        (recencyScore * 0.25) +
        (metaScore * 0.15);
      
      return Math.min(researchScore, 100);
    } catch (error) {
      logger.warn(`Error calculating research backing: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate matrix resonance weight (0-100)
   */
  async calculateMatrixResonanceWeight(painPointId, data) {
    try {
      // Get connections
      const connections = await this.firebaseBackend.readCollection('matrixConnections', {
        where: [
          { field: 'sourceId', operator: '==', value: painPointId },
          { field: 'sourceType', operator: '==', value: 'painPoint' }
        ]
      });
      
      if (connections.length === 0) return 0;
      
      // Connection count score
      const connectionCountScore = Math.min((connections.length / 10) * 100, 100);
      
      // Average connection strength
      const avgStrength = connections.reduce((sum, conn) => {
        return sum + (conn.data.strength || 0);
      }, 0) / connections.length;
      const strengthScore = avgStrength * 100;
      
      // Hub status (connects many nodes)
      const hubScore = Math.min((connections.length / 15) * 100, 100);
      
      // Path frequency (how often used in user paths)
      const pathFrequency = data.pathFrequency || 0;
      const frequencyScore = Math.min((pathFrequency / 100) * 100, 100);
      
      const resonanceScore = 
        (connectionCountScore * 0.30) +
        (strengthScore * 0.30) +
        (hubScore * 0.25) +
        (frequencyScore * 0.15);
      
      return Math.min(resonanceScore, 100);
    } catch (error) {
      logger.warn(`Error calculating matrix resonance: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate E-A-T signals
   */
  async calculateEATSignals(painPointId, data) {
    // Expertise
    const expertise = {
      authoredByExpert: !!(data.author?.credentials?.length > 0),
      expertReviewed: data.expertReviewed || false,
      professionalEndorsements: data.endorsements?.length || 0,
      qualifications: data.author?.qualifications || []
    };
    const expertiseScore = this.calculateExpertiseScore(expertise);
    
    // Authoritativeness
    const authoritativeness = {
      citationCount: (data.researchIds || []).length,
      backlinks: data.backlinks?.length || 0,
      mentions: data.mentions?.length || 0,
      featuredIn: data.featuredIn?.length || 0,
      awards: data.awards?.length || 0
    };
    const authoritativenessScore = this.calculateAuthoritativenessScore(authoritativeness);
    
    // Trustworthiness
    const trustworthiness = {
      factCheckStatus: data.factChecked || false,
      hasCorrectionsPolicy: data.hasCorrectionsPolicy || false,
      hasContactInfo: data.hasContactInfo || false,
      updateFrequency: this.calculateUpdateFrequency(data),
      userTrustScore: data.userTrustScore || 0
    };
    const trustworthinessScore = this.calculateTrustworthinessScore(trustworthiness);
    
    const eatScore = 
      (expertiseScore * 0.35) +
      (authoritativenessScore * 0.35) +
      (trustworthinessScore * 0.30);
    
    return {
      score: Math.round(eatScore * 100) / 100,
      breakdown: {
        expertise: expertiseScore,
        authoritativeness: authoritativenessScore,
        trustworthiness: trustworthinessScore
      },
      signals: { expertise, authoritativeness, trustworthiness }
    };
  }

  calculateExpertiseScore(expertise) {
    let score = 0;
    if (expertise.authoredByExpert) score += 30;
    if (expertise.expertReviewed) score += 30;
    score += Math.min(expertise.professionalEndorsements * 5, 20);
    score += Math.min(expertise.qualifications.length * 5, 20);
    return Math.min(score / 100, 1);
  }

  calculateAuthoritativenessScore(authoritativeness) {
    let score = 0;
    score += Math.min(authoritativeness.citationCount * 10, 30);
    score += Math.min(authoritativeness.backlinks * 2, 25);
    score += Math.min(authoritativeness.mentions * 3, 20);
    score += Math.min(authoritativeness.featuredIn * 5, 15);
    score += Math.min(authoritativeness.awards * 10, 10);
    return Math.min(score / 100, 1);
  }

  calculateTrustworthinessScore(trustworthiness) {
    let score = 0;
    if (trustworthiness.factCheckStatus) score += 25;
    if (trustworthiness.hasCorrectionsPolicy) score += 20;
    if (trustworthiness.hasContactInfo) score += 15;
    score += trustworthiness.updateFrequency * 20;
    score += trustworthiness.userTrustScore * 20;
    return Math.min(score / 100, 1);
  }

  calculateUpdateFrequency(data) {
    const lastUpdate = new Date(data.updatedAt || data.createdAt);
    const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    // More recent = higher score
    if (daysSince < 30) return 1.0;
    if (daysSince < 90) return 0.8;
    if (daysSince < 180) return 0.6;
    if (daysSince < 365) return 0.4;
    return 0.2;
  }

  calculateFreshnessScore(data) {
    const lastUpdate = new Date(data.updatedAt || data.createdAt);
    const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresh content = 100, older content decreases
    if (daysSince < 7) return 100;
    if (daysSince < 30) return 90;
    if (daysSince < 90) return 75;
    if (daysSince < 180) return 60;
    if (daysSince < 365) return 40;
    return 20;
  }

  /**
   * Amplify authority when pain point is searched
   */
  async amplifyAuthorityOnSearch(painPointId, searchData = {}) {
    try {
      // Calculate search boost
      const currentAuth = await this.calculateAuthorityScore(painPointId);
      const searchBoost = this.calculateSearchBoost(searchData);
      
      // Update pain point authority
      const newAuthority = Math.min(currentAuth.authorityScore + searchBoost, 100);
      
      // Spread authority to connected elements
      await this.spreadAuthority(painPointId, searchBoost * 0.3);
      
      // Update trend data
      await this.updateSearchTrend(painPointId, searchData);
      
      logger.info(`Authority amplified for ${painPointId}: ${currentAuth.authorityScore} → ${newAuthority}`);
      
      return {
        previousAuthority: currentAuth.authorityScore,
        newAuthority,
        boost: searchBoost
      };
    } catch (error) {
      logger.error(`Error amplifying authority: ${error.message}`);
      throw error;
    }
  }

  calculateSearchBoost(searchData) {
    // Base boost from search
    let boost = 0.1; // Small base boost
    
    // Intent-based boost (high intent = more boost)
    if (searchData.intent === 'high') boost += 0.2;
    if (searchData.intent === 'medium') boost += 0.1;
    
    // Session depth boost (returning user = more valuable)
    if (searchData.isReturning) boost += 0.15;
    
    // Conversion boost (user completes action = significant boost)
    if (searchData.resultedInCompletion) boost += 0.3;
    
    return Math.min(boost, 1.0); // Max 1.0 boost per search
  }

  async spreadAuthority(sourceId, boostAmount) {
    try {
      // Get connections
      const connections = await this.firebaseBackend.readCollection('matrixConnections', {
        where: [
          { field: 'sourceId', operator: '==', value: sourceId }
        ]
      });
      
      // Spread to connected nodes (diminishing returns)
      for (const conn of connections.slice(0, 5)) { // Limit to top 5
        const spreadAmount = boostAmount * (conn.data.strength || 0.5);
        // Would update target authority here (requires write access)
        logger.info(`Authority spread: ${sourceId} → ${conn.data.targetId} (+${spreadAmount})`);
      }
    } catch (error) {
      logger.warn(`Error spreading authority: ${error.message}`);
    }
  }

  async updateSearchTrend(painPointId, searchData) {
    // Update search trend data
    // This would update the pain point document with trend information
    logger.info(`Search trend updated for ${painPointId}`);
  }
}

export default AuthorityEngine;




