import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import credentialManager from "./credential-manager.js";

/**
 * Firebase Backend Access
 * Provides access to Firebase services for monitoring and management
 */
class FirebaseBackend {
  constructor() {
    this.app = null;
    this.auth = null;
    this.firestore = null;
    this.database = null;
    this.storage = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase Admin with credentials
   * @param {string} sessionId - Session ID with Firebase credentials
   * @param {Object} config - Firebase config or service account
   * @returns {Promise<void>}
   */
  async initialize(sessionId, config = null) {
    try {
      // Get credentials from session or use provided config
      let firebaseConfig = config;
      
      if (!firebaseConfig) {
        const credentials = credentialManager.getCredentials(sessionId);
        if (credentials && credentials.firebaseConfig) {
          firebaseConfig = credentials.firebaseConfig;
        } else if (credentials && credentials.serviceAccount) {
          firebaseConfig = { credential: cert(credentials.serviceAccount) };
        }
      }

      if (!firebaseConfig) {
        throw new Error("Firebase configuration not provided");
      }

      // Initialize if not already initialized
      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      // Initialize services
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      this.database = getDatabase(this.app);
      this.storage = getStorage(this.app);

      this.initialized = true;
      auditSystem.log('FIREBASE_BACKEND_INITIALIZED', { sessionId });
      logger.info("Firebase backend initialized");

    } catch (error) {
      logger.error(`Failed to initialize Firebase backend: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Firebase Auth instance
   * @returns {Object}
   */
  getAuth() {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }
    return this.auth;
  }

  /**
   * Get Firestore instance
   * @returns {Object}
   */
  getFirestore() {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }
    return this.firestore;
  }

  /**
   * Get Realtime Database instance
   * @returns {Object}
   */
  getDatabase() {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }
    return this.database;
  }

  /**
   * Get Storage instance
   * @returns {Object}
   */
  getStorage() {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }
    return this.storage;
  }

  /**
   * List all users
   * @param {number} maxResults - Maximum results to return
   * @returns {Promise<Array>}
   */
  async listUsers(maxResults = 100) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      const listUsersResult = await this.auth.listUsers(maxResults);
      auditSystem.log('FIREBASE_USERS_LISTED', { count: listUsersResult.users.length });
      return listUsersResult.users;
    } catch (error) {
      logger.error(`Failed to list users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by UID
   * @param {string} uid - User UID
   * @returns {Promise<Object>}
   */
  async getUser(uid) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      const userRecord = await this.auth.getUser(uid);
      auditSystem.log('FIREBASE_USER_RETRIEVED', { uid });
      return userRecord;
    } catch (error) {
      logger.error(`Failed to get user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read Firestore collection with enhanced query capabilities
   * @param {string} collectionPath - Collection path
   * @param {Object} queryOptions - Query options
   * @returns {Promise<Array>}
   */
  async readCollection(collectionPath, queryOptions = {}) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      let query = this.firestore.collection(collectionPath);
      
      // Enhanced where clauses support
      if (queryOptions.where) {
        if (Array.isArray(queryOptions.where)) {
          queryOptions.where.forEach(condition => {
            query = query.where(condition.field, condition.operator, condition.value);
          });
        } else {
          // Single condition
          query = query.where(
            queryOptions.where.field, 
            queryOptions.where.operator, 
            queryOptions.where.value
          );
        }
      }
      
      // Order by
      if (queryOptions.orderBy) {
        if (Array.isArray(queryOptions.orderBy)) {
          queryOptions.orderBy.forEach(order => {
            query = query.orderBy(order.field, order.direction || 'asc');
          });
        } else {
          query = query.orderBy(
            queryOptions.orderBy.field, 
            queryOptions.orderBy.direction || 'asc'
          );
        }
      }
      
      // Start at / end at (for pagination)
      if (queryOptions.startAt) {
        query = query.startAt(queryOptions.startAt);
      }
      if (queryOptions.endAt) {
        query = query.endAt(queryOptions.endAt);
      }
      
      // Start after / end before (for cursor-based pagination)
      if (queryOptions.startAfter) {
        query = query.startAfter(queryOptions.startAfter);
      }
      if (queryOptions.endBefore) {
        query = query.endBefore(queryOptions.endBefore);
      }
      
      // Limit
      if (queryOptions.limit) {
        query = query.limit(queryOptions.limit);
      }

      const snapshot = await query.get();
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
        path: doc.ref.path,
        createTime: doc.createTime,
        updateTime: doc.updateTime
      }));

      auditSystem.log('FIREBASE_COLLECTION_READ', { 
        collection: collectionPath, 
        count: documents.length,
        queryOptions
      });

      return documents;
    } catch (error) {
      logger.error(`Failed to read collection: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Setup real-time listener for Firestore collection
   * @param {string} collectionPath - Collection path
   * @param {Function} callback - Callback function (documents) => {}
   * @param {Object} queryOptions - Query options
   * @returns {Promise<Function>} Unsubscribe function
   */
  async watchCollection(collectionPath, callback, queryOptions = {}) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      let query = this.firestore.collection(collectionPath);
      
      // Apply query options (same as readCollection)
      if (queryOptions.where) {
        if (Array.isArray(queryOptions.where)) {
          queryOptions.where.forEach(condition => {
            query = query.where(condition.field, condition.operator, condition.value);
          });
        } else {
          query = query.where(
            queryOptions.where.field, 
            queryOptions.where.operator, 
            queryOptions.where.value
          );
        }
      }
      
      if (queryOptions.orderBy) {
        if (Array.isArray(queryOptions.orderBy)) {
          queryOptions.orderBy.forEach(order => {
            query = query.orderBy(order.field, order.direction || 'asc');
          });
        } else {
          query = query.orderBy(
            queryOptions.orderBy.field, 
            queryOptions.orderBy.direction || 'asc'
          );
        }
      }
      
      if (queryOptions.limit) {
        query = query.limit(queryOptions.limit);
      }
      
      // Setup listener
      const unsubscribe = query.onSnapshot((snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
          path: doc.ref.path
        }));
        
        const changes = snapshot.docChanges().map(change => ({
          type: change.type, // 'added', 'modified', 'removed'
          doc: {
            id: change.doc.id,
            data: change.doc.data(),
            path: change.doc.ref.path
          }
        }));
        
        auditSystem.log('FIREBASE_COLLECTION_CHANGED', {
          collection: collectionPath,
          changeCount: changes.length
        });
        
        callback(documents, changes);
      }, (error) => {
        logger.error(`Firestore listener error: ${error.message}`);
        auditSystem.recordIssue('FIREBASE_LISTENER_ERROR', error.message, {
          collection: collectionPath,
          severity: 'high'
        });
      });
      
      logger.info(`Real-time listener setup for collection: ${collectionPath}`);
      return unsubscribe;
    } catch (error) {
      logger.error(`Failed to setup listener: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Aggregate data from Firestore collection
   * @param {string} collectionPath - Collection path
   * @param {Object} aggregationOptions - { field, operation: 'count'|'sum'|'avg'|'min'|'max' }
   * @returns {Promise<number>}
   */
  async aggregateCollection(collectionPath, aggregationOptions = {}) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      const documents = await this.readCollection(collectionPath, aggregationOptions.queryOptions || {});
      
      if (aggregationOptions.operation === 'count') {
        return documents.length;
      }
      
      if (!aggregationOptions.field) {
        throw new Error('Field required for aggregation operations other than count');
      }
      
      const values = documents
        .map(doc => doc.data[aggregationOptions.field])
        .filter(val => typeof val === 'number');
      
      switch (aggregationOptions.operation) {
        case 'sum':
          return values.reduce((sum, val) => sum + val, 0);
        case 'avg':
          return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        case 'min':
          return values.length > 0 ? Math.min(...values) : 0;
        case 'max':
          return values.length > 0 ? Math.max(...values) : 0;
        default:
          throw new Error(`Unsupported aggregation operation: ${aggregationOptions.operation}`);
      }
    } catch (error) {
      logger.error(`Failed to aggregate collection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read Firestore document
   * @param {string} documentPath - Document path
   * @returns {Promise<Object>}
   */
  async readDocument(documentPath) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      const doc = await this.firestore.doc(documentPath).get();
      
      if (!doc.exists) {
        return null;
      }

      auditSystem.log('FIREBASE_DOCUMENT_READ', { path: documentPath });
      
      return {
        id: doc.id,
        data: doc.data(),
        path: doc.ref.path
      };
    } catch (error) {
      logger.error(`Failed to read document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Write Firestore document (requires approval)
   * @param {string} documentPath - Document path
   * @param {Object} data - Document data
   * @param {string} reason - Reason for change
   * @returns {Promise<Object>}
   */
  async writeDocument(documentPath, data, reason = 'Document update') {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    // Check authorization
    const readOnlyMode = (await import('./readonly-mode.js')).default;
    if (!readOnlyMode.isAuthorized('write_firebase', documentPath)) {
      auditSystem.recordWriteAttempt(documentPath, 'Firebase write not authorized');
      throw new Error(`Firebase write not authorized: ${documentPath}`);
    }

    try {
      await this.firestore.doc(documentPath).set(data, { merge: true });
      auditSystem.log('FIREBASE_DOCUMENT_WRITTEN', { path: documentPath });
      logger.info(`Firebase document written: ${documentPath}`);
      
      return { success: true, path: documentPath };
    } catch (error) {
      logger.error(`Failed to write document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read Realtime Database path
   * @param {string} path - Database path
   * @returns {Promise<Object>}
   */
  async readDatabase(path) {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      const snapshot = await this.database.ref(path).once('value');
      const data = snapshot.val();
      
      auditSystem.log('FIREBASE_DATABASE_READ', { path });
      
      return data;
    } catch (error) {
      logger.error(`Failed to read database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get storage bucket files
   * @param {string} bucketName - Bucket name
   * @param {string} prefix - File prefix/path
   * @returns {Promise<Array>}
   */
  async listStorageFiles(bucketName, prefix = '') {
    if (!this.initialized) {
      throw new Error("Firebase backend not initialized");
    }

    try {
      const bucket = this.storage.bucket(bucketName);
      const [files] = await bucket.getFiles({ prefix });
      
      auditSystem.log('FIREBASE_STORAGE_LISTED', { 
        bucket: bucketName, 
        prefix, 
        count: files.length 
      });

      return files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        updated: file.metadata.updated
      }));
    } catch (error) {
      logger.error(`Failed to list storage files: ${error.message}`);
      throw error;
    }
  }
}

export const firebaseBackend = new FirebaseBackend();
export default firebaseBackend;

