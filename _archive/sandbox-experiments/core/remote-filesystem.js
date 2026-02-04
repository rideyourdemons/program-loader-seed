import { Client } from "ssh2";
import axios from "axios";
import { logger } from "./logger.js";
import credentialManager from "./credential-manager.js";
import apiClient from "./api-client.js";
import readOnlyMode from "./readonly-mode.js";
import auditSystem from "./audit-system.js";

/**
 * Remote File System Access
 * Supports multiple protocols: SSH, API, FTP
 * Never saves credentials - uses session-based credential manager
 */
class RemoteFileSystem {
  constructor() {
    this.sshConnections = new Map(); // sessionId -> ssh client
  }

  /**
   * Read file via SSH
   * @param {string} sessionId
   * @param {string} filePath
   * @returns {Promise<string>} File content
   */
  async readFileSSH(sessionId, filePath) {
    const credentials = credentialManager.getCredentials(sessionId);
    if (!credentials) {
      throw new Error(`No credentials found for session: ${sessionId}`);
    }

    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          sftp.readFile(filePath, 'utf8', (err, data) => {
            conn.end();
            if (err) {
              return reject(err);
            }
            resolve(data);
          });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.connect({
        host: credentials.host || credentials.url,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password,
        privateKey: credentials.privateKey,
        passphrase: credentials.passphrase
      });
    });
  }

  /**
   * Write file via SSH
   * @param {string} sessionId
   * @param {string} filePath
   * @param {string} content
   * @returns {Promise<void>}
   */
  async writeFileSSH(sessionId, filePath, content) {
    // Check authorization
    if (!readOnlyMode.isAuthorized('write_file', filePath)) {
      auditSystem.recordWriteAttempt(filePath, 'Write operation not authorized');
      throw new Error(`Write operation not authorized. File: ${filePath}`);
    }
    const credentials = credentialManager.getCredentials(sessionId);
    if (!credentials) {
      throw new Error(`No credentials found for session: ${sessionId}`);
    }

    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          sftp.writeFile(filePath, content, 'utf8', (err) => {
            conn.end();
            if (err) {
              return reject(err);
            }
            logger.info(`File written via SSH: ${filePath}`);
            resolve();
          });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.connect({
        host: credentials.host || credentials.url,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password,
        privateKey: credentials.privateKey,
        passphrase: credentials.passphrase
      });
    });
  }

  /**
   * List directory via SSH
   * @param {string} sessionId
   * @param {string} dirPath
   * @returns {Promise<Array>} Directory listing
   */
  async listDirectorySSH(sessionId, dirPath) {
    const credentials = credentialManager.getCredentials(sessionId);
    if (!credentials) {
      throw new Error(`No credentials found for session: ${sessionId}`);
    }

    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          sftp.readdir(dirPath, (err, list) => {
            conn.end();
            if (err) {
              return reject(err);
            }
            resolve(list);
          });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.connect({
        host: credentials.host || credentials.url,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password,
        privateKey: credentials.privateKey,
        passphrase: credentials.passphrase
      });
    });
  }

  /**
   * Read file via API
   * @param {string} sessionId
   * @param {string} filePath
   * @param {string} endpoint - API endpoint (e.g., '/api/files/read')
   * @returns {Promise<string>} File content
   */
  async readFileAPI(sessionId, filePath, endpoint = '/api/files/read') {
    try {
      const data = await apiClient.post(sessionId, endpoint, { path: filePath });
      return data.content || data;
    } catch (error) {
      logger.error(`Failed to read file via API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Write file via API
   * @param {string} sessionId
   * @param {string} filePath
   * @param {string} content
   * @param {string} endpoint - API endpoint (e.g., '/api/files/write')
   * @returns {Promise<void>}
   */
  async writeFileAPI(sessionId, filePath, content, endpoint = '/api/files/write') {
    // Check authorization
    if (!readOnlyMode.isAuthorized('write_file', filePath)) {
      auditSystem.recordWriteAttempt(filePath, 'Write operation not authorized');
      throw new Error(`Write operation not authorized. File: ${filePath}`);
    }
    try {
      await apiClient.post(sessionId, endpoint, { path: filePath, content });
      logger.info(`File written via API: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write file via API: ${error.message}`);
      throw error;
    }
  }

  /**
   * List directory via API
   * @param {string} sessionId
   * @param {string} dirPath
   * @param {string} endpoint - API endpoint (e.g., '/api/files/list')
   * @returns {Promise<Array>} Directory listing
   */
  async listDirectoryAPI(sessionId, dirPath, endpoint = '/api/files/list') {
    try {
      const data = await apiClient.post(sessionId, endpoint, { path: dirPath });
      return data.files || data;
    } catch (error) {
      logger.error(`Failed to list directory via API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute command via SSH
   * @param {string} sessionId
   * @param {string} command
   * @returns {Promise<{stdout: string, stderr: string, code: number}>}
   */
  async executeCommandSSH(sessionId, command) {
    const credentials = credentialManager.getCredentials(sessionId);
    if (!credentials) {
      throw new Error(`No credentials found for session: ${sessionId}`);
    }

    return new Promise((resolve, reject) => {
      const conn = new Client();
      let stdout = '';
      let stderr = '';

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          stream.on('close', (code, signal) => {
            conn.end();
            resolve({ stdout, stderr, code, signal });
          });

          stream.on('data', (data) => {
            stdout += data.toString();
          });

          stream.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.connect({
        host: credentials.host || credentials.url,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password,
        privateKey: credentials.privateKey,
        passphrase: credentials.passphrase
      });
    });
  }
}

export const remoteFileSystem = new RemoteFileSystem();
export default remoteFileSystem;

