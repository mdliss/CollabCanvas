import { useState, useEffect, useCallback } from 'react';

const MAX_HISTORY_ITEMS = 12;
const STORAGE_KEY = 'collabcanvas-color-history';

/**
 * useColorHistory - Manage recently used colors with localStorage persistence
 * Stores last 12 colors used, most recent first
 */
export function useColorHistory() {
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('[ColorHistory] Failed to load history:', error);
      setHistory([]);
    }
  }, []);

  // Add a color to history (deduplicates and moves to front)
  const addColor = useCallback((color) => {
    setHistory(prev => {
      // Remove duplicates (case-insensitive for hex colors)
      const normalizedColor = color.toLowerCase();
      const filtered = prev.filter(c => c.toLowerCase() !== normalizedColor);
      
      // Add to front and limit to MAX_HISTORY_ITEMS
      const newHistory = [color, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('[ColorHistory] Failed to save history:', error);
      }
      
      return newHistory;
    });
  }, []);

  // Clear entire history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[ColorHistory] Failed to clear history:', error);
    }
  }, []);

  return {
    history,
    addColor,
    clearHistory
  };
}

