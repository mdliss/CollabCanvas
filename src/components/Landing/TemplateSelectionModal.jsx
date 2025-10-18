/**
 * Template Selection Modal - Choose starting template for new canvas
 * 
 * Shows available templates with previews and descriptions.
 * Matches existing modal design system (Roboto Mono, minimal aesthetic).
 * Premium templates gated for free users.
 */

import { useState, useEffect } from 'react';
import { TEMPLATES } from '../../utils/templates';
import { useTheme } from '../../contexts/ThemeContext';

export default function TemplateSelectionModal({ onSelect, onClose, isPremium }) {
  const { theme } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isCreating, setIsCreating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    onSelect(selectedTemplate);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isCreating) {
      handleClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isCreating) {
      handleClose();
    }
  };

  const styles = getStyles(theme);

  return (
    <>
      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      
      <div 
        onClick={handleBackdropClick} 
        onKeyDown={handleKeyDown} 
        style={{
          ...styles.backdrop,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{
        ...styles.modal,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <button
          onClick={handleClose}
          disabled={isCreating}
          style={{
            ...styles.closeButton,
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isCreating) {
              e.target.style.color = theme.text.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isCreating) {
              e.target.style.color = theme.text.tertiary;
            }
          }}
        >
          ×
        </button>

        <h3 style={styles.title}>Choose a Template</h3>
        <p style={styles.subtitle}>Start with a pre-built layout or blank canvas</p>

        <div style={styles.templateGrid}>
          {Object.entries(TEMPLATES).map(([key, template]) => {
            const isPremiumTemplate = key !== 'blank';
            const isLocked = isPremiumTemplate && !isPremium;
            
            return (
              <button
                key={key}
                onClick={() => !isLocked && setSelectedTemplate(key)}
                disabled={isCreating || isLocked}
                style={{
                  ...styles.templateCard,
                  borderColor: selectedTemplate === key ? theme.button.primary : theme.border.medium,
                  borderWidth: '2px', // Fixed at 2px to prevent text reflow
                  cursor: isCreating ? 'not-allowed' : isLocked ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : isLocked ? 0.5 : 1,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isCreating && !isLocked && selectedTemplate !== key) {
                    e.target.style.borderColor = theme.border.strong;
                    e.target.style.boxShadow = theme.shadow.lg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreating && !isLocked && selectedTemplate !== key) {
                    e.target.style.borderColor = theme.border.medium;
                    e.target.style.boxShadow = theme.shadow.md;
                  }
                }}
              >
                <div style={styles.templateIcon}>{template.icon}</div>
                <div style={styles.templateName}>{template.name}</div>
                <div style={styles.templateDescription}>
                  {isLocked ? 'Premium membership required' : template.description}
                </div>
                {selectedTemplate === key && !isLocked && (
                  <div style={{
                    ...styles.selectedBadge,
                    animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>Selected</div>
                )}
                {isLocked && (
                  <div style={styles.lockBadge}>🔒</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={styles.actions}>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              ...styles.cancelButton,
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.target.style.background = theme.background.elevated;
                e.target.style.borderColor = theme.border.strong;
              }
            }}
            onMouseLeave={(e) => {
              if (!isCreating) {
                e.target.style.background = theme.background.card;
                e.target.style.borderColor = theme.border.medium;
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            style={{
              ...styles.createButton,
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.7 : 1
            }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.target.style.background = theme.button.primaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  e.target.style.background = theme.button.primary;
                }
              }}
          >
            {isCreating ? 'Creating...' : 'Create Canvas'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

const getStyles = (theme) => ({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.backdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    background: theme.background.card,
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: theme.shadow.xl,
    position: 'relative',
    fontFamily: "'Roboto Mono', monospace"
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    fontSize: '32px',
    color: theme.text.tertiary,
    cursor: 'pointer',
    padding: '8px',
    lineHeight: '1',
    transition: 'color 0.2s ease'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: theme.text.primary,
    margin: '0 0 8px 0',
    fontFamily: "'Roboto Mono', monospace"
  },
  subtitle: {
    fontSize: '14px',
    color: theme.text.secondary,
    margin: '0 0 32px 0',
    fontFamily: "'Roboto Mono', monospace"
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  templateCard: {
    background: theme.background.card,
    border: `2px solid ${theme.border.medium}`,
    borderRadius: '10px',
    padding: '24px 20px', // Increased horizontal padding
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow.md,
    position: 'relative',
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box' // Ensure border doesn't affect layout
  },
  templateIcon: {
    fontSize: '48px',
    marginBottom: '8px'
  },
  templateName: {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.text.primary,
    fontFamily: "'Roboto Mono', monospace",
    marginBottom: '4px'
  },
  templateDescription: {
    fontSize: '12px',
    color: theme.text.secondary,
    fontFamily: "'Roboto Mono', monospace",
    lineHeight: '1.4'
  },
  selectedBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: theme.button.primary,
    color: theme.text.inverse,
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: "'Roboto Mono', monospace"
  },
  lockBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    fontSize: '20px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    background: theme.background.card,
    color: theme.text.primary,
    border: `1px solid ${theme.border.medium}`,
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Roboto Mono', monospace"
  },
  createButton: {
    background: theme.button.primary,
    color: theme.text.inverse,
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Roboto Mono', monospace"
  }
});

