import { useState } from 'react';

/**
 * ShapeToolbar - Right-aligned vertical toolbar for shape creation and tools
 */
export default function ShapeToolbar({ onAddShape, onDuplicate, selectedCount }) {
  const [activeTool, setActiveTool] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);

  const tools = [
    { id: 'rectangle', label: 'Rectangle', icon: '▭', shortcut: 'R' },
    { id: 'circle', label: 'Circle', icon: '●', shortcut: 'C' },
    { id: 'line', label: 'Line', icon: '─', shortcut: 'L' },
    { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
    { id: 'diamond', label: 'Diamond', icon: '◆', shortcut: 'D' },
    { id: 'triangle', label: 'Triangle', icon: '▲', shortcut: 'Shift+T' },
    { id: 'star', label: 'Star', icon: '★', shortcut: 'S' },
    { id: 'duplicate', label: 'Duplicate', icon: '⧉', shortcut: 'Cmd+D', disabled: selectedCount === 0 }
  ];

  const handleToolClick = (tool) => {
    if (tool.id === 'duplicate') {
      onDuplicate();
    } else {
      setActiveTool(tool.id);
      onAddShape(tool.id);
      // Clear active state after a short delay
      setTimeout(() => setActiveTool(null), 200);
    }
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
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        const isHovered = hoveredTool === tool.id;
        const isDisabled = tool.disabled;

        return (
          <div key={tool.id} style={{ position: 'relative' }}>
            <button
              onClick={() => !isDisabled && handleToolClick(tool)}
              onMouseEnter={() => setHoveredTool(tool.id)}
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
              title={`${tool.label} (${tool.shortcut})`}
            >
              {tool.icon}
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
                {tool.label}
                <span style={{ 
                  marginLeft: '8px', 
                  opacity: 0.7,
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}>
                  {tool.shortcut}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

