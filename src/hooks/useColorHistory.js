import { useState, useEffect, useCallback } from 'react';

const MAX_HISTORY_ITEMS = 12;
const STORAGE_KEY = 'collabcanvas-color-history';

/**
 * useColorHistory - Manage recently used colors/gradients with localStorage persistence
 * Stores last 12 color choices (colors, gradients, opacity), most recent first
 * 
 * History item format:
 * - Solid color: { type: 'solid', color: '#FF0000', opacity: 0.5 }
 * - Gradient: { type: 'gradient', gradient: { color1, color2, angle } }
 */
export function useColorHistory() {
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle old format (array of strings) by converting to new format
        if (Array.isArray(parsed)) {
          const converted = parsed.map(item => {
            if (typeof item === 'string') {
              // Old format: just a color string
              return { type: 'solid', color: item, opacity: 1.0 };
            }
            // New format: object with type
            return item;
          });
          setHistory(converted);
        } else {
          setHistory([]);
        }
      }
    } catch (error) {
      console.error('[ColorHistory] Failed to load history:', error);
      setHistory([]);
    }
  }, []);

  // Add a solid color with opacity to history
  const addColor = useCallback((color, opacity = 1.0) => {
    setHistory(prev => {
      const newItem = { type: 'solid', color, opacity };
      
      // Remove duplicates (same color + opacity)
      const filtered = prev.filter(item => {
        if (item.type !== 'solid') return true;
        return !(item.color.toLowerCase() === color.toLowerCase() && 
                 Math.abs(item.opacity - opacity) < 0.01);
      });
      
      // Add to front and limit to MAX_HISTORY_ITEMS
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('[ColorHistory] Failed to save history:', error);
      }
      
      return newHistory;
    });
  }, []);

  // Add a gradient to history
  const addGradient = useCallback((gradient) => {
    setHistory(prev => {
      const newItem = { type: 'gradient', gradient };
      
      // Remove duplicates (same gradient colors + angle)
      const filtered = prev.filter(item => {
        if (item.type !== 'gradient') return true;
        const g = item.gradient;
        return !(g.color1 === gradient.color1 && 
                 g.color2 === gradient.color2 && 
                 g.angle === gradient.angle);
      });
      
      // Add to front and limit to MAX_HISTORY_ITEMS
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
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
    addGradient,
    clearHistory
  };
}

