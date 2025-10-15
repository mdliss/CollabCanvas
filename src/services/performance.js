import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from './firebase';

const analytics = getAnalytics(app);

class PerformanceMonitor {
  constructor() {
    this.operations = new Map(); // operationId -> { startTime, type }
    this.metrics = {
      syncLatency: [],      // Circular buffer, max 100 samples
      cursorFrequency: [],  // Time between cursor updates
      fps: [],              // FPS samples during editing
      networkRTT: []        // Round-trip time to Firebase
    };
    this.maxSamples = 100;
    this.reportInterval = null;
    this.lastCursorUpdate = null;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.isEditing = false;
    
    // Optimization metrics (30-second sliding window)
    this.dragUpdatesSkipped = []; // Array of timestamps
    this.cursorUpdatesSkipped = []; // Array of timestamps
    this.WINDOW_DURATION = 30000; // 30 seconds in milliseconds
  }

  init() {
    // Start 60-second reporting interval
    this.reportInterval = setInterval(() => {
      this.sendMetricsToAnalytics();
    }, 60000);

    // Start FPS tracking
    this.trackFPS();
  }

  // Track operation start (when local action occurs)
  startOperation(type = 'update') {
    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.operations.set(operationId, {
      startTime: performance.now(),
      type
    });
    return operationId;
  }

  // Track operation end (when remote update received)
  endOperation(operationId) {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const latency = performance.now() - operation.startTime;
    this.addMetric('syncLatency', latency);
    this.operations.delete(operationId);
  }

  // Track cursor update frequency
  trackCursorUpdate() {
    const now = performance.now();
    if (this.lastCursorUpdate) {
      const timeDelta = now - this.lastCursorUpdate;
      this.addMetric('cursorFrequency', timeDelta);
    }
    this.lastCursorUpdate = now;
  }

  // Track FPS during editing
  trackFPS() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    
    if (this.isEditing && delta > 0) {
      const fps = 1000 / delta;
      this.addMetric('fps', fps);
    }
    
    this.lastFrameTime = now;
    requestAnimationFrame(() => this.trackFPS());
  }

  // Set editing state (true when dragging/transforming)
  setEditing(editing) {
    this.isEditing = editing;
  }

  // Add metric to circular buffer
  addMetric(type, value) {
    if (this.metrics[type].length >= this.maxSamples) {
      this.metrics[type].shift();
    }
    this.metrics[type].push(value);
  }

  // Calculate percentile
  getPercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Clean old timestamps outside 30-second window
  cleanOldTimestamps(arr) {
    const now = Date.now();
    const cutoff = now - this.WINDOW_DURATION;
    // Remove timestamps older than 30 seconds
    return arr.filter(timestamp => timestamp > cutoff);
  }

  // Track skipped drag update (delta compression saved bandwidth)
  trackDragUpdateSkipped() {
    this.dragUpdatesSkipped.push(Date.now());
    // Keep array size manageable (max 10,000 entries)
    if (this.dragUpdatesSkipped.length > 10000) {
      this.dragUpdatesSkipped = this.cleanOldTimestamps(this.dragUpdatesSkipped);
    }
  }

  // Track skipped cursor update (2px filter saved bandwidth)
  trackCursorUpdateSkipped() {
    this.cursorUpdatesSkipped.push(Date.now());
    // Keep array size manageable (max 10,000 entries)
    if (this.cursorUpdatesSkipped.length > 10000) {
      this.cursorUpdatesSkipped = this.cleanOldTimestamps(this.cursorUpdatesSkipped);
    }
  }

  // Get current metrics snapshot
  getMetrics() {
    // Clean old timestamps before counting (30-second sliding window)
    this.dragUpdatesSkipped = this.cleanOldTimestamps(this.dragUpdatesSkipped);
    this.cursorUpdatesSkipped = this.cleanOldTimestamps(this.cursorUpdatesSkipped);

    return {
      syncLatency: {
        p50: this.getPercentile(this.metrics.syncLatency, 50),
        p95: this.getPercentile(this.metrics.syncLatency, 95),
        p99: this.getPercentile(this.metrics.syncLatency, 99),
        samples: this.metrics.syncLatency.length
      },
      cursorFrequency: {
        avg: this.metrics.cursorFrequency.length > 0 
          ? this.metrics.cursorFrequency.reduce((a, b) => a + b, 0) / this.metrics.cursorFrequency.length 
          : 0,
        hz: this.metrics.cursorFrequency.length > 0
          ? 1000 / (this.metrics.cursorFrequency.reduce((a, b) => a + b, 0) / this.metrics.cursorFrequency.length)
          : 0
      },
      fps: {
        avg: this.metrics.fps.length > 0
          ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length
          : 0,
        min: this.metrics.fps.length > 0 ? Math.min(...this.metrics.fps) : 0,
        max: this.metrics.fps.length > 0 ? Math.max(...this.metrics.fps) : 0
      },
      networkRTT: {
        avg: this.metrics.networkRTT.length > 0
          ? this.metrics.networkRTT.reduce((a, b) => a + b, 0) / this.metrics.networkRTT.length
          : 0
      },
      optimizations: {
        dragUpdatesSkipped: this.dragUpdatesSkipped.length,
        cursorUpdatesSkipped: this.cursorUpdatesSkipped.length,
        windowDuration: 30 // seconds
      }
    };
  }

  // Send metrics to Firebase Analytics
  async sendMetricsToAnalytics() {
    const metrics = this.getMetrics();
    
    try {
      await logEvent(analytics, 'performance_metrics', {
        sync_latency_p50: Math.round(metrics.syncLatency.p50),
        sync_latency_p95: Math.round(metrics.syncLatency.p95),
        sync_latency_p99: Math.round(metrics.syncLatency.p99),
        cursor_hz: Math.round(metrics.cursorFrequency.hz),
        avg_fps: Math.round(metrics.fps.avg),
        network_rtt: Math.round(metrics.networkRTT.avg),
        timestamp: Date.now()
      });
      console.debug('[PerformanceMonitor] Metrics sent to Analytics');
    } catch (error) {
      console.debug('[PerformanceMonitor] Failed to send metrics:', error);
    }
  }

  // Cleanup
  destroy() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Make available globally for tracking from other services
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}

