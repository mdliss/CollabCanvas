import { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import { useTheme } from '../../contexts/ThemeContext';
import ConfirmationModal from './ConfirmationModal';

export default function HistoryTimeline({ isVisible = true }) {
  const { theme } = useTheme();
  const { getStackSizes, undoStackSize, redoStackSize, clear, getFullHistory, revertToPoint } = useUndo();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [history, setHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  useEffect(() => {
    // Get history from the context manager (canvas-specific)
    const interval = setInterval(() => {
      if (getFullHistory) {
        const fullHistory = getFullHistory();
        setHistory(fullHistory.slice(-1000)); // Keep up to 1000 operations
        
        if (fullHistory.length > 0) {
          console.log('🔵 [HISTORY] History updated:', fullHistory.length, 'items');
          console.log('🔵 [HISTORY] Sample item:', {
            description: fullHistory[fullHistory.length - 1]?.description,
            isLocal: fullHistory[fullHistory.length - 1]?.isLocal,
            status: fullHistory[fullHistory.length - 1]?.status,
            user: fullHistory[fullHistory.length - 1]?.user?.displayName
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [getFullHistory]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleHistoryItemClick = (item) => {
    console.log('🔵 [HISTORY CLICK] ━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [HISTORY CLICK] Item clicked:', item.description);
    console.log('🔵 [HISTORY CLICK] Item index:', item.index);
    console.log('🔵 [HISTORY CLICK] Is local:', item.isLocal);
    console.log('🔵 [HISTORY CLICK] Status:', item.status);
    console.log('🔵 [HISTORY CLICK] Is current:', item.isCurrent);
    console.log('🔵 [HISTORY CLICK] Is AI:', item.isAI);
    
    // Only allow clicking on local items (your own undo/redo stack)
    if (item.isLocal === false) {
      console.warn('🔵 [HISTORY CLICK] ❌ Cannot revert to non-local command from other users');
      return;
    }
    
    // Allow clicking on any local item to revert to that point in history
    if (item.status === 'done') {
      console.log('🔵 [HISTORY CLICK] ✅ Opening revert confirmation modal');
      // Clicking on item takes you to the state AFTER that action
      setSelectedHistoryIndex(item.index);
      setSelectedHistoryItem(item);
      setShowConfirmModal(true);
    } else if (item.status === 'undone') {
      console.log('🔵 [HISTORY CLICK] ✅ Opening redo confirmation modal');
      // Clicking on undone item redoes to that point
      setSelectedHistoryIndex(item.index);
      setSelectedHistoryItem(item);
      setShowConfirmModal(true);
    } else {
      console.warn('🔵 [HISTORY CLICK] ❌ Unknown status:', item.status);
    }
    console.log('🔵 [HISTORY CLICK] ━━━━━━━━━━━━━━━━━━━━━');
  };

  const handleConfirmRevert = async () => {
    if (selectedHistoryIndex !== null && revertToPoint) {
      try {
        console.log('🔵 [HISTORY REVERT] Starting revert to index:', selectedHistoryIndex, 'Description:', selectedHistoryItem?.description);
        await revertToPoint(selectedHistoryIndex);
        console.log('🔵 [HISTORY REVERT] ✅ Revert successful - history position updated');
        setShowConfirmModal(false);
        setSelectedHistoryIndex(null);
        setSelectedHistoryItem(null);
      } catch (error) {
        console.error('🔵 [HISTORY REVERT] ❌ Failed to revert to history point:', error);
      }
    }
  };

  const handleCancelRevert = () => {
    setShowConfirmModal(false);
    setSelectedHistoryIndex(null);
    setSelectedHistoryItem(null);
  };

  const handleClearHistory = (e) => {
    e.stopPropagation(); // Prevent triggering expand/collapse
    setShowClearConfirmModal(true);
  };

  const handleConfirmClear = () => {
    if (clear) {
      clear();
      setShowClearConfirmModal(false);
    }
  };

  const handleCancelClear = () => {
    setShowClearConfirmModal(false);
  };

  // Escape key handler to close timeline
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsClosing(true);
        setTimeout(() => {
          setIsExpanded(false);
          setIsClosing(false);
        }, 250);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  const styles = {
    container: {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      zIndex: 9999,
      fontFamily: "'Roboto Mono', monospace",
      transformOrigin: 'bottom left',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
    },
    collapsed: {
      width: isExpanded ? '320px' : '140px',
      background: theme.isDark ? 'rgba(26, 29, 36, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      boxShadow: `${theme.shadow.xl}, ${theme.shadow.md}`,
      border: `1px solid ${theme.border.normal}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      transformOrigin: 'bottom left',
      animation: isClosing 
        ? 'collapseToBottomLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
        : (isExpanded ? 'expandFromBottomLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none')
    },
    header: {
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      background: 'transparent',
      borderBottom: isExpanded ? `1px solid ${theme.border.normal}` : 'none'
    },
    title: {
      color: theme.text.primary,
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    count: {
      background: theme.isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)',
      color: theme.text.secondary,
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '600'
    },
    expandIcon: {
      fontSize: '12px',
      color: theme.text.tertiary,
      transition: 'transform 0.3s ease',
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
    },
    historyList: {
      maxHeight: '400px',
      overflowY: 'auto',
      padding: '8px'
    },
    historyItem: (index) => ({
      padding: '10px 12px',
      marginBottom: '4px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      background: theme.background.elevated,
      border: `1px solid ${theme.border.light}`,
      animation: `slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s backwards`,
      position: 'relative' // For AI icon positioning
    }),
    historyItemCurrent: {
      background: theme.gradient.hover,
      border: `2px solid ${theme.button.primary}`,
      fontWeight: '600',
      boxShadow: theme.shadow.md
    },
    bullet: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginRight: '8px',
      flexShrink: 0
    },
    bulletDone: {
      background: '#10b981'
    },
    bulletUndone: {
      background: '#9ca3af'
    },
    itemContent: {
      flex: 1,
      minWidth: 0
    },
    itemDescription: {
      fontSize: '12px',
      color: theme.text.primary,
      lineHeight: '1.4',
      wordBreak: 'break-word'
    },
    itemDescriptionUndone: {
      color: theme.text.tertiary,
      opacity: 0.5,
      textDecoration: 'line-through'
    },
    itemTime: {
      color: theme.text.tertiary,
      fontSize: '10px'
    },
    itemUser: {
      color: theme.text.secondary,
      fontSize: '10px',
      fontWeight: '500',
      marginTop: '2px'
    },
    empty: {
      padding: '24px 16px',
      textAlign: 'center',
      color: theme.text.tertiary,
      fontSize: '12px'
    },
    trashButton: {
      background: 'transparent',
      border: 'none',
      color: theme.text.tertiary,
      fontSize: '11px',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  const totalOperations = history.length;

  return (
    <>
      <style>{`
        @keyframes expandFromBottomLeft {
          from {
            transform: scale(0.85);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes collapseToBottomLeft {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.85);
            opacity: 0;
          }
        }
        
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={styles.container}>
      <div style={styles.collapsed}>
        {/* Header */}
        <div 
          style={styles.header}
          onClick={() => {
            if (isExpanded) {
              // Start closing animation
              setIsClosing(true);
              setTimeout(() => {
                setIsExpanded(false);
                setIsClosing(false);
              }, 250); // Match animation duration
            } else {
              setIsExpanded(true);
            }
          }}
        >
          <div style={styles.title}>
            <span>History</span>
            {totalOperations > 0 && (
              <span style={styles.count}>{totalOperations}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Delete button - only visible when expanded */}
            {isExpanded && totalOperations > 0 && (
              <button
                style={styles.trashButton}
                onClick={handleClearHistory}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = theme.button.danger || '#ef4444';
                  e.currentTarget.style.background = theme.isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = theme.text.tertiary;
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Clear history"
              >
                Delete
              </button>
            )}
            <span style={styles.expandIcon}>▼</span>
          </div>
        </div>

        {/* History List */}
        {isExpanded && (
          <div style={styles.historyList}>
            {history.length === 0 ? (
              <div style={styles.empty}>
                No history yet.<br />
                Create, move, or edit shapes to build history.
              </div>
            ) : (
              history.map((item, idx) => {
                const isCurrent = item.isCurrent;
                // Extract user name properly - item.user might be a string or object
                let userName = 'Unknown';
                if (item.user) {
                  if (typeof item.user === 'string') {
                    userName = item.user;
                  } else if (item.user.displayName) {
                    userName = item.user.displayName;
                  } else if (item.user.email) {
                    userName = item.user.email.split('@')[0];
                  }
                }

                // Check if this is an AI action
                const isAIAction = item.isAI || item.description?.startsWith('AI:');

                // Check if this is a local command (user's own) or shared (from others)
                const isLocal = item.isLocal !== false; // Default to true for backward compatibility
                const isClickable = isLocal && !isCurrent; // All local commands are clickable except current

                return (
                  <div
                    key={idx}
                    style={{
                      ...styles.historyItem(idx),
                      ...(isCurrent ? styles.historyItemCurrent : {}),
                      ...(isAIAction ? {
                        background: theme.background.elevated,
                        borderLeft: `3px solid ${theme.button.primary}`
                      } : {}),
                      ...(!isClickable ? {
                        opacity: 0.6,
                        cursor: 'default'
                      } : {
                        cursor: 'pointer'
                      })
                    }}
                    onClick={() => {
                      console.log('🔵 [HISTORY] Item onClick fired. Clickable:', isClickable, 'Description:', item.description);
                      if (isClickable) {
                        handleHistoryItemClick(item);
                      } else {
                        console.warn('🔵 [HISTORY] Item not clickable. isLocal:', item.isLocal, 'status:', item.status);
                      }
                    }}
                    onMouseOver={(e) => {
                      if (!isCurrent && isClickable) {
                        e.currentTarget.style.background = theme.isDark 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#f3f4f6';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isCurrent && isClickable) {
                        e.currentTarget.style.background = theme.background.elevated;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                    title={!isLocal 
                      ? 'Command from another user (view only)'
                      : (isCurrent
                          ? '📍 Current position in history'
                          : (isAIAction 
                            ? `AI-generated action - Click to ${item.status === 'undone' ? 'redo' : 'revert'}`
                            : `Click to ${item.status === 'undone' ? 'redo to this point' : 'revert to this point'}`))}
                  >
                    {/* AI indicator - removed emoji, using dark left border instead */}
                    
                    <div 
                      style={{
                        ...styles.bullet,
                        ...(item.status === 'done' ? styles.bulletDone : styles.bulletUndone)
                      }}
                    />
                    <div style={styles.itemContent}>
                      <div 
                        style={{
                          ...styles.itemDescription,
                          ...(item.status === 'undone' ? styles.itemDescriptionUndone : {})
                        }}
                      >
                        {isCurrent && <span style={{ marginRight: '6px', fontSize: '14px' }}>📍</span>}
                        {item.description}
                      </div>
                      <div style={styles.itemUser}>
                        {userName}
                      </div>
                      <div style={styles.itemTime}>
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Revert Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmRevert}
        onCancel={handleCancelRevert}
        title="Revert to History Point"
        message={`Are you sure you want to revert to: "${selectedHistoryItem?.description}"? This will undo all changes made after this point.`}
        confirmText="Revert"
        cancelText="Cancel"
      />

      {/* Clear History Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirmModal}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        title="Clear History"
        message="Are you sure you want to clear all history? This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
      />
    </div>
    </>
  );
}
