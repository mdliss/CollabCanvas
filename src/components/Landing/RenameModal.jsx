/**
 * Rename Project Modal - Inline editing for project names
 */

import { useState, useEffect } from 'react';

export default function RenameModal({ project, onSave, onClose }) {
  const [name, setName] = useState(project.name);
  const [isVisible, setIsVisible] = useState(false);
  
  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setIsVisible(false);
      setTimeout(() => onSave(name.trim()), 300);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  // Add CSS animations if not already added
  if (typeof document !== 'undefined' && !document.head.querySelector('style[data-rename-modal]')) {
    const styleSheet = document.createElement('style');
    styleSheet.setAttribute('data-rename-modal', '');
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  return (
    <div onClick={handleBackdropClick} style={{...styles.backdrop,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{...styles.modal,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h3 style={styles.title}>Rename Project</h3>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            autoFocus
            maxLength={100}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#2c2e33';
              e.target.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              e.target.style.background = '#fafafa';
            }}
          />
          
          <div style={styles.buttons}>
            <button
              type="button"
              onClick={handleClose}
              style={styles.cancelButton}
              onMouseEnter={(e) => e.target.style.background = '#fafafa'}
              onMouseLeave={(e) => e.target.style.background = '#ffffff'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                ...styles.saveButton,
                opacity: !name.trim() ? 0.5 : 1,
                cursor: !name.trim() ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (name.trim()) e.target.style.background = '#1a1c1f';
              }}
              onMouseLeave={(e) => {
                if (name.trim()) e.target.style.background = '#2c2e33';
              }}
            >
              Save
            </button>
          </div>
        </form>
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
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10003
  },
  
  modal: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    fontFamily: "'Roboto Mono', monospace"
  },
  
  title: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c2e33',
    letterSpacing: '-0.02em'
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  input: {
    padding: '12px 14px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#fafafa'
  },
  
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  
  cancelButton: {
    background: '#ffffff',
    color: '#2c2e33',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  saveButton: {
    background: '#2c2e33',
    color: '#ffffff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

