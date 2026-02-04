/**
 * Pain Point Search Utility (Standalone)
 * Can be used in Node.js scripts or imported into React apps
 */

import { PainPointSearch } from '../core/pain-point-search.js';
import MatrixEngine from '../core/matrix-engine.js';
import AuthorityEngine from '../core/authority-engine.js';
import FirebaseBackend from '../core/firebase-backend.js';

let searchInstance = null;

/**
 * Initialize search utility
 * @param {FirebaseBackend} firebaseBackend - Initialized Firebase backend
 * @returns {PainPointSearch}
 */
export function initSearch(firebaseBackend) {
  if (!searchInstance) {
    const matrixEngine = new MatrixEngine(firebaseBackend);
    const authorityEngine = new AuthorityEngine(firebaseBackend);
    searchInstance = new PainPointSearch(matrixEngine, authorityEngine);
  }
  return searchInstance;
}

/**
 * Search pain points (convenience function)
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>}
 */
export async function searchPainPoints(query, options = {}) {
  if (!searchInstance) {
    throw new Error('Search not initialized. Call initSearch() first.');
  }
  return searchInstance.search(query, options);
}

/**
 * Get autocomplete suggestions
 * @param {string} query - Partial query
 * @returns {Promise<Array>}
 */
export async function getAutocompleteSuggestions(query) {
  if (!searchInstance) {
    throw new Error('Search not initialized. Call initSearch() first.');
  }
  return searchInstance.getAutocompleteSuggestions(query);
}

/**
 * Get pain point page data
 * @param {string} identifier - slug or ID
 * @returns {Promise<Object|null>}
 */
export async function getPainPointPage(identifier) {
  if (!searchInstance) {
    throw new Error('Search not initialized. Call initSearch() first.');
  }
  return searchInstance.getPainPointPage(identifier);
}

export default {
  initSearch,
  searchPainPoints,
  getAutocompleteSuggestions,
  getPainPointPage
};

