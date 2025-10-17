import { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import ConfirmationModal from './ConfirmationModal';

export default function HistoryTimeline() {
  const { getStackSizes, undoStackSize, redoStackSize, clear } = useUndo();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [history, setHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  useEffect(() => {
    // Listen for changes to the undo manager
    const interval = setInterval(() => {
      if (window.undoManager) {
        // Use the new getFullHistory method
        const fullHistory = window.undoManager.getFullHistory();
        setHistory(fullHistory.slice(-1000)); // Keep up to 1000 operations
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

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
    if (item.status === 'done' && !item.isCurrent) {
      setSelectedHistoryIndex(item.index);
      setSelectedHistoryItem(item);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmRevert = async () => {
    if (selectedHistoryIndex !== null && window.undoManager) {
      try {
        await window.undoManager.revertToPoint(selectedHistoryIndex);
        setShowConfirmModal(false);
        setSelectedHistoryIndex(null);
        setSelectedHistoryItem(null);
      } catch (error) {
        console.error('Failed to revert to history point:', error);
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
      transformOrigin: 'bottom left'
    },
    collapsed: {
      width: isExpanded ? '320px' : '140px',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
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
      borderBottom: isExpanded ? '1px solid rgba(0, 0, 0, 0.06)' : 'none'
    },
    title: {
      color: '#374151',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    count: {
      background: 'rgba(107, 114, 128, 0.1)',
      color: '#6b7280',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '600'
    },
    expandIcon: {
      fontSize: '12px',
      color: '#9ca3af',
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
      background: '#f9fafb',
      border: '1px solid rgba(0, 0, 0, 0.04)',
      animation: `slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s backwards`,
      position: 'relative' // For AI icon positioning
    }),
    historyItemCurrent: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      fontWeight: '600'
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
      color: '#374151',
      lineHeight: '1.4',
      wordBreak: 'break-word'
    },
    itemDescriptionUndone: {
      color: '#9ca3af',
      opacity: 0.5,
      textDecoration: 'line-through'
    },
    itemTime: {
      color: '#9ca3af',
      fontSize: '10px'
    },
    itemUser: {
      color: '#6b7280',
      fontSize: '10px',
      fontWeight: '500',
      marginTop: '2px'
    },
    empty: {
      padding: '24px 16px',
      textAlign: 'center',
      color: '#9ca3af',
      fontSize: '12px'
    },
    trashButton: {
      background: 'transparent',
      border: 'none',
      color: '#9ca3af',
      fontSize: '16px',
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
            <span>📜</span>
            <span>History</span>
            {totalOperations > 0 && (
              <span style={styles.count}>{totalOperations}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Garbage can - only visible when expanded */}
            {isExpanded && totalOperations > 0 && (
              <button
                style={styles.trashButton}
                onClick={handleClearHistory}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Clear history"
              >
                🗑️
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

                return (
                  <div
                    key={idx}
                    style={{
                      ...styles.historyItem(idx),
                      ...(isCurrent ? styles.historyItemCurrent : {}),
                      ...(isAIAction ? {
                        background: '#fafafa',
                        borderLeft: '3px solid #2c2e33'
                      } : {})
                    }}
                    onClick={() => handleHistoryItemClick(item)}
                    onMouseOver={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = isAIAction 
                          ? '#f3f4f6'
                          : '#f3f4f6';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = isAIAction
                          ? '#fafafa'
                          : '#f9fafb';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                    title={isAIAction 
                      ? 'AI-generated action'
                      : (isCurrent ? 'Current state' : `Click to revert to this point`)}
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
