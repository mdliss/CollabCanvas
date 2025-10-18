/**
 * Template Selection Modal - Choose starting template for new canvas
 * 
 * Shows available templates with previews and descriptions.
 * Matches existing modal design system (Roboto Mono, minimal aesthetic).
 * Premium templates gated for free users.
 */

import { useState } from 'react';
import { TEMPLATES } from '../../utils/templates';

export default function TemplateSelectionModal({ onSelect, onClose, isPremium }) {
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    onSelect(selectedTemplate);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isCreating) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isCreating) {
      onClose();
    }
  };

  return (
    <div onClick={handleBackdropClick} onKeyDown={handleKeyDown} style={styles.backdrop}>
      <div style={styles.modal}>
        <button
          onClick={onClose}
          disabled={isCreating}
          style={{
            ...styles.closeButton,
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isCreating) {
              e.target.style.color = '#2c2e33';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCreating) {
              e.target.style.color = '#9ca3af';
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
                  borderColor: selectedTemplate === key ? '#2c2e33' : '#e0e0e0',
                  borderWidth: '2px', // Fixed at 2px to prevent text reflow
                  cursor: isCreating ? 'not-allowed' : isLocked ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : isLocked ? 0.5 : 1,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isCreating && !isLocked && selectedTemplate !== key) {
                    e.target.style.borderColor = '#9ca3af';
                    e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreating && !isLocked && selectedTemplate !== key) {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  }
                }}
              >
                <div style={styles.templateIcon}>{template.icon}</div>
                <div style={styles.templateName}>{template.name}</div>
                <div style={styles.templateDescription}>
                  {isLocked ? 'Premium membership required' : template.description}
                </div>
                {selectedTemplate === key && !isLocked && (
                  <div style={styles.selectedBadge}>Selected</div>
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
                e.target.style.background = '#f5f5f5';
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCreating) {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
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
                e.target.style.background = '#1a1c1f';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCreating) {
                e.target.style.background = '#2c2e33';
              }
            }}
          >
            {isCreating ? 'Creating...' : 'Create Canvas'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
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
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '8px',
    lineHeight: '1',
    transition: 'color 0.2s ease'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2c2e33',
    margin: '0 0 8px 0',
    fontFamily: "'Roboto Mono', monospace"
  },
  subtitle: {
    fontSize: '14px',
    color: '#646669',
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
    background: '#ffffff',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    padding: '24px 20px', // Increased horizontal padding
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
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
    color: '#2c2e33',
    fontFamily: "'Roboto Mono', monospace",
    marginBottom: '4px'
  },
  templateDescription: {
    fontSize: '12px',
    color: '#646669',
    fontFamily: "'Roboto Mono', monospace",
    lineHeight: '1.4'
  },
  selectedBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#2c2e33',
    color: '#ffffff',
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
    background: '#ffffff',
    color: '#2c2e33',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Roboto Mono', monospace"
  },
  createButton: {
    background: '#2c2e33',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Roboto Mono', monospace"
  }
};

