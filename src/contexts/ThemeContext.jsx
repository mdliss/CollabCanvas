/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Theme Context - Global Theme Management
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides theme switching capability across the entire application.
 * Supports light and dark themes with smooth transitions.
 * 
 * USAGE:
 * - Wrap app with ThemeProvider
 * - Use useTheme() hook in components
 * - Access theme.colors for current theme colors
 * - Call toggleTheme() to switch themes
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Theme definitions
const THEMES = {
  light: {
    name: 'Light',
    id: 'light',
  // Page backgrounds
  background: {
    page: '#f5f5f5',
    card: '#ffffff',
    elevated: '#fafafa',
    input: '#fafafa',
    inputFocus: '#ffffff'
  },
  
  // Text colors
  text: {
    primary: '#2c2e33',
    secondary: '#646669',
    tertiary: '#9ca3af',
    disabled: '#d1d5db',
    inverse: '#ffffff'
  },
  
  // Borders
  border: {
    light: 'rgba(0, 0, 0, 0.04)',
    normal: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.08)',
    strong: 'rgba(0, 0, 0, 0.12)',
    focus: '#2c2e33'
  },
  
  // Buttons
  button: {
    primary: '#2c2e33',
    primaryHover: '#1a1c1f',
    secondary: '#ffffff',
    secondaryHover: '#fafafa',
    danger: '#dc2626',
    dangerHover: '#b91c1c'
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 2px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 20px rgba(0, 0, 0, 0.08)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.12)',
    inset: '0 1px 2px rgba(0, 0, 0, 0.1) inset'
  },
  
  // Gradients
  gradient: {
    card: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
    button: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    hover: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    active: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
    header: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    tooltip: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
  },
  
  // Special colors
  accent: {
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6'
  },
  
  // Backdrop
  backdrop: 'rgba(0, 0, 0, 0.5)',
  
  // Mode identifier
  isDark: false
  },
  
  dark: {
    name: 'Dark',
    id: 'dark',
  // Page backgrounds
  background: {
    page: '#0f1117',
    card: '#1a1d24',
    elevated: '#23262f',
    input: '#23262f',
    inputFocus: '#2c2f38'
  },
  
  // Text colors
  text: {
    primary: '#e5e7eb',
    secondary: '#9ca3af',
    tertiary: '#6b7280',
    disabled: '#4b5563',
    inverse: '#0f1117'
  },
  
  // Borders
  border: {
    light: 'rgba(255, 255, 255, 0.04)',
    normal: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.08)',
    strong: 'rgba(255, 255, 255, 0.12)',
    focus: '#6366f1'
  },
  
  // Buttons
  button: {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    secondary: '#23262f',
    secondaryHover: '#2c2f38',
    danger: '#dc2626',
    dangerHover: '#b91c1c'
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 2px 8px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 20px rgba(0, 0, 0, 0.5)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.6)',
    inset: '0 1px 2px rgba(0, 0, 0, 0.4) inset'
  },
  
  // Gradients
  gradient: {
    card: 'linear-gradient(135deg, #1a1d24 0%, #23262f 100%)',
    button: 'linear-gradient(135deg, #23262f 0%, #2c2f38 100%)',
    hover: 'linear-gradient(135deg, #2c2f38 0%, #353842 100%)',
    active: 'linear-gradient(135deg, #353842 0%, #3f434e 100%)',
    header: 'linear-gradient(180deg, #1a1d24 0%, #23262f 100%)',
    tooltip: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
  },
  
  // Special colors (slightly adjusted for dark mode)
  accent: {
    blue: '#60a5fa',
    green: '#34d399',
    yellow: '#fbbf24',
    red: '#f87171',
    purple: '#a78bfa'
  },
  
  // Backdrop
  backdrop: 'rgba(0, 0, 0, 0.7)',
  
  // Mode identifier
  isDark: true
  },
  
  midnight: {
    name: 'Midnight',
    id: 'midnight',
    background: {
      page: '#0a0e27',
      card: '#151937',
      elevated: '#1e2442',
      input: '#1e2442',
      inputFocus: '#252b4f'
    },
    text: {
      primary: '#e0e7ff',
      secondary: '#a5b4fc',
      tertiary: '#818cf8',
      disabled: '#4c5989',
      inverse: '#0a0e27'
    },
    border: {
      light: 'rgba(165, 180, 252, 0.05)',
      normal: 'rgba(165, 180, 252, 0.1)',
      medium: 'rgba(165, 180, 252, 0.15)',
      strong: 'rgba(165, 180, 252, 0.25)',
      focus: '#6366f1'
    },
    button: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      secondary: '#1e2442',
      secondaryHover: '#252b4f',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 2px 8px rgba(0, 0, 0, 0.6)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.7)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.8)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.6) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #151937 0%, #1e2442 100%)',
      button: 'linear-gradient(135deg, #1e2442 0%, #252b4f 100%)',
      hover: 'linear-gradient(135deg, #252b4f 0%, #2d3358 100%)',
      active: 'linear-gradient(135deg, #2d3358 0%, #363d6b 100%)',
      header: 'linear-gradient(180deg, #151937 0%, #1e2442 100%)',
      tooltip: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    },
    accent: {
      blue: '#818cf8',
      green: '#34d399',
      yellow: '#fbbf24',
      red: '#f87171',
      purple: '#c084fc'
    },
    backdrop: 'rgba(0, 0, 0, 0.8)',
    isDark: true
  },
  
  ocean: {
    name: 'Ocean',
    id: 'ocean',
    background: {
      page: '#0c1524',
      card: '#162032',
      elevated: '#1d2c42',
      input: '#1d2c42',
      inputFocus: '#243751'
    },
    text: {
      primary: '#e0f2fe',
      secondary: '#7dd3fc',
      tertiary: '#38bdf8',
      disabled: '#475569',
      inverse: '#0c1524'
    },
    border: {
      light: 'rgba(125, 211, 252, 0.05)',
      normal: 'rgba(125, 211, 252, 0.1)',
      medium: 'rgba(125, 211, 252, 0.15)',
      strong: 'rgba(125, 211, 252, 0.25)',
      focus: '#0ea5e9'
    },
    button: {
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      secondary: '#1d2c42',
      secondaryHover: '#243751',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 2px 8px rgba(0, 0, 0, 0.6)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.7)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.8)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.6) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #162032 0%, #1d2c42 100%)',
      button: 'linear-gradient(135deg, #1d2c42 0%, #243751 100%)',
      hover: 'linear-gradient(135deg, #243751 0%, #2d4562 100%)',
      active: 'linear-gradient(135deg, #2d4562 0%, #365373 100%)',
      header: 'linear-gradient(180deg, #162032 0%, #1d2c42 100%)',
      tooltip: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
    },
    accent: {
      blue: '#38bdf8',
      green: '#34d399',
      yellow: '#fbbf24',
      red: '#f87171',
      purple: '#a78bfa'
    },
    backdrop: 'rgba(0, 0, 0, 0.8)',
    isDark: true
  },
  
  forest: {
    name: 'Forest',
    id: 'forest',
    background: {
      page: '#0f1f14',
      card: '#1a2e23',
      elevated: '#243b2e',
      input: '#243b2e',
      inputFocus: '#2d4939'
    },
    text: {
      primary: '#d1fae5',
      secondary: '#6ee7b7',
      tertiary: '#34d399',
      disabled: '#4b5f54',
      inverse: '#0f1f14'
    },
    border: {
      light: 'rgba(110, 231, 183, 0.05)',
      normal: 'rgba(110, 231, 183, 0.1)',
      medium: 'rgba(110, 231, 183, 0.15)',
      strong: 'rgba(110, 231, 183, 0.25)',
      focus: '#10b981'
    },
    button: {
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#243b2e',
      secondaryHover: '#2d4939',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 2px 8px rgba(0, 0, 0, 0.6)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.7)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.8)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.6) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #1a2e23 0%, #243b2e 100%)',
      button: 'linear-gradient(135deg, #243b2e 0%, #2d4939 100%)',
      hover: 'linear-gradient(135deg, #2d4939 0%, #375a45 100%)',
      active: 'linear-gradient(135deg, #375a45 0%, #416b52 100%)',
      header: 'linear-gradient(180deg, #1a2e23 0%, #243b2e 100%)',
      tooltip: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    accent: {
      blue: '#60a5fa',
      green: '#34d399',
      yellow: '#fbbf24',
      red: '#f87171',
      purple: '#a78bfa'
    },
    backdrop: 'rgba(0, 0, 0, 0.8)',
    isDark: true
  }
};

export function ThemeProvider({ children }) {
  // Check localStorage for saved theme preference
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-theme');
    return saved || 'light';
  });

  // Get current theme object
  const theme = THEMES[currentThemeId] || THEMES.light;

  // Set theme by ID
  const setTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentThemeId(themeId);
      localStorage.setItem('collabcanvas-theme', themeId);
    }
  };

  // Toggle between light and dark (for backward compatibility)
  const toggleTheme = () => {
    const newThemeId = theme.isDark ? 'light' : 'dark';
    setTheme(newThemeId);
  };

  // Update document background color when theme changes
  useEffect(() => {
    document.body.style.backgroundColor = theme.background.page;
    document.body.style.color = theme.text.primary;
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [theme]);

  const value = {
    theme,
    currentThemeId,
    isDark: theme.isDark,
    setTheme,
    toggleTheme,
    availableThemes: Object.values(THEMES)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

