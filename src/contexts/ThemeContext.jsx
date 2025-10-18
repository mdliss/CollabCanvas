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
    isPremium: false,
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
    isPremium: false,
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
    isPremium: true,
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
    isPremium: true,
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
    isPremium: false,
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
  },
  
  dracula: {
    name: 'Dracula',
    id: 'dracula',
    isPremium: true,
    background: {
      page: '#282a36',
      card: '#383a59',
      elevated: '#44475a',
      input: '#44475a',
      inputFocus: '#4d5066'
    },
    text: {
      primary: '#f8f8f2',
      secondary: '#bd93f9',
      tertiary: '#6272a4',
      disabled: '#6272a4',
      inverse: '#282a36'
    },
    border: {
      light: 'rgba(189, 147, 249, 0.1)',
      normal: 'rgba(189, 147, 249, 0.15)',
      medium: 'rgba(189, 147, 249, 0.2)',
      strong: 'rgba(189, 147, 249, 0.3)',
      focus: '#bd93f9'
    },
    button: {
      primary: '#bd93f9',
      primaryHover: '#a671f5',
      secondary: '#44475a',
      secondaryHover: '#4d5066',
      danger: '#ff5555',
      dangerHover: '#ff3838'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 2px 8px rgba(0, 0, 0, 0.6)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.7)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.8)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.6) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #383a59 0%, #44475a 100%)',
      button: 'linear-gradient(135deg, #44475a 0%, #4d5066 100%)',
      hover: 'linear-gradient(135deg, #4d5066 0%, #565973 100%)',
      active: 'linear-gradient(135deg, #565973 0%, #5f6380 100%)',
      header: 'linear-gradient(180deg, #383a59 0%, #44475a 100%)',
      tooltip: 'linear-gradient(135deg, #bd93f9 0%, #a671f5 100%)'
    },
    accent: {
      blue: '#8be9fd',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      red: '#ff5555',
      purple: '#bd93f9'
    },
    backdrop: 'rgba(0, 0, 0, 0.8)',
    isDark: true
  },
  
  monokai: {
    name: 'Monokai',
    id: 'monokai',
    isPremium: true,
    background: {
      page: '#272822',
      card: '#3e3d32',
      elevated: '#49483e',
      input: '#49483e',
      inputFocus: '#5b5a4f'
    },
    text: {
      primary: '#f8f8f2',
      secondary: '#a6e22e',
      tertiary: '#75715e',
      disabled: '#75715e',
      inverse: '#272822'
    },
    border: {
      light: 'rgba(166, 226, 46, 0.1)',
      normal: 'rgba(166, 226, 46, 0.15)',
      medium: 'rgba(166, 226, 46, 0.2)',
      strong: 'rgba(166, 226, 46, 0.3)',
      focus: '#a6e22e'
    },
    button: {
      primary: '#a6e22e',
      primaryHover: '#8dc622',
      secondary: '#49483e',
      secondaryHover: '#5b5a4f',
      danger: '#f92672',
      dangerHover: '#e11d5f'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #3e3d32 0%, #49483e 100%)',
      button: 'linear-gradient(135deg, #49483e 0%, #5b5a4f 100%)',
      hover: 'linear-gradient(135deg, #5b5a4f 0%, #6d6c60 100%)',
      active: 'linear-gradient(135deg, #6d6c60 0%, #7f7e71 100%)',
      header: 'linear-gradient(180deg, #3e3d32 0%, #49483e 100%)',
      tooltip: 'linear-gradient(135deg, #a6e22e 0%, #8dc622 100%)'
    },
    accent: {
      blue: '#66d9ef',
      green: '#a6e22e',
      yellow: '#e6db74',
      red: '#f92672',
      purple: '#ae81ff'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  nord: {
    name: 'Nord',
    id: 'nord',
    isPremium: true,
    background: {
      page: '#2e3440',
      card: '#3b4252',
      elevated: '#434c5e',
      input: '#434c5e',
      inputFocus: '#4c566a'
    },
    text: {
      primary: '#eceff4',
      secondary: '#88c0d0',
      tertiary: '#4c566a',
      disabled: '#4c566a',
      inverse: '#2e3440'
    },
    border: {
      light: 'rgba(136, 192, 208, 0.1)',
      normal: 'rgba(136, 192, 208, 0.15)',
      medium: 'rgba(136, 192, 208, 0.2)',
      strong: 'rgba(136, 192, 208, 0.3)',
      focus: '#88c0d0'
    },
    button: {
      primary: '#88c0d0',
      primaryHover: '#6facc2',
      secondary: '#434c5e',
      secondaryHover: '#4c566a',
      danger: '#bf616a',
      dangerHover: '#a84c56'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 2px 8px rgba(0, 0, 0, 0.6)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.7)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.8)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.6) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #3b4252 0%, #434c5e 100%)',
      button: 'linear-gradient(135deg, #434c5e 0%, #4c566a 100%)',
      hover: 'linear-gradient(135deg, #4c566a 0%, #5e6880 100%)',
      active: 'linear-gradient(135deg, #5e6880 0%, #707a96 100%)',
      header: 'linear-gradient(180deg, #3b4252 0%, #434c5e 100%)',
      tooltip: 'linear-gradient(135deg, #88c0d0 0%, #6facc2 100%)'
    },
    accent: {
      blue: '#5e81ac',
      green: '#a3be8c',
      yellow: '#ebcb8b',
      red: '#bf616a',
      purple: '#b48ead'
    },
    backdrop: 'rgba(0, 0, 0, 0.8)',
    isDark: true
  },
  
  gruvbox: {
    name: 'Gruvbox',
    id: 'gruvbox',
    isPremium: true,
    background: {
      page: '#282828',
      card: '#3c3836',
      elevated: '#504945',
      input: '#504945',
      inputFocus: '#665c54'
    },
    text: {
      primary: '#ebdbb2',
      secondary: '#fabd2f',
      tertiary: '#7c6f64',
      disabled: '#7c6f64',
      inverse: '#282828'
    },
    border: {
      light: 'rgba(250, 189, 47, 0.1)',
      normal: 'rgba(250, 189, 47, 0.15)',
      medium: 'rgba(250, 189, 47, 0.2)',
      strong: 'rgba(250, 189, 47, 0.3)',
      focus: '#fabd2f'
    },
    button: {
      primary: '#fabd2f',
      primaryHover: '#d79921',
      secondary: '#504945',
      secondaryHover: '#665c54',
      danger: '#fb4934',
      dangerHover: '#cc241d'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #3c3836 0%, #504945 100%)',
      button: 'linear-gradient(135deg, #504945 0%, #665c54 100%)',
      hover: 'linear-gradient(135deg, #665c54 0%, #7c6f64 100%)',
      active: 'linear-gradient(135deg, #7c6f64 0%, #928374 100%)',
      header: 'linear-gradient(180deg, #3c3836 0%, #504945 100%)',
      tooltip: 'linear-gradient(135deg, #fabd2f 0%, #d79921 100%)'
    },
    accent: {
      blue: '#83a598',
      green: '#b8bb26',
      yellow: '#fabd2f',
      red: '#fb4934',
      purple: '#d3869b'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  solarized: {
    name: 'Solarized',
    id: 'solarized',
    isPremium: true,
    background: {
      page: '#002b36',
      card: '#073642',
      elevated: '#0e4a5a',
      input: '#0e4a5a',
      inputFocus: '#145866'
    },
    text: {
      primary: '#fdf6e3',
      secondary: '#2aa198',
      tertiary: '#586e75',
      disabled: '#586e75',
      inverse: '#002b36'
    },
    border: {
      light: 'rgba(42, 161, 152, 0.1)',
      normal: 'rgba(42, 161, 152, 0.15)',
      medium: 'rgba(42, 161, 152, 0.2)',
      strong: 'rgba(42, 161, 152, 0.3)',
      focus: '#2aa198'
    },
    button: {
      primary: '#2aa198',
      primaryHover: '#1f8179',
      secondary: '#0e4a5a',
      secondaryHover: '#145866',
      danger: '#dc322f',
      dangerHover: '#b32826'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #073642 0%, #0e4a5a 100%)',
      button: 'linear-gradient(135deg, #0e4a5a 0%, #145866 100%)',
      hover: 'linear-gradient(135deg, #145866 0%, #1a6672 100%)',
      active: 'linear-gradient(135deg, #1a6672 0%, #20747e 100%)',
      header: 'linear-gradient(180deg, #073642 0%, #0e4a5a 100%)',
      tooltip: 'linear-gradient(135deg, #2aa198 0%, #1f8179 100%)'
    },
    accent: {
      blue: '#268bd2',
      green: '#859900',
      yellow: '#b58900',
      red: '#dc322f',
      purple: '#6c71c4'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  tokyonight: {
    name: 'Tokyo Night',
    id: 'tokyonight',
    isPremium: true,
    background: {
      page: '#1a1b26',
      card: '#24283b',
      elevated: '#2f3549',
      input: '#2f3549',
      inputFocus: '#3b4058'
    },
    text: {
      primary: '#c0caf5',
      secondary: '#7aa2f7',
      tertiary: '#565f89',
      disabled: '#565f89',
      inverse: '#1a1b26'
    },
    border: {
      light: 'rgba(122, 162, 247, 0.1)',
      normal: 'rgba(122, 162, 247, 0.15)',
      medium: 'rgba(122, 162, 247, 0.2)',
      strong: 'rgba(122, 162, 247, 0.3)',
      focus: '#7aa2f7'
    },
    button: {
      primary: '#7aa2f7',
      primaryHover: '#5a82e6',
      secondary: '#2f3549',
      secondaryHover: '#3b4058',
      danger: '#f7768e',
      dangerHover: '#e6566e'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #24283b 0%, #2f3549 100%)',
      button: 'linear-gradient(135deg, #2f3549 0%, #3b4058 100%)',
      hover: 'linear-gradient(135deg, #3b4058 0%, #474b66 100%)',
      active: 'linear-gradient(135deg, #474b66 0%, #535774 100%)',
      header: 'linear-gradient(180deg, #24283b 0%, #2f3549 100%)',
      tooltip: 'linear-gradient(135deg, #7aa2f7 0%, #5a82e6 100%)'
    },
    accent: {
      blue: '#7aa2f7',
      green: '#9ece6a',
      yellow: '#e0af68',
      red: '#f7768e',
      purple: '#bb9af7'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  catppuccin: {
    name: 'Catppuccin',
    id: 'catppuccin',
    isPremium: true,
    background: {
      page: '#1e1e2e',
      card: '#313244',
      elevated: '#45475a',
      input: '#45475a',
      inputFocus: '#585b70'
    },
    text: {
      primary: '#cdd6f4',
      secondary: '#f5c2e7',
      tertiary: '#6c7086',
      disabled: '#6c7086',
      inverse: '#1e1e2e'
    },
    border: {
      light: 'rgba(245, 194, 231, 0.1)',
      normal: 'rgba(245, 194, 231, 0.15)',
      medium: 'rgba(245, 194, 231, 0.2)',
      strong: 'rgba(245, 194, 231, 0.3)',
      focus: '#f5c2e7'
    },
    button: {
      primary: '#f5c2e7',
      primaryHover: '#e5a2d7',
      secondary: '#45475a',
      secondaryHover: '#585b70',
      danger: '#f38ba8',
      dangerHover: '#e36b88'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #313244 0%, #45475a 100%)',
      button: 'linear-gradient(135deg, #45475a 0%, #585b70 100%)',
      hover: 'linear-gradient(135deg, #585b70 0%, #6c7086 100%)',
      active: 'linear-gradient(135deg, #6c7086 0%, #7f849c 100%)',
      header: 'linear-gradient(180deg, #313244 0%, #45475a 100%)',
      tooltip: 'linear-gradient(135deg, #f5c2e7 0%, #e5a2d7 100%)'
    },
    accent: {
      blue: '#89b4fa',
      green: '#a6e3a1',
      yellow: '#f9e2af',
      red: '#f38ba8',
      purple: '#cba6f7'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  rosepine: {
    name: 'Rosé Pine',
    id: 'rosepine',
    isPremium: true,
    background: {
      page: '#191724',
      card: '#1f1d2e',
      elevated: '#26233a',
      input: '#26233a',
      inputFocus: '#2d2a45'
    },
    text: {
      primary: '#e0def4',
      secondary: '#c4a7e7',
      tertiary: '#6e6a86',
      disabled: '#6e6a86',
      inverse: '#191724'
    },
    border: {
      light: 'rgba(196, 167, 231, 0.1)',
      normal: 'rgba(196, 167, 231, 0.15)',
      medium: 'rgba(196, 167, 231, 0.2)',
      strong: 'rgba(196, 167, 231, 0.3)',
      focus: '#c4a7e7'
    },
    button: {
      primary: '#c4a7e7',
      primaryHover: '#a487c7',
      secondary: '#26233a',
      secondaryHover: '#2d2a45',
      danger: '#eb6f92',
      dangerHover: '#cb4f72'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #1f1d2e 0%, #26233a 100%)',
      button: 'linear-gradient(135deg, #26233a 0%, #2d2a45 100%)',
      hover: 'linear-gradient(135deg, #2d2a45 0%, #34304f 100%)',
      active: 'linear-gradient(135deg, #34304f 0%, #3b365a 100%)',
      header: 'linear-gradient(180deg, #1f1d2e 0%, #26233a 100%)',
      tooltip: 'linear-gradient(135deg, #c4a7e7 0%, #a487c7 100%)'
    },
    accent: {
      blue: '#9ccfd8',
      green: '#31748f',
      yellow: '#f6c177',
      red: '#eb6f92',
      purple: '#c4a7e7'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  sunset: {
    name: 'Sunset',
    id: 'sunset',
    isPremium: true,
    background: {
      page: '#1a0f1f',
      card: '#2b1b30',
      elevated: '#3c2741',
      input: '#3c2741',
      inputFocus: '#4d3352'
    },
    text: {
      primary: '#ffe5ec',
      secondary: '#ffadbc',
      tertiary: '#8a6a8c',
      disabled: '#8a6a8c',
      inverse: '#1a0f1f'
    },
    border: {
      light: 'rgba(255, 173, 188, 0.1)',
      normal: 'rgba(255, 173, 188, 0.15)',
      medium: 'rgba(255, 173, 188, 0.2)',
      strong: 'rgba(255, 173, 188, 0.3)',
      focus: '#ffadbc'
    },
    button: {
      primary: '#ff8da7',
      primaryHover: '#ff6d87',
      secondary: '#3c2741',
      secondaryHover: '#4d3352',
      danger: '#ff5577',
      dangerHover: '#ff3357'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #2b1b30 0%, #3c2741 100%)',
      button: 'linear-gradient(135deg, #3c2741 0%, #4d3352 100%)',
      hover: 'linear-gradient(135deg, #4d3352 0%, #5e3f63 100%)',
      active: 'linear-gradient(135deg, #5e3f63 0%, #6f4b74 100%)',
      header: 'linear-gradient(180deg, #2b1b30 0%, #3c2741 100%)',
      tooltip: 'linear-gradient(135deg, #ff8da7 0%, #ff6d87 100%)'
    },
    accent: {
      blue: '#a9c9ff',
      green: '#77dd77',
      yellow: '#ffd97d',
      red: '#ff6b9d',
      purple: '#c9a3ff'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  cyberpunk: {
    name: 'Cyberpunk',
    id: 'cyberpunk',
    isPremium: true,
    background: {
      page: '#0d0221',
      card: '#1a0b33',
      elevated: '#271440',
      input: '#271440',
      inputFocus: '#341d4d'
    },
    text: {
      primary: '#00ff9f',
      secondary: '#ff0090',
      tertiary: '#6a4c93',
      disabled: '#6a4c93',
      inverse: '#0d0221'
    },
    border: {
      light: 'rgba(0, 255, 159, 0.1)',
      normal: 'rgba(0, 255, 159, 0.15)',
      medium: 'rgba(0, 255, 159, 0.2)',
      strong: 'rgba(0, 255, 159, 0.3)',
      focus: '#00ff9f'
    },
    button: {
      primary: '#00ff9f',
      primaryHover: '#00df7f',
      secondary: '#271440',
      secondaryHover: '#341d4d',
      danger: '#ff0090',
      dangerHover: '#df0070'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.7)',
      md: '0 2px 8px rgba(0, 0, 0, 0.8)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.9)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.95)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.8) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #1a0b33 0%, #271440 100%)',
      button: 'linear-gradient(135deg, #271440 0%, #341d4d 100%)',
      hover: 'linear-gradient(135deg, #341d4d 0%, #41265a 100%)',
      active: 'linear-gradient(135deg, #41265a 0%, #4e2f67 100%)',
      header: 'linear-gradient(180deg, #1a0b33 0%, #271440 100%)',
      tooltip: 'linear-gradient(135deg, #00ff9f 0%, #00df7f 100%)'
    },
    accent: {
      blue: '#00d9ff',
      green: '#00ff9f',
      yellow: '#f7ff00',
      red: '#ff0090',
      purple: '#d900ff'
    },
    backdrop: 'rgba(0, 0, 0, 0.9)',
    isDark: true
  },
  
  cherry: {
    name: 'Cherry',
    id: 'cherry',
    isPremium: true,
    background: {
      page: '#1a0509',
      card: '#2b0e14',
      elevated: '#3c171f',
      input: '#3c171f',
      inputFocus: '#4d202a'
    },
    text: {
      primary: '#ffd7e3',
      secondary: '#ff6b9d',
      tertiary: '#8a4a5a',
      disabled: '#8a4a5a',
      inverse: '#1a0509'
    },
    border: {
      light: 'rgba(255, 107, 157, 0.1)',
      normal: 'rgba(255, 107, 157, 0.15)',
      medium: 'rgba(255, 107, 157, 0.2)',
      strong: 'rgba(255, 107, 157, 0.3)',
      focus: '#ff6b9d'
    },
    button: {
      primary: '#ff6b9d',
      primaryHover: '#ff4b7d',
      secondary: '#3c171f',
      secondaryHover: '#4d202a',
      danger: '#ff3366',
      dangerHover: '#ff1346'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.7)',
      md: '0 2px 8px rgba(0, 0, 0, 0.8)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.9)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.95)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.8) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #2b0e14 0%, #3c171f 100%)',
      button: 'linear-gradient(135deg, #3c171f 0%, #4d202a 100%)',
      hover: 'linear-gradient(135deg, #4d202a 0%, #5e2935 100%)',
      active: 'linear-gradient(135deg, #5e2935 0%, #6f3240 100%)',
      header: 'linear-gradient(180deg, #2b0e14 0%, #3c171f 100%)',
      tooltip: 'linear-gradient(135deg, #ff6b9d 0%, #ff4b7d 100%)'
    },
    accent: {
      blue: '#ffa6c1',
      green: '#77ff99',
      yellow: '#ffd97d',
      red: '#ff3366',
      purple: '#ff88dd'
    },
    backdrop: 'rgba(0, 0, 0, 0.9)',
    isDark: true
  },
  
  synthwave: {
    name: 'Synthwave',
    id: 'synthwave',
    isPremium: true,
    background: {
      page: '#0a0015',
      card: '#1a0f2e',
      elevated: '#2a1e3e',
      input: '#2a1e3e',
      inputFocus: '#3a2d4e'
    },
    text: {
      primary: '#ff7edb',
      secondary: '#00f0ff',
      tertiary: '#6a5a8a',
      disabled: '#6a5a8a',
      inverse: '#0a0015'
    },
    border: {
      light: 'rgba(255, 126, 219, 0.1)',
      normal: 'rgba(255, 126, 219, 0.15)',
      medium: 'rgba(255, 126, 219, 0.2)',
      strong: 'rgba(255, 126, 219, 0.3)',
      focus: '#ff7edb'
    },
    button: {
      primary: '#ff7edb',
      primaryHover: '#ff5ebb',
      secondary: '#2a1e3e',
      secondaryHover: '#3a2d4e',
      danger: '#ff006e',
      dangerHover: '#df004e'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.8)',
      md: '0 2px 8px rgba(0, 0, 0, 0.9)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.95)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.98)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.9) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #1a0f2e 0%, #2a1e3e 100%)',
      button: 'linear-gradient(135deg, #2a1e3e 0%, #3a2d4e 100%)',
      hover: 'linear-gradient(135deg, #3a2d4e 0%, #4a3c5e 100%)',
      active: 'linear-gradient(135deg, #4a3c5e 0%, #5a4b6e 100%)',
      header: 'linear-gradient(180deg, #1a0f2e 0%, #2a1e3e 100%)',
      tooltip: 'linear-gradient(135deg, #ff7edb 0%, #ff5ebb 100%)'
    },
    accent: {
      blue: '#00f0ff',
      green: '#39ff14',
      yellow: '#ffeb3b',
      red: '#ff006e',
      purple: '#ff7edb'
    },
    backdrop: 'rgba(0, 0, 0, 0.95)',
    isDark: true
  },
  
  aurora: {
    name: 'Aurora',
    id: 'aurora',
    isPremium: true,
    background: {
      page: '#0c1a1f',
      card: '#162e38',
      elevated: '#1f4251',
      input: '#1f4251',
      inputFocus: '#28566a'
    },
    text: {
      primary: '#b8f2e6',
      secondary: '#5ddab4',
      tertiary: '#4a7a8a',
      disabled: '#4a7a8a',
      inverse: '#0c1a1f'
    },
    border: {
      light: 'rgba(93, 218, 180, 0.1)',
      normal: 'rgba(93, 218, 180, 0.15)',
      medium: 'rgba(93, 218, 180, 0.2)',
      strong: 'rgba(93, 218, 180, 0.3)',
      focus: '#5ddab4'
    },
    button: {
      primary: '#5ddab4',
      primaryHover: '#3dba94',
      secondary: '#1f4251',
      secondaryHover: '#28566a',
      danger: '#ff6b9d',
      dangerHover: '#ff4b7d'
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.6)',
      md: '0 2px 8px rgba(0, 0, 0, 0.7)',
      lg: '0 4px 20px rgba(0, 0, 0, 0.8)',
      xl: '0 8px 32px rgba(0, 0, 0, 0.9)',
      inset: '0 1px 2px rgba(0, 0, 0, 0.7) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #162e38 0%, #1f4251 100%)',
      button: 'linear-gradient(135deg, #1f4251 0%, #28566a 100%)',
      hover: 'linear-gradient(135deg, #28566a 0%, #316a83 100%)',
      active: 'linear-gradient(135deg, #316a83 0%, #3a7e9c 100%)',
      header: 'linear-gradient(180deg, #162e38 0%, #1f4251 100%)',
      tooltip: 'linear-gradient(135deg, #5ddab4 0%, #3dba94 100%)'
    },
    accent: {
      blue: '#73d7ff',
      green: '#5ddab4',
      yellow: '#ffd97d',
      red: '#ff6b9d',
      purple: '#b794f6'
    },
    backdrop: 'rgba(0, 0, 0, 0.85)',
    isDark: true
  },
  
  lavender: {
    name: 'Lavender',
    id: 'lavender',
    isPremium: true,
    background: {
      page: '#f5f3ff',
      card: '#ffffff',
      elevated: '#faf8ff',
      input: '#faf8ff',
      inputFocus: '#ffffff'
    },
    text: {
      primary: '#5b21b6',
      secondary: '#7c3aed',
      tertiary: '#a78bfa',
      disabled: '#c4b5fd',
      inverse: '#ffffff'
    },
    border: {
      light: 'rgba(124, 58, 237, 0.08)',
      normal: 'rgba(124, 58, 237, 0.12)',
      medium: 'rgba(124, 58, 237, 0.16)',
      strong: 'rgba(124, 58, 237, 0.24)',
      focus: '#7c3aed'
    },
    button: {
      primary: '#7c3aed',
      primaryHover: '#6d28d9',
      secondary: '#ffffff',
      secondaryHover: '#faf8ff',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    shadow: {
      sm: '0 1px 2px rgba(124, 58, 237, 0.08)',
      md: '0 2px 8px rgba(124, 58, 237, 0.12)',
      lg: '0 4px 20px rgba(124, 58, 237, 0.16)',
      xl: '0 8px 32px rgba(124, 58, 237, 0.2)',
      inset: '0 1px 2px rgba(124, 58, 237, 0.15) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #ffffff 0%, #faf8ff 100%)',
      button: 'linear-gradient(135deg, #faf8ff 0%, #f5f3ff 100%)',
      hover: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      active: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
      header: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)',
      tooltip: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
    },
    accent: {
      blue: '#60a5fa',
      green: '#34d399',
      yellow: '#fbbf24',
      red: '#f87171',
      purple: '#a78bfa'
    },
    backdrop: 'rgba(124, 58, 237, 0.3)',
    isDark: false
  },
  
  coral: {
    name: 'Coral',
    id: 'coral',
    isPremium: true,
    background: {
      page: '#fff5f5',
      card: '#ffffff',
      elevated: '#fffafa',
      input: '#fffafa',
      inputFocus: '#ffffff'
    },
    text: {
      primary: '#be123c',
      secondary: '#e11d48',
      tertiary: '#fb7185',
      disabled: '#fda4af',
      inverse: '#ffffff'
    },
    border: {
      light: 'rgba(225, 29, 72, 0.08)',
      normal: 'rgba(225, 29, 72, 0.12)',
      medium: 'rgba(225, 29, 72, 0.16)',
      strong: 'rgba(225, 29, 72, 0.24)',
      focus: '#e11d48'
    },
    button: {
      primary: '#e11d48',
      primaryHover: '#be123c',
      secondary: '#ffffff',
      secondaryHover: '#fffafa',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    shadow: {
      sm: '0 1px 2px rgba(225, 29, 72, 0.08)',
      md: '0 2px 8px rgba(225, 29, 72, 0.12)',
      lg: '0 4px 20px rgba(225, 29, 72, 0.16)',
      xl: '0 8px 32px rgba(225, 29, 72, 0.2)',
      inset: '0 1px 2px rgba(225, 29, 72, 0.15) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #ffffff 0%, #fffafa 100%)',
      button: 'linear-gradient(135deg, #fffafa 0%, #fff5f5 100%)',
      hover: 'linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)',
      active: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
      header: 'linear-gradient(180deg, #ffffff 0%, #fffafa 100%)',
      tooltip: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
    },
    accent: {
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      red: '#ef4444',
      purple: '#8b5cf6'
    },
    backdrop: 'rgba(225, 29, 72, 0.3)',
    isDark: false
  },
  
  mint: {
    name: 'Mint',
    id: 'mint',
    isPremium: true,
    background: {
      page: '#f0fdf9',
      card: '#ffffff',
      elevated: '#f5fefb',
      input: '#f5fefb',
      inputFocus: '#ffffff'
    },
    text: {
      primary: '#065f46',
      secondary: '#059669',
      tertiary: '#34d399',
      disabled: '#6ee7b7',
      inverse: '#ffffff'
    },
    border: {
      light: 'rgba(5, 150, 105, 0.08)',
      normal: 'rgba(5, 150, 105, 0.12)',
      medium: 'rgba(5, 150, 105, 0.16)',
      strong: 'rgba(5, 150, 105, 0.24)',
      focus: '#059669'
    },
    button: {
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#ffffff',
      secondaryHover: '#f5fefb',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    shadow: {
      sm: '0 1px 2px rgba(5, 150, 105, 0.08)',
      md: '0 2px 8px rgba(5, 150, 105, 0.12)',
      lg: '0 4px 20px rgba(5, 150, 105, 0.16)',
      xl: '0 8px 32px rgba(5, 150, 105, 0.2)',
      inset: '0 1px 2px rgba(5, 150, 105, 0.15) inset'
    },
    gradient: {
      card: 'linear-gradient(135deg, #ffffff 0%, #f5fefb 100%)',
      button: 'linear-gradient(135deg, #f5fefb 0%, #f0fdf9 100%)',
      hover: 'linear-gradient(135deg, #f0fdf9 0%, #d1fae5 100%)',
      active: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      header: 'linear-gradient(180deg, #ffffff 0%, #f5fefb 100%)',
      tooltip: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    accent: {
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      red: '#ef4444',
      purple: '#8b5cf6'
    },
    backdrop: 'rgba(5, 150, 105, 0.3)',
    isDark: false
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

