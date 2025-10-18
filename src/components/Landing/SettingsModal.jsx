/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Settings Modal - User Preferences and App Settings
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides access to user settings including theme selection.
 * Matches the design language of other modals (ShareModal, RenameModal).
 * 
 * FEATURES:
 * - Theme toggle (Light/Dark)
 * - Smooth transitions
 * - Consistent modal styling
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsModal({ onClose, isPremium = false, onShowUpgrade }) {
  console.log('[SETTINGS MODAL] Component rendering');
  const { theme, currentThemeId, setTheme, availableThemes } = useTheme();
  console.log('[SETTINGS MODAL] Theme loaded:', { currentThemeId, themeCount: availableThemes?.length, isPremium });
  const [isVisible, setIsVisible] = useState(false);
  
  // Trigger entrance animation
  useEffect(() => {
    console.log('[SETTINGS MODAL] Component mounted');
    setTimeout(() => {
      console.log('[SETTINGS MODAL] Setting isVisible to true');
      setIsVisible(true);
    }, 50);
    
    return () => {
      console.log('[SETTINGS MODAL] Component unmounting');
    };
  }, []);

  const handleBackdropClick = (e) => {
    console.log('[SETTINGS MODAL] Backdrop clicked');
    if (e.target === e.currentTarget) {
      console.log('[SETTINGS MODAL] Closing modal (backdrop click)');
      handleClose();
    }
  };
  
  const handleClose = () => {
    console.log('[SETTINGS MODAL] handleClose called');
    setIsVisible(false);
    setTimeout(() => {
      console.log('[SETTINGS MODAL] Calling onClose');
      onClose();
    }, 300);
  };

  const handleThemeChange = (themeOption) => {
    console.log('[SETTINGS MODAL] Theme change requested:', themeOption.id);
    
    // Check if theme is locked (premium only)
    if (themeOption.isPremium && !isPremium) {
      console.log('[SETTINGS MODAL] Theme is premium and user is not premium - showing upgrade prompt');
      if (onShowUpgrade) {
        onShowUpgrade();
      }
      return;
    }
    
    setTheme(themeOption.id);
    console.log('[SETTINGS MODAL] setTheme called with:', themeOption.id);
  };

  const styles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.backdrop,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10003,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    modal: {
      background: theme.background.card,
      borderRadius: '16px',
      padding: '36px',
      maxWidth: '480px',
      width: '90%',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      position: 'relative',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'transparent',
      border: 'none',
      fontSize: '28px',
      color: theme.text.tertiary,
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s ease'
    },
    
    title: {
      margin: '0 0 4px 0',
      fontSize: '20px',
      fontWeight: '600',
      color: theme.text.primary,
      textAlign: 'center',
      letterSpacing: '-0.02em'
    },
    
    subtitle: {
      margin: '0 0 32px 0',
      fontSize: '13px',
      color: theme.text.secondary,
      textAlign: 'center',
      fontWeight: '400'
    },
    
    section: {
      marginBottom: '28px'
    },
    
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    
    settingRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      background: theme.background.elevated,
      borderRadius: '10px',
      border: `1px solid ${theme.border.light}`,
      marginBottom: '10px',
      transition: 'all 0.2s ease'
    },
    
    settingLabel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    
    settingName: {
      fontSize: '14px',
      fontWeight: '500',
      color: theme.text.primary
    },
    
    settingDescription: {
      fontSize: '12px',
      color: theme.text.secondary
    },
    
    
    themeOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '16px'
    },
    
    themeOption: (isActive, isLocked) => ({
      padding: '14px',
      borderRadius: '10px',
      border: `2px solid ${isActive ? theme.button.primary : theme.border.medium}`,
      background: isActive 
        ? (theme.isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(44, 46, 51, 0.05)') 
        : theme.background.card,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
      position: 'relative',
      transform: 'scale(1)',
      opacity: isLocked ? 0.6 : 1
    }),
    
    themeOptionLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: theme.text.primary,
      marginTop: '10px',
      letterSpacing: '0.02em'
    },
    
    activeIndicator: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: theme.button.primary,
      color: theme.text.inverse,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '700'
    },
    
    lockIndicator: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      fontSize: '16px'
    },
    
    themePreview: {
      width: '100%',
      height: '50px',
      borderRadius: '6px',
      marginBottom: '4px',
      display: 'flex',
      gap: '4px',
      padding: '6px',
      background: theme.background.elevated
    },
    
    previewBox: (bg) => ({
      flex: 1,
      background: bg,
      borderRadius: '4px'
    }),

    footer: {
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: `1px solid ${theme.border.normal}`,
      fontSize: '12px',
      color: theme.text.tertiary,
      textAlign: 'center'
    }
  };

  console.log('[SETTINGS MODAL] Rendering with isVisible:', isVisible);
  
  return (
    <div onClick={handleBackdropClick} style={styles.backdrop}>
      <div 
        onClick={(e) => {
          console.log('[SETTINGS MODAL] Modal content clicked (should not close)');
          e.stopPropagation();
        }}
        style={styles.modal}>
        <button
          onClick={handleClose}
          style={styles.closeButton}
          onMouseEnter={(e) => e.target.style.color = theme.text.primary}
          onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
        >
          ×
        </button>

        <h3 style={styles.title}>Settings</h3>
        <p style={styles.subtitle}>Customize your CollabCanvas experience</p>

        {/* Theme Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>Appearance</span>
          </div>
          
          {/* Theme Options Grid */}
          <div style={styles.themeOptions}>
            {availableThemes.map((themeOption) => {
              const isActive = currentThemeId === themeOption.id;
              const isLocked = themeOption.isPremium && !isPremium;
              const colors = [
                themeOption.background.page,
                themeOption.background.card,
                themeOption.background.elevated
              ];
              
              return (
                <div
                  key={themeOption.id}
                  onClick={() => handleThemeChange(themeOption)}
                  style={{
                    ...styles.themeOption(isActive, isLocked),
                    cursor: isLocked ? 'pointer' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isLocked ? theme.border.medium : theme.border.strong;
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = theme.border.medium;
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <div style={styles.themePreview}>
                    {colors.map((color, idx) => (
                      <div key={idx} style={styles.previewBox(color)} />
                    ))}
                  </div>
                  <div style={styles.themeOptionLabel}>
                    {themeOption.name}
                  </div>
                  {isActive && !isLocked && (
                    <div style={styles.activeIndicator}>✓</div>
                  )}
                  {isLocked && (
                    <div style={styles.lockIndicator}>🔒</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.footer}>
          {!isPremium && (
            <div style={{
              marginBottom: '12px',
              fontSize: '12px',
              color: theme.text.secondary,
              textAlign: 'center'
            }}>
              🔒 Premium themes available with subscription
            </div>
          )}
          Theme changes apply immediately across all pages
        </div>
      </div>
    </div>
  );
}

