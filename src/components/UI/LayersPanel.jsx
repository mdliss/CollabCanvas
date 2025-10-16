import { useState, useEffect, useRef } from 'react';

// Component to render shape preview
function ShapePreview({ shape }) {
  const size = 32;
  const padding = 4;
  
  // Get shape color - check for gradient or solid fill
  const hasGradient = shape.fillLinearGradientColorStops && shape.fillLinearGradientColorStops.length >= 4;
  const color = shape.fill || '#3b82f6';
  
  const renderShape = () => {
    switch (shape.type) {
      case 'circle':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {hasGradient && (
              <defs>
                <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={shape.fillLinearGradientColorStops[1]} />
                  <stop offset="100%" stopColor={shape.fillLinearGradientColorStops[3]} />
                </linearGradient>
              </defs>
            )}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size - padding * 2) / 2}
              fill={hasGradient ? `url(#grad-${shape.id})` : color}
              opacity={shape.opacity || 1}
            />
          </svg>
        );
      
      case 'rectangle':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {hasGradient && (
              <defs>
                <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={shape.fillLinearGradientColorStops[1]} />
                  <stop offset="100%" stopColor={shape.fillLinearGradientColorStops[3]} />
                </linearGradient>
              </defs>
            )}
            <rect
              x={padding}
              y={padding}
              width={size - padding * 2}
              height={size - padding * 2}
              fill={hasGradient ? `url(#grad-${shape.id})` : color}
              opacity={shape.opacity || 1}
              rx="2"
            />
          </svg>
        );
      
      case 'triangle':
        const points = `${size / 2},${padding} ${size - padding},${size - padding} ${padding},${size - padding}`;
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {hasGradient && (
              <defs>
                <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={shape.fillLinearGradientColorStops[1]} />
                  <stop offset="100%" stopColor={shape.fillLinearGradientColorStops[3]} />
                </linearGradient>
              </defs>
            )}
            <polygon
              points={points}
              fill={hasGradient ? `url(#grad-${shape.id})` : color}
              opacity={shape.opacity || 1}
            />
          </svg>
        );
      
      case 'star':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {hasGradient && (
              <defs>
                <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={shape.fillLinearGradientColorStops[1]} />
                  <stop offset="100%" stopColor={shape.fillLinearGradientColorStops[3]} />
                </linearGradient>
              </defs>
            )}
            <path
              d={`M${size/2},${padding} L${size*0.6},${size*0.4} L${size-padding},${size*0.4} L${size*0.65},${size*0.6} L${size*0.75},${size-padding} L${size/2},${size*0.7} L${size*0.25},${size-padding} L${size*0.35},${size*0.6} L${padding},${size*0.4} L${size*0.4},${size*0.4} Z`}
              fill={hasGradient ? `url(#grad-${shape.id})` : color}
              opacity={shape.opacity || 1}
            />
          </svg>
        );
      
      case 'diamond':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {hasGradient && (
              <defs>
                <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={shape.fillLinearGradientColorStops[1]} />
                  <stop offset="100%" stopColor={shape.fillLinearGradientColorStops[3]} />
                </linearGradient>
              </defs>
            )}
            <polygon
              points={`${size/2},${padding} ${size-padding},${size/2} ${size/2},${size-padding} ${padding},${size/2}`}
              fill={hasGradient ? `url(#grad-${shape.id})` : color}
              opacity={shape.opacity || 1}
            />
          </svg>
        );
      
      case 'line':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <line
              x1={padding}
              y1={size - padding}
              x2={size - padding}
              y2={padding}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              opacity={shape.opacity || 1}
            />
          </svg>
        );
      
      case 'text':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <text
              x={size / 2}
              y={size / 2 + 4}
              fontSize="16"
              fontWeight={shape.fontWeight || 'normal'}
              fontStyle={shape.fontStyle || 'normal'}
              fill={color}
              textAnchor="middle"
              opacity={shape.opacity || 1}
            >
              T
            </text>
          </svg>
        );
      
      default:
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect
              x={padding}
              y={padding}
              width={size - padding * 2}
              height={size - padding * 2}
              fill={color}
              opacity={shape.opacity || 1}
              rx="2"
            />
          </svg>
        );
    }
  };
  
  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      {renderShape()}
    </div>
  );
}

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

  const styles = {
    panel: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '340px',
      height: '100vh',
      backgroundColor: '#ffffff',
      color: '#1f2937',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12), -2px 0 8px rgba(0, 0, 0, 0.08)',
      zIndex: 10000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)'
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      fontSize: '28px',
      cursor: 'pointer',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'all 0.2s',
      lineHeight: '1'
    },
    searchBox: {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    searchInput: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: '#ffffff',
      border: '1.5px solid #d1d5db',
      borderRadius: '8px',
      color: '#111827',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s'
    },
    batchControls: {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#ffffff'
    },
    selectAllRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#4f46e5'
    },
    selectAllLabel: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '500'
    },
    batchButtonsRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    batchButton: {
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: '#ffffff',
      backgroundColor: '#4f46e5',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px'
    },
    batchButtonDisabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
      boxShadow: 'none'
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 16px',
      backgroundColor: '#fafafa'
    },
    layerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 14px',
      marginBottom: '6px',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      backgroundColor: '#ffffff',
      border: '1.5px solid transparent',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
    },
    layerItemSelected: {
      backgroundColor: '#eef2ff',
      border: '1.5px solid #818cf8',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
    },
    layerItemChecked: {
      backgroundColor: '#ddd6fe',
      border: '1.5px solid #a78bfa'
    },
    name: {
      flex: 1,
      fontSize: '14px',
      fontWeight: '500',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: '#374151'
    },
    nameInput: {
      flex: 1,
      padding: '6px 10px',
      backgroundColor: '#ffffff',
      border: '2px solid #4f46e5',
      borderRadius: '6px',
      color: '#111827',
      fontSize: '14px',
      outline: 'none',
      fontWeight: '500'
    },
    zIndexBadge: {
      fontSize: '11px',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      padding: '4px 8px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontWeight: '600'
    },
    footer: {
      padding: '16px 20px',
      borderTop: '1px solid #e5e7eb',
      fontSize: '13px',
      color: '#6b7280',
      textAlign: 'center',
      backgroundColor: '#f9fafb',
      fontWeight: '500'
    }
  };

  const hasChecked = checkedIds.length > 0;

  return (
    <div style={styles.panel} ref={panelRef}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Layers
        </div>
        <button 
          style={styles.closeButton}
          onClick={onClose}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
            e.target.style.color = '#111827';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#6b7280';
          }}
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
          onFocus={(e) => {
            e.target.style.borderColor = '#4f46e5';
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
          }}
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
          <span style={styles.selectAllLabel}>
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
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#4338ca')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#4f46e5')}
          >
            <span>⇈</span> To Front
          </button>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onBringForward)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#4338ca')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#4f46e5')}
          >
            <span>⇑</span> Forward
          </button>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onSendBackward)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#4338ca')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#4f46e5')}
          >
            <span>⇓</span> Backward
          </button>
          <button
            style={{
              ...styles.batchButton,
              ...(hasChecked ? {} : styles.batchButtonDisabled)
            }}
            onClick={() => hasChecked && handleBatchOperation(onSendToBack)}
            disabled={!hasChecked}
            onMouseOver={(e) => hasChecked && (e.target.style.backgroundColor = '#4338ca')}
            onMouseOut={(e) => hasChecked && (e.target.style.backgroundColor = '#4f46e5')}
          >
            <span>⇊</span> To Back
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div style={styles.list}>
        {sortedShapes.length === 0 && (
          <div style={{ 
            padding: '48px 24px', 
            textAlign: 'center', 
            color: '#9ca3af',
            fontSize: '14px'
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
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected && !isChecked) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = 'transparent';
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

              {/* Shape Preview */}
              <ShapePreview shape={shape} />

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
        {sortedShapes.length} layer{sortedShapes.length !== 1 ? 's' : ''}
        {checkedIds.length > 0 && ` · ${checkedIds.length} checked`}
      </div>
    </div>
  );
}
