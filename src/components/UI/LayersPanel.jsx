import { useState, useEffect, useRef } from 'react';

export default function LayersPanel({ 
  shapes, 
  selectedIds,
  onSelect,
  onRename,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onClose,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [checkedIds, setCheckedIds] = useState([]);
  const panelRef = useRef(null);

  const filteredShapes = shapes.filter(shape => {
    const name = shape.name || shape.type;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort by z-index descending (top to bottom in visual stacking order)
  const sortedShapes = [...filteredShapes].sort((a, b) => {
    return (b.zIndex || 0) - (a.zIndex || 0);
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

  const handleCheckboxChange = (shapeId, isChecked) => {
    if (isChecked) {
      setCheckedIds(prev => [...prev, shapeId]);
    } else {
      setCheckedIds(prev => prev.filter(id => id !== shapeId));
    }
  };

  const handleSelectAll = () => {
    if (checkedIds.length === sortedShapes.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(sortedShapes.map(s => s.id));
    }
  };

  const handleBatchOperation = async (operation) => {
    if (checkedIds.length === 0) return;
    
    for (const id of checkedIds) {
      await operation(id);
    }
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
    batchControls: {
      padding: '12px 16px',
      borderBottom: '1px solid #374151',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    selectAllRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#60a5fa'
    },
    batchButtonsRow: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    },
    batchButton: {
      flex: 1,
      minWidth: '70px',
      padding: '6px 10px',
      fontSize: '11px',
      fontWeight: '500',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: '#fff',
      backgroundColor: '#3b82f6',
      opacity: 1
    },
    batchButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
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
    layerItemChecked: {
      backgroundColor: '#1e40af'
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
    zIndexBadge: {
      fontSize: '10px',
      color: '#9ca3af',
      backgroundColor: '#4b5563',
      padding: '2px 6px',
      borderRadius: '4px',
      fontFamily: 'monospace'
    },
    footer: {
      padding: '12px 16px',
      borderTop: '1px solid #374151',
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center'
    }
  };

  const hasChecked = checkedIds.length > 0;

  return (
    <div style={styles.panel} ref={panelRef}>
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

      {/* Batch Controls */}
      <div style={styles.batchControls}>
        <div style={styles.selectAllRow}>
          <input
            type="checkbox"
            style={styles.checkbox}
            checked={checkedIds.length === sortedShapes.length && sortedShapes.length > 0}
            onChange={handleSelectAll}
          />
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {checkedIds.length > 0 ? `${checkedIds.length} selected` : 'Select All'}
          </span>
        </div>

        <div style={styles.batchButtonsRow}>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onBringToFront)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#3b82f6')}
          >
            ↑ To Front
          </button>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onBringForward)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#3b82f6')}
          >
            ↑ Forward
          </button>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onSendBackward)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#3b82f6')}
          >
            ↓ Backward
          </button>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onSendToBack)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#3b82f6')}
          >
            ↓ To Back
          </button>
        </div>
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
          const isChecked = checkedIds.includes(shape.id);
          
          return (
            <div
              key={shape.id}
              style={{
                ...styles.layerItem,
                ...(isSelected ? styles.layerItemSelected : {}),
                ...(isChecked && !isSelected ? styles.layerItemChecked : {})
              }}
              onClick={() => onSelect(shape.id)}
              onMouseOver={(e) => {
                if (!isSelected && !isChecked) {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected && !isChecked) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange(shape.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Icon */}
              <div 
                style={{
                  ...styles.icon,
                  backgroundColor: getShapeColor(shape.type)
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
                  style={styles.name}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(shape);
                  }}
                >
                  {shape.name || shape.type}
                </div>
              )}

              {/* Z-Index Badge */}
              <div style={styles.zIndexBadge}>
                z:{shape.zIndex || 0}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {sortedShapes.length} layer{sortedShapes.length !== 1 ? 's' : ''} total
        {checkedIds.length > 0 && ` • ${checkedIds.length} checked`}
      </div>
    </div>
  );
}
