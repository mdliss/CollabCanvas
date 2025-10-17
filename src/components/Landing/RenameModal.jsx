/**
 * Rename Project Modal - Inline editing for project names
 */

import { useState } from 'react';

export default function RenameModal({ project, onSave, onClose }) {
  const [name, setName] = useState(project.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div onClick={handleBackdropClick} style={styles.backdrop}>
      <div style={styles.modal}>
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
              onClick={onClose}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10003,
    backdropFilter: 'blur(4px)'
  },
  
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.06)'
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

