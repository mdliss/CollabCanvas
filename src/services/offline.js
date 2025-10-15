/**
 * Offline Operation Queue Service
 * Stores pending operations in IndexedDB when offline
 */

const DB_NAME = 'collabcanvas_offline';
const DB_VERSION = 1;
const STORE_NAME = 'operations';
const MAX_QUEUE_SIZE = 500;

class OfflineQueue {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.listeners = new Set();
  }

  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async enqueue(type, data) {
    await this.init();
    const operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const request = transaction.objectStore(STORE_NAME).add(operation);
      request.onsuccess = () => {
        this.notifyListeners();
        resolve(operation.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async count() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const request = transaction.objectStore(STORE_NAME).index('status').count('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const request = transaction.objectStore(STORE_NAME).clear();
      request.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[OfflineQueue] Listener error:', error);
      }
    });
  }
}

export const offlineQueue = new OfflineQueue();

if (typeof window !== 'undefined') {
  offlineQueue.init().catch(error => {
    console.error('[OfflineQueue] Init failed:', error);
  });
}

