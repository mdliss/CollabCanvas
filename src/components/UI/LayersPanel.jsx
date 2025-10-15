import { useState } from 'react';

export default function LayersPanel({ 
  shapes, 
  selectedIds,
  onSelect,
  onRename,
  onToggleVisibility,
  onToggleLock,
  onClose,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const filteredShapes = shapes.filter(shape => {
    const name = shape.name || shape.type;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort by z-index or creation time
  const sortedShapes = [...filteredShapes].sort((a, b) => {
    return (b.zIndex || 0) - (a.zIndex || 0) || b.createdAt - a.createdAt;
  });

  const handleStartRename = (shape) => {
    setEditingId(shape.id);
    setEditingName(shape.name || shape.type);
  };

  const handleSaveRename = async () => {
    if (editingId && editingName.trim()) {
      await onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const getShapeIcon = (type) => {
    const icons = {
      rectangle: '▭',
      circle: '○',
      line: '/',
      text: 'T',
      triangle: '△',
      star: '★',
      diamond: '◆'
    };
    return icons[type] || '?';
  };

  const getShapeColor = (type) => {
    const colors = {
      rectangle: '#3b82f6',
      circle: '#ef4444',
      line: '#8b5cf6',
      text: '#10b981',
      triangle: '#f59e0b',
      star: '#ec4899',
      diamond: '#06b6d4'
    };
    return colors[type] || '#6b7280';
  };

  const styles = {
    panel: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      backgroundColor: '#1f2937',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.3)',
      zIndex: 10000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      padding: '16px',
      borderBottom: '1px solid #374151',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      fontSize: '16px',
      fontWeight: '600'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      fontSize: '24px',
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s'
    },
    searchBox: {
      padding: '12px 16px',
      borderBottom: '1px solid #374151'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '13px',
      outline: 'none'
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px'
    },
    layerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      marginBottom: '4px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: '#374151'
    },
    layerItemSelected: {
      backgroundColor: '#3b82f6',
      boxShadow: '0 0 0 2px #60a5fa'
    },
    layerItemLocked: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    icon: {
      fontSize: '18px',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px'
    },
    name: {
      flex: 1,
      fontSize: '13px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    nameInput: {
      flex: 1,
      padding: '4px 8px',
      backgroundColor: '#1f2937',
      border: '1px solid #60a5fa',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '13px',
      outline: 'none'
    },
    iconButton: {
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      fontSize: '16px',
      cursor: 'pointer',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s'
    },
    iconButtonActive: {
      color: '#60a5fa'
    },
    footer: {
      padding: '12px 16px',
      borderTop: '1px solid #374151',
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>📋 Layers</div>
        <button 
          style={styles.closeButton}
          onClick={onClose}
          onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchBox}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search layers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Layers List */}
      <div style={styles.list}>
        {sortedShapes.length === 0 && (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center', 
            color: '#6b7280',
            fontSize: '13px'
          }}>
            {searchTerm ? 'No matching layers' : 'No layers yet'}
          </div>
        )}
        
        {sortedShapes.map(shape => {
          const isSelected = selectedIds.includes(shape.id);
          const isLocked = shape.isLocked && shape.lockedBy !== user?.uid;
          const isHidden = shape.hidden;
          
          return (
            <div
              key={shape.id}
              style={{
                ...styles.layerItem,
                ...(isSelected ? styles.layerItemSelected : {}),
                ...(isLocked ? styles.layerItemLocked : {})
              }}
              onClick={() => !isLocked && onSelect(shape.id)}
              onMouseOver={(e) => {
                if (!isSelected && !isLocked) {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
            >
              {/* Icon */}
              <div 
                style={{
                  ...styles.icon,
                  backgroundColor: getShapeColor(shape.type),
                  opacity: isHidden ? 0.3 : 1
                }}
              >
                {getShapeIcon(shape.type)}
              </div>

              {/* Name or Input */}
              {editingId === shape.id ? (
                <input
                  type="text"
                  style={styles.nameInput}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveRename();
                    } else if (e.key === 'Escape') {
                      handleCancelRename();
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div 
                  style={{
                    ...styles.name,
                    opacity: isHidden ? 0.5 : 1
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) {
                      handleStartRename(shape);
                    }
                  }}
                >
                  {shape.name || shape.type}
                </div>
              )}

              {/* Visibility Toggle */}
              <button
                style={{
                  ...styles.iconButton,
                  ...(isHidden ? {} : styles.iconButtonActive)
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(shape.id);
                }}
                title={isHidden ? 'Show' : 'Hide'}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {isHidden ? '👁️‍🗨️' : '👁️'}
              </button>

              {/* Lock Toggle */}
              <button
                style={{
                  ...styles.iconButton,
                  ...(shape.isLocked ? styles.iconButtonActive : {})
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked) {
                    onToggleLock(shape.id);
                  }
                }}
                title={shape.isLocked ? 'Unlock' : 'Lock'}
                disabled={isLocked}
                onMouseOver={(e) => !isLocked && (e.target.style.backgroundColor = '#4b5563')}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {shape.isLocked ? '🔒' : '🔓'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {sortedShapes.length} layer{sortedShapes.length !== 1 ? 's' : ''} total
      </div>
    </div>
  );
}

