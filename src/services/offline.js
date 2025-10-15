/**
 * Offline Operation Queue Service
 * Stores pending operations in IndexedDB when offline
 * Automatically replays queue when connection is restored
 */

const DB_NAME = 'collabcanvas_offline';
const DB_VERSION = 1;
const STORE_NAME = 'operations';
const MAX_QUEUE_SIZE = 500;
const MAX_RETRIES = 3;

class OfflineQueue {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.listeners = new Set();
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.debug('[OfflineQueue] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: false 
          });
          
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('status', 'status', { unique: false });
          
          console.debug('[OfflineQueue] Object store created');
        }
      };
    });
  }

  /**
   * Generate unique operation ID
   */
  generateId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add operation to queue
   * @param {string} type - Operation type (createShape, updateShape, deleteShape)
   * @param {object} data - Operation data
   */
  async enqueue(type, data) {
    await this.init();

    // Check queue size limit
    const count = await this.count();
    if (count >= MAX_QUEUE_SIZE) {
      console.warn('[OfflineQueue] Queue full, removing oldest operation');
      await this.removeOldest();
    }

    const operation = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(operation);

      request.onsuccess = () => {
        console.debug('[OfflineQueue] Enqueued operation:', operation.id, type);
        this.notifyListeners();
        resolve(operation.id);
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to enqueue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending operations
   */
  async getPending() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        const operations = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to get pending operations:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove operation from queue
   */
  async dequeue(operationId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(operationId);

      request.onsuccess = () => {
        console.debug('[OfflineQueue] Dequeued operation:', operationId);
        this.notifyListeners();
        resolve();
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to dequeue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark operation as failed
   */
  async markFailed(operationId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getRequest = objectStore.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retries++;
          operation.status = operation.retries >= MAX_RETRIES ? 'failed' : 'pending';
          
          const putRequest = objectStore.put(operation);
          
          putRequest.onsuccess = () => {
            console.debug('[OfflineQueue] Marked operation as failed:', operationId, 
              `retries: ${operation.retries}/${MAX_RETRIES}`);
            this.notifyListeners();
            resolve(operation.status === 'failed');
          };

          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          resolve(false);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Get count of pending operations
   */
  async count() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('status');
      const request = index.count('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to count:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all operations
   */
  async clear() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.debug('[OfflineQueue] Cleared all operations');
        this.notifyListeners();
        resolve();
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to clear:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove oldest operation
   */
  async removeOldest() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('timestamp');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          objectStore.delete(cursor.primaryKey);
          console.debug('[OfflineQueue] Removed oldest operation:', cursor.primaryKey);
          this.notifyListeners();
          resolve();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Add listener for queue changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[OfflineQueue] Listener error:', error);
      }
    });
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const operations = request.result;
        const stats = {
          total: operations.length,
          pending: operations.filter(op => op.status === 'pending').length,
          failed: operations.filter(op => op.status === 'failed').length,
          oldestTimestamp: operations.length > 0 
            ? Math.min(...operations.map(op => op.timestamp))
            : null
        };
        resolve(stats);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

// Auto-initialize
if (typeof window !== 'undefined') {
  offlineQueue.init().catch(error => {
    console.error('[OfflineQueue] Auto-initialization failed:', error);
  });
}

