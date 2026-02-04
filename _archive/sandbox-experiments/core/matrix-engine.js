/**
 * Self-Resonating SEO Matrix Engine
 * Core logic for matrix connections, resonance, and self-correction
 */

import { logger } from './logger.js';

export class MatrixEngine {
  constructor(firebaseBackend) {
    this.firebaseBackend = firebaseBackend;
  }

  /**
   * Calculate numerological value from text
   * @param {string} text
   * @returns {number} 1-9, 11, 22, or 33
   */
  calculateNumerologicalValue(text) {
    const letterValues = {
      a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
      j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
      s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8
    };

    const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
    let sum = 0;

    for (const char of cleaned) {
      if (letterValues[char]) {
        sum += letterValues[char];
      }
    }

    // Reduce to single digit or master number
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }

    return sum;
  }

  /**
   * Calculate resonance between two numerological values
   * @param {number} value1
   * @param {number} value2
   * @returns {number} 0-10 resonance score
   */
  calculateResonance(value1, value2) {
    const diff = Math.abs(value1 - value2);
    
    // Perfect match
    if (diff === 0) return 10;
    
    // Very compatible (within 1)
    if (diff <= 1) return 9;
    
    // Compatible (within 2)
    if (diff <= 2) return 8;
    
    // Neutral to compatible
    if (diff <= 3) return 7;
    
    // Neutral
    if (diff <= 4) return 6;
    
    // Less compatible
    if (diff <= 5) return 5;
    
    // Not very compatible
    return 4;
  }

  /**
   * Find related pain points based on matrix connections
   * @param {string} painPointId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async findRelatedPainPoints(painPointId, limit = 5) {
    try {
      // Get direct connections
      const connections = await this.firebaseBackend.readCollection('matrixConnections', {
        where: [
          { field: 'sourceId', operator: '==', value: painPointId },
          { field: 'sourceType', operator: '==', value: 'painPoint' }
        ],
        limit: limit * 2 // Get extra to filter
      });

      // Get target pain points
      const relatedIds = connections
        .filter(c => c.data.targetType === 'painPoint')
        .sort((a, b) => (b.data.strength || 0) - (a.data.strength || 0))
        .slice(0, limit)
        .map(c => c.data.targetId);

      if (relatedIds.length === 0) {
        return [];
      }

      // Fetch related pain points
      const related = await Promise.all(
        relatedIds.map(id => 
          this.firebaseBackend.readDocument(`painPoints/${id}`)
        )
      );

      return related.filter(p => p !== null).map(p => ({
        id: p.id,
        title: p.data.title,
        slug: p.data.slug,
        description: p.data.description,
        resonanceScore: connections.find(c => c.data.targetId === p.id)?.data.resonanceScore || 0
      }));

    } catch (error) {
      logger.error(`Error finding related pain points: ${error.message}`);
      return [];
    }
  }

  /**
   * Get three tools for a pain point
   * @param {string} painPointId
   * @param {number} userLifePath Optional - for numerological matching
   * @returns {Promise<Array>}
   */
  async getThreeTools(painPointId, userLifePath = null) {
    try {
      const painPoint = await this.firebaseBackend.readDocument(`painPoints/${painPointId}`);
      
      if (!painPoint || !painPoint.data.tools || painPoint.data.tools.length === 0) {
        return [];
      }

      // Get all tools
      const tools = await Promise.all(
        painPoint.data.tools.slice(0, 3).map(toolId =>
          this.firebaseBackend.readDocument(`tools/${toolId}`)
        )
      );

      const validTools = tools.filter(t => t !== null);

      // If user life path provided, sort by resonance
      if (userLifePath && validTools.length > 0) {
        const painPointValue = painPoint.data.numerologicalValue || 
                              this.calculateNumerologicalValue(painPoint.data.title);
        
        return validTools.map(tool => {
          const toolValue = tool.data.numerologicalValue || 
                           this.calculateNumerologicalValue(tool.data.title);
          const resonance = this.calculateResonance(userLifePath, toolValue);
          
          return {
            ...tool.data,
            id: tool.id,
            resonanceScore: resonance,
            numerologicalMatch: resonance >= 7
          };
        }).sort((a, b) => b.resonanceScore - a.resonanceScore);
      }

      return validTools.map(tool => ({
        ...tool.data,
        id: tool.id
      }));

    } catch (error) {
      logger.error(`Error getting tools: ${error.message}`);
      return [];
    }
  }

  /**
   * Get research for a pain point
   * @param {string} painPointId
   * @returns {Promise<Array>}
   */
  async getResearch(painPointId) {
    try {
      const painPoint = await this.firebaseBackend.readDocument(`painPoints/${painPointId}`);
      
      if (!painPoint || !painPoint.data.researchIds || painPoint.data.researchIds.length === 0) {
        return [];
      }

      const research = await Promise.all(
        painPoint.data.researchIds.map(researchId =>
          this.firebaseBackend.readDocument(`research/${researchId}`)
        )
      );

      return research
        .filter(r => r !== null)
        .map(r => ({
          id: r.id,
          title: r.data.title,
          authors: r.data.authors || [],
          publication: r.data.publication,
          year: r.data.year,
          url: r.data.url,
          citationText: r.data.citationText,
          howItWorks: r.data.howItWorks,
          whyItWorks: r.data.whyItWorks,
          keyFindings: r.data.keyFindings || [],
          credibility: r.data.credibility || 'medium'
        }));

    } catch (error) {
      logger.error(`Error getting research: ${error.message}`);
      return [];
    }
  }

  /**
   * Build complete matrix path for a pain point
   * @param {string} painPointId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async buildMatrixPath(painPointId, options = {}) {
    const { userLifePath = null, includeRelated = true } = options;

    try {
      // Get pain point
      const painPointDoc = await this.firebaseBackend.readDocument(`painPoints/${painPointId}`);
      if (!painPointDoc) {
        throw new Error(`Pain point not found: ${painPointId}`);
      }

      const painPoint = {
        id: painPointDoc.id,
        ...painPointDoc.data
      };

      // Get gate
      let gate = null;
      if (painPoint.gateId) {
        const gateDoc = await this.firebaseBackend.readDocument(`gates/${painPoint.gateId}`);
        if (gateDoc) {
          gate = {
            id: gateDoc.id,
            ...gateDoc.data
          };
        }
      }

      // Get three tools
      const tools = await this.getThreeTools(painPointId, userLifePath);

      // Get research
      const research = await this.getResearch(painPointId);

      // Get related pain points (for loop)
      let relatedPainPoints = [];
      if (includeRelated) {
        relatedPainPoints = await this.findRelatedPainPoints(painPointId, 5);
      }

      return {
        painPoint,
        gate,
        tools,
        research,
        relatedPainPoints,
        numerologicalValue: painPoint.numerologicalValue || 
                          this.calculateNumerologicalValue(painPoint.title),
        resonanceFrequency: painPoint.resonanceFrequency || 432
      };

    } catch (error) {
      logger.error(`Error building matrix path: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search pain points by query string
   * @param {string} query - Search query (e.g., "depression", "anxiety")
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching pain points with scores
   */
  async searchPainPoints(query, options = {}) {
    const { limit = 10, minScore = 0 } = options;
    
    if (!query || !query.trim()) {
      return [];
    }

    try {
      // Get all pain points
      const allPainPoints = await this.firebaseBackend.readCollection('painPoints');
      
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      for (const doc of allPainPoints) {
        const painPoint = doc.data;
        let score = 0;

        // Exact title match (highest score)
        if (painPoint.title && painPoint.title.toLowerCase() === searchTerm) {
          score = 100;
        }
        // Title starts with query
        else if (painPoint.title && painPoint.title.toLowerCase().startsWith(searchTerm)) {
          score = 90;
        }
        // Title contains query
        else if (painPoint.title && painPoint.title.toLowerCase().includes(searchTerm)) {
          score = 80;
        }
        // Slug match
        else if (painPoint.slug && painPoint.slug.toLowerCase().includes(searchTerm)) {
          score = 75;
        }
        // Description contains query
        else if (painPoint.description && painPoint.description.toLowerCase().includes(searchTerm)) {
          score = 60;
        }
        // Keywords match
        else if (painPoint.keywords && Array.isArray(painPoint.keywords)) {
          const keywordMatch = painPoint.keywords.some(kw => 
            kw.toLowerCase().includes(searchTerm)
          );
          if (keywordMatch) score = 70;
        }
        // Synonym match (if synonyms array exists)
        else if (painPoint.synonyms && Array.isArray(painPoint.synonyms)) {
          const synonymMatch = painPoint.synonyms.some(syn => 
            syn.toLowerCase().includes(searchTerm)
          );
          if (synonymMatch) score = 65;
        }

        if (score >= minScore) {
          results.push({
            id: doc.id,
            ...painPoint,
            searchScore: score
          });
        }
      }

      // Sort by score (highest first)
      results.sort((a, b) => b.searchScore - a.searchScore);

      // Return limited results
      return results.slice(0, limit);

    } catch (error) {
      logger.error(`Error searching pain points: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find pain point by slug or ID
   * @param {string} identifier - slug or ID
   * @returns {Promise<Object|null>}
   */
  async findPainPointByIdentifier(identifier) {
    try {
      // Try to get by ID first
      try {
        const doc = await this.firebaseBackend.readDocument(`painPoints/${identifier}`);
        if (doc) {
          return {
            id: doc.id,
            ...doc.data
          };
        }
      } catch (e) {
        // Not found by ID, continue to slug search
      }

      // Search by slug
      const painPoints = await this.firebaseBackend.readCollection('painPoints', {
        where: {
          field: 'slug',
          operator: '==',
          value: identifier
        },
        limit: 1
      });

      if (painPoints.length > 0) {
        return {
          id: painPoints[0].id,
          ...painPoints[0].data
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error finding pain point: ${error.message}`);
      return null;
    }
  }

  /**
   * Track matrix path completion (for self-correction)
   * @param {string} painPointId
   * @param {string} toolId
   * @param {Object} completionData
   */
  async trackCompletion(painPointId, toolId, completionData) {
    try {
      const { completed, success, timeSpent, rating } = completionData;

      // Update tool completion stats
      const toolRef = `tools/${toolId}`;
      const tool = await this.firebaseBackend.readDocument(toolRef);
      
      if (tool) {
        // Would update completion rate, avg time, etc.
        // This would require write access (with approval)
      }

      // Update matrix connection strength
      const connectionId = `connection-${painPointId}-${toolId}`;
      const connection = await this.firebaseBackend.readDocument(`matrixConnections/${connectionId}`);
      
      if (connection && success) {
        // Strengthen connection if successful
        // This would update the strength score
      }

      logger.info(`Tracked completion: ${painPointId} → ${toolId} (success: ${success})`);

    } catch (error) {
      logger.error(`Error tracking completion: ${error.message}`);
    }
  }

  /**
   * Calculate resonance frequency for a pain point
   * @param {string} painPointId
   * @returns {number}
   */
  async calculateResonanceFrequency(painPointId) {
    try {
      const painPoint = await this.firebaseBackend.readDocument(`painPoints/${painPointId}`);
      if (!painPoint) return 432; // Default

      const numValue = painPoint.data.numerologicalValue || 
                      this.calculateNumerologicalValue(painPoint.data.title);
      
      // Map numerological value to frequency (symbolic)
      const frequencyMap = {
        1: 432, 2: 528, 3: 639, 4: 741, 5: 852,
        6: 963, 7: 174, 8: 285, 9: 396,
        11: 417, 22: 528, 33: 639
      };

      return frequencyMap[numValue] || 432;
    } catch (error) {
      logger.error(`Error calculating frequency: ${error.message}`);
      return 432;
    }
  }
}

export default MatrixEngine;




