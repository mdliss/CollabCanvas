import { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import ConfirmationModal from './ConfirmationModal';

export default function HistoryTimeline() {
  const { getStackSizes, undoStackSize, redoStackSize } = useUndo();
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

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

  const styles = {
    container: {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    collapsed: {
      width: isExpanded ? '320px' : '140px',
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    },
    header: {
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      background: 'rgba(0, 0, 0, 0.2)',
      borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
    },
    title: {
      color: '#fff',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    count: {
      background: 'rgba(96, 165, 250, 0.2)',
      color: '#60a5fa',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '500'
    },
    expandIcon: {
      color: '#9ca3af',
      fontSize: '16px',
      transition: 'transform 0.3s ease',
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
    },
    historyList: {
      maxHeight: isExpanded ? '400px' : '0',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'max-height 0.3s ease'
    },
    historyItem: {
      padding: '10px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    },
    historyItemCurrent: {
      background: 'rgba(96, 165, 250, 0.15)',
      borderLeft: '3px solid #60a5fa'
    },
    bullet: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      flexShrink: 0
    },
    bulletDone: {
      background: '#60a5fa'
    },
    bulletUndone: {
      background: '#6b7280',
      opacity: 0.5
    },
    itemContent: {
      flex: 1,
      minWidth: 0
    },
    itemDescription: {
      color: '#fff',
      fontSize: '12px',
      marginBottom: '2px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    itemDescriptionUndone: {
      opacity: 0.5,
      textDecoration: 'line-through'
    },
    itemTime: {
      color: '#9ca3af',
      fontSize: '10px'
    },
    itemUser: {
      color: '#60a5fa',
      fontSize: '10px',
      fontWeight: '500',
      marginTop: '2px'
    },
    empty: {
      padding: '24px 16px',
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '12px'
    }
  };

  const totalOperations = history.length;

  return (
    <div style={styles.container}>
      <div style={styles.collapsed}>
        {/* Header */}
        <div 
          style={styles.header}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={styles.title}>
            <span>📜</span>
            <span>History</span>
            {totalOperations > 0 && (
              <span style={styles.count}>{totalOperations}</span>
            )}
          </div>
          <span style={styles.expandIcon}>▼</span>
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
              history.map((item) => {
                const userName = item.user?.displayName || 'Unknown';
                const isCurrent = item.isCurrent;
                
                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.historyItem,
                      ...(isCurrent ? styles.historyItemCurrent : {})
                    }}
                    onClick={() => handleHistoryItemClick(item)}
                    onMouseOver={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                    title={isCurrent ? 'Current state' : `Click to revert to this point`}
                  >
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmRevert}
        onCancel={handleCancelRevert}
        title="Revert to History Point"
        message={`Are you sure you want to revert to: "${selectedHistoryItem?.description}"? This will undo all changes made after this point.`}
        confirmText="Revert"
        cancelText="Cancel"
      />
    </div>
  );
}

