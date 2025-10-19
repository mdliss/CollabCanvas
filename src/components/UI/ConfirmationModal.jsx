import { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  const { theme } = useTheme();
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
      backgroundColor: theme.backdrop,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease'
    },
    modal: {
      backgroundColor: theme.background.card,
      borderRadius: '12px',
      padding: '28px 32px',
      maxWidth: '420px',
      width: '90%',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: '12px',
      textAlign: 'center'
    },
    message: {
      fontSize: '14px',
      color: theme.text.secondary,
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
      boxShadow: theme.shadow.sm
    },
    confirmButton: {
      backgroundColor: theme.button.primary,
      color: theme.text.inverse
    },
    cancelButton: {
      backgroundColor: theme.background.elevated,
      color: theme.text.primary,
      border: `1px solid ${theme.border.medium}`
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
              e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255, 255, 255, 0.12)' : '#f3f4f6';
              e.currentTarget.style.boxShadow = theme.shadow.md;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = theme.background.elevated;
              e.currentTarget.style.boxShadow = theme.shadow.sm;
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
              e.currentTarget.style.backgroundColor = theme.button.primaryHover;
              e.currentTarget.style.boxShadow = theme.shadow.md;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = theme.button.primary;
              e.currentTarget.style.boxShadow = theme.shadow.sm;
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

