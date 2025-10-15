import { useState, useEffect, useCallback } from 'react';
import { performanceMonitor } from '../services/performance';

export function usePerformance() {
  const [metrics, setMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Update metrics every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Start tracking an operation
  const startTracking = useCallback((type) => {
    return performanceMonitor.startOperation(type);
  }, []);

  // End tracking an operation
  const endTracking = useCallback((operationId) => {
    performanceMonitor.endOperation(operationId);
  }, []);

  // Set editing state
  const setEditing = useCallback((editing) => {
    performanceMonitor.setEditing(editing);
  }, []);

  // Track cursor update
  const trackCursorUpdate = useCallback(() => {
    performanceMonitor.trackCursorUpdate();
  }, []);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  return {
    metrics,
    startTracking,
    endTracking,
    setEditing,
    trackCursorUpdate,
    isVisible,
    toggleVisibility
  };
}

