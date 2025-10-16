import { useEffect } from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease'
    },
    modal: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '28px 32px',
      maxWidth: '420px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e5e7eb',
      animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '12px',
      textAlign: 'center'
    },
    message: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px',
      textAlign: 'center',
      lineHeight: '1.6'
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center'
    },
    button: {
      padding: '11px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      minWidth: '130px',
      justifyContent: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    confirmButton: {
      backgroundColor: '#10b981',
      color: '#ffffff'
    },
    cancelButton: {
      backgroundColor: '#ef4444',
      color: '#ffffff'
    },
    icon: {
      fontSize: '16px',
      lineHeight: 1
    }
  };

  // Add CSS animations
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  if (!document.head.querySelector('style[data-confirmation-modal]')) {
    styleSheet.setAttribute('data-confirmation-modal', '');
    document.head.appendChild(styleSheet);
  }

  return (
    <div 
      style={styles.overlay}
      onClick={(e) => {
        // Close if clicking outside the modal
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>{title}</div>
        <div style={styles.message}>{message}</div>
        <div style={styles.buttonContainer}>
          <button
            style={{
              ...styles.button,
              ...styles.cancelButton
            }}
            onClick={onCancel}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            <span style={styles.icon}>✕</span>
            {cancelText}
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.confirmButton
            }}
            onClick={onConfirm}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            <span style={styles.icon}>✓</span>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

