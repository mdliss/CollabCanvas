import { useEffect, useState } from 'react';

/**
 * ContextMenu - Right-click context menu for shapes
 */
export default function ContextMenu({ 
  x, 
  y, 
  onClose, 
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onLock,
  onDelete,
  isLocked = false,
  hasSelection = false,
  hasCopiedShapes = false
}) {
  const [isClosing, setIsClosing] = useState(false);
  
  const handleClose = () => {
    if (isClosing) return; // Prevent multiple calls
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 220); // Slightly longer than animation duration to ensure it completes
  };
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking on the menu itself
      if (e.target.closest('[data-context-menu]')) {
        return;
      }
      
      handleClose();
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Add listeners after a delay to prevent immediate closing from right-click release
    const timeoutId = setTimeout(() => {
      // Listen to click (fires on mouseup) for consistent timing
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isClosing]);

  const handleAction = (action) => {
    if (isClosing) return; // Prevent multiple calls
    setIsClosing(true);
    // Wait for animation to complete before executing action
    setTimeout(() => {
      action();
      onClose();
    }, 220); // Slightly longer than animation duration to ensure it completes
  };

  const menuItems = [
    { 
      label: 'Cut', 
      shortcut: '⌘X', 
      action: onCut, 
      disabled: !hasSelection,
      divider: false 
    },
    { 
      label: 'Copy', 
      shortcut: '⌘C', 
      action: onCopy, 
      disabled: !hasSelection,
      divider: false 
    },
    { 
      label: 'Paste', 
      shortcut: '⌘V', 
      action: onPaste, 
      disabled: !hasCopiedShapes,
      divider: false 
    },
    { 
      label: 'Duplicate', 
      shortcut: '⌘D', 
      action: onDuplicate, 
      disabled: !hasSelection,
      divider: true 
    },
    { 
      label: 'Bring to Front', 
      shortcut: 'Shift+}', 
      action: onBringToFront, 
      disabled: !hasSelection,
      divider: false 
    },
    { 
      label: 'Bring Forward', 
      shortcut: ']', 
      action: onBringForward, 
      disabled: !hasSelection,
      divider: false 
    },
    { 
      label: 'Send Backward', 
      shortcut: '[', 
      action: onSendBackward, 
      disabled: !hasSelection,
      divider: false 
    },
    { 
      label: 'Send to Back', 
      shortcut: 'Shift+{', 
      action: onSendToBack, 
      disabled: !hasSelection,
      divider: true 
    },
    { 
      label: isLocked ? 'Unlock' : 'Lock', 
      shortcut: '', 
      action: onLock, 
      disabled: !hasSelection,
      divider: false 
    },
    { 
      label: 'Delete', 
      shortcut: '⌫', 
      action: onDelete, 
      disabled: !hasSelection,
      divider: false,
      destructive: true 
    },
  ];

  const styles = {
    menu: {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(12px)',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      padding: '6px',
      minWidth: '220px',
      zIndex: 100000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      animation: isClosing 
        ? 'contextMenuFadeOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' 
        : 'contextMenuFadeIn 0.2s cubic-bezier(0, 0, 0.2, 1)',
      userSelect: 'none',
      willChange: 'opacity, transform'
    },
    item: (disabled, destructive) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.1s ease',
      color: destructive ? '#dc2626' : (disabled ? '#9ca3af' : '#374151'),
      opacity: disabled ? 0.5 : 1,
      background: 'transparent'
    }),
    shortcut: {
      fontSize: '12px',
      color: '#9ca3af',
      marginLeft: '24px',
      fontFamily: 'monospace'
    },
    divider: {
      height: '1px',
      background: 'rgba(0, 0, 0, 0.08)',
      margin: '6px 8px'
    }
  };

  return (
    <>
      <style>{`
        @keyframes contextMenuFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes contextMenuFadeOut {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.92) translateY(-8px);
          }
        }
      `}</style>
      <div 
        style={styles.menu}
        data-context-menu="true"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => (
          <div key={index}>
            <div
              style={styles.item(item.disabled, item.destructive)}
              onClick={() => !item.disabled && handleAction(item.action)}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = item.destructive ? '#fef2f2' : '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span style={styles.shortcut}>{item.shortcut}</span>}
            </div>
            {item.divider && <div style={styles.divider} />}
          </div>
        ))}
      </div>
    </>
  );
}

