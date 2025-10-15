import { useState } from 'react';

/**
 * ShapeToolbar - Right-aligned vertical toolbar for shape creation and tools
 */
export default function ShapeToolbar({ 
  onAddShape, 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false 
}) {
  const [activeTool, setActiveTool] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);

  const tools = [
    { id: 'rectangle', label: 'Rectangle', icon: '▭', shortcut: 'R' },
    { id: 'circle', label: 'Circle', icon: '●', shortcut: 'C' },
    { id: 'line', label: 'Line', icon: '─', shortcut: 'L' },
    { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
    { id: 'triangle', label: 'Triangle', icon: '▲', shortcut: 'Shift+T' },
    { id: 'star', label: 'Star', icon: '★', shortcut: 'S' }
  ];

  const handleToolClick = (tool) => {
    setActiveTool(tool.id);
    onAddShape(tool.id);
    // Clear active state after a short delay
    setTimeout(() => setActiveTool(null), 200);
  };

  const renderButton = (config) => {
    const isActive = activeTool === config.id;
    const isHovered = hoveredTool === config.id;
    const isDisabled = config.disabled;

    return (
      <div key={config.id} style={{ position: 'relative' }}>
        <button
          onClick={() => !isDisabled && config.onClick ? config.onClick() : handleToolClick(config)}
          onMouseEnter={() => setHoveredTool(config.id)}
          onMouseLeave={() => setHoveredTool(null)}
          disabled={isDisabled}
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            border: 'none',
            borderRadius: '8px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            background: isActive 
              ? '#0066cc' 
              : isHovered && !isDisabled
              ? '#e6f2ff'
              : 'transparent',
            color: isActive 
              ? '#ffffff' 
              : isDisabled 
              ? '#cccccc'
              : '#333333',
            transition: 'all 0.15s ease',
            opacity: isDisabled ? 0.4 : 1,
            transform: isActive ? 'scale(0.95)' : 'scale(1)'
          }}
          title={`${config.label} (${config.shortcut})`}
        >
          {config.icon}
        </button>
        
        {/* Tooltip on hover */}
        {isHovered && !isDisabled && (
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 10000
            }}
          >
            {config.label}
            <span style={{ 
              marginLeft: '8px', 
              opacity: 0.7,
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>
              {config.shortcut}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 8px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Undo/Redo Buttons */}
      {renderButton({
        id: 'undo',
        label: 'Undo',
        icon: '◀',
        shortcut: 'Cmd+Z',
        onClick: onUndo,
        disabled: !canUndo
      })}
      
      {renderButton({
        id: 'redo',
        label: 'Redo',
        icon: '▶',
        shortcut: 'Cmd+Shift+Z',
        onClick: onRedo,
        disabled: !canRedo
      })}
      
      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'rgba(0, 0, 0, 0.1)',
        margin: '4px 0'
      }} />
      
      {/* Shape Tools */}
      {tools.map((tool) => renderButton(tool))}
    </div>
  );
}

