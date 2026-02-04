import axios from "axios";
import { logger } from "./logger.js";
import credentialManager from "./credential-manager.js";

/**
 * API Client for Backend Access
 * Handles authenticated API requests
 * Never saves credentials - uses session-based credential manager
 */
class APIClient {
  constructor() {
    this.clients = new Map(); // sessionId -> axios instance
  }

  /**
   * Create authenticated API client for session
   * @param {string} sessionId
   * @param {Object} options - { baseURL, timeout, headers }
   * @returns {Promise<Object>} axios instance
   */
  async createClient(sessionId, options = {}) {
    const credentials = credentialManager.getCredentials(sessionId);
    if (!credentials) {
      throw new Error(`No credentials found for session: ${sessionId}`);
    }

    const baseURL = credentials.endpoint || credentials.url || options.baseURL;
    const timeout = options.timeout || 30000;

    // Create axios instance with authentication
    const client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Add authentication
    if (credentials.token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${credentials.token}`;
    } else if (credentials.apiKey) {
      client.defaults.headers.common['X-API-Key'] = credentials.apiKey;
    } else if (credentials.username && credentials.password) {
      // Basic auth
      const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    }

    this.clients.set(sessionId, client);
    logger.info(`API client created for session: ${sessionId}`);

    return client;
  }

  /**
   * Get API client for session
   * @param {string} sessionId
   * @returns {Object} axios instance
   */
  getClient(sessionId) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`No API client found for session: ${sessionId}. Call createClient first.`);
    }
    return client;
  }

  /**
   * Make GET request
   * @param {string} sessionId
   * @param {string} endpoint
   * @param {Object} config - Axios config
   * @returns {Promise<Object>}
   */
  async get(sessionId, endpoint, config = {}) {
    const client = this.getClient(sessionId);
    try {
      const response = await client.get(endpoint, config);
      logger.info(`GET ${endpoint} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      logger.error(`GET ${endpoint} failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Make POST request
   * @param {string} sessionId
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} config - Axios config
   * @returns {Promise<Object>}
   */
  async post(sessionId, endpoint, data, config = {}) {
    const client = this.getClient(sessionId);
    try {
      const response = await client.post(endpoint, data, config);
      logger.info(`POST ${endpoint} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      logger.error(`POST ${endpoint} failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Make PUT request
   * @param {string} sessionId
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} config - Axios config
   * @returns {Promise<Object>}
   */
  async put(sessionId, endpoint, data, config = {}) {
    const client = this.getClient(sessionId);
    try {
      const response = await client.put(endpoint, data, config);
      logger.info(`PUT ${endpoint} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      logger.error(`PUT ${endpoint} failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Make DELETE request
   * @param {string} sessionId
   * @param {string} endpoint
   * @param {Object} config - Axios config
   * @returns {Promise<Object>}
   */
  async delete(sessionId, endpoint, config = {}) {
    const client = this.getClient(sessionId);
    try {
      const response = await client.delete(endpoint, config);
      logger.info(`DELETE ${endpoint} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      logger.error(`DELETE ${endpoint} failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Error} error
   * @returns {Error}
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const apiError = new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      return apiError;
    } else if (error.request) {
      // Request made but no response
      return new Error(`Network Error: No response from server`);
    } else {
      // Error in request setup
      return new Error(`Request Error: ${error.message}`);
    }
  }

  /**
   * Remove client for session
   * @param {string} sessionId
   */
  removeClient(sessionId) {
    this.clients.delete(sessionId);
    logger.info(`API client removed for session: ${sessionId}`);
  }
}

export const apiClient = new APIClient();
export default apiClient;

