/**
 * Pain Point Search Utility
 * Provides search functionality for pain points (depression, anxiety, etc.)
 */

import { logger } from './logger.js';

export class PainPointSearch {
  constructor(matrixEngine, authorityEngine = null) {
    this.matrixEngine = matrixEngine;
    this.authorityEngine = authorityEngine;
  }

  /**
   * Search for pain points by query
   * @param {string} query - Search query (e.g., "depression", "anxiety help")
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching pain points
   */
  async search(query, options = {}) {
    const { limit = 10, includeAuthority = false } = options;

    if (!query || !query.trim()) {
      return [];
    }

    try {
      // Use matrix engine to search
      const results = await this.matrixEngine.searchPainPoints(query, { limit });

      // Optionally add authority scores
      if (includeAuthority && this.authorityEngine) {
        for (const result of results) {
          try {
            const auth = await this.authorityEngine.calculateAuthorityScore(result.id);
            result.authorityScore = auth.authorityScore;
          } catch (e) {
            result.authorityScore = 0;
          }
        }

        // Re-sort by authority if included
        results.sort((a, b) => {
          if (b.authorityScore !== a.authorityScore) {
            return b.authorityScore - a.authorityScore;
          }
          return b.searchScore - a.searchScore;
        });
      }

      logger.info(`Pain point search: "${query}" found ${results.length} results`);
      return results;

    } catch (error) {
      logger.error(`Error in pain point search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   * @param {string} query - Partial query
   * @param {number} limit - Max suggestions
   * @returns {Promise<Array>} Array of suggestion strings
   */
  async getAutocompleteSuggestions(query, limit = 5) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const results = await this.search(query, { limit });
      return results.map(result => result.title || result.slug);
    } catch (error) {
      logger.error(`Error getting autocomplete: ${error.message}`);
      return [];
    }
  }

  /**
   * Get pain point page data (for routing)
   * @param {string} identifier - slug or ID
   * @returns {Promise<Object|null>} Complete pain point page data
   */
  async getPainPointPage(identifier) {
    try {
      // Find the pain point
      const painPoint = await this.matrixEngine.findPainPointByIdentifier(identifier);
      
      if (!painPoint) {
        return null;
      }

      // Build complete matrix path (includes tools, research, related)
      const matrixPath = await this.matrixEngine.buildMatrixPath(painPoint.id, {
        includeRelated: true
      });

      // Track search if authority engine available
      if (this.authorityEngine) {
        try {
          await this.authorityEngine.amplifyAuthorityOnSearch(painPoint.id, {
            query: identifier,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          // Non-critical, log but continue
          logger.warn(`Could not track search authority: ${e.message}`);
        }
      }

      return {
        painPoint: matrixPath.painPoint,
        gate: matrixPath.gate,
        tools: matrixPath.tools,
        research: matrixPath.research,
        relatedPainPoints: matrixPath.relatedPainPoints
      };

    } catch (error) {
      logger.error(`Error getting pain point page: ${error.message}`);
      throw error;
    }
  }
}

export { PainPointSearch };
export default PainPointSearch;

