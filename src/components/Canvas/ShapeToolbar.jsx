import { useState } from 'react';

/**
 * ShapeToolbar - Right-aligned vertical toolbar for shape creation and tools
 */
export default function ShapeToolbar({ 
  onAddShape, 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onDuplicate,
  hasSelection = false
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

    // Neutral color scheme - softer, more professional
    const getButtonStyle = () => {
      if (isDisabled) {
        // Disabled: white/light gray (not dark gray)
        return {
          background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          color: '#d1d5db',
          cursor: 'not-allowed',
          opacity: 0.6,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        };
      }
      if (isActive) {
        // Active: subtle gray
        return {
          background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
          color: '#111827',
          transform: 'scale(0.96)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1) inset'
        };
      }
      if (isHovered) {
        // Hover: very subtle gray
        return {
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          color: '#111827',
          transform: 'translateY(-1px)',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)'
        };
      }
      // Default: clean white
      return {
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        color: '#374151',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
      };
    };

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
            fontSize: config.fontSize || '20px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '10px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: '600',
            ...getButtonStyle()
          }}
          title={`${config.label}${config.shortcut ? ` (${config.shortcut})` : ''}`}
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
              background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ marginBottom: '2px' }}>{config.label}</div>
            {config.shortcut && (
              <div style={{ 
                fontSize: '11px',
                opacity: 0.7,
                fontFamily: 'monospace',
                fontWeight: '400'
              }}>
                {config.shortcut}
              </div>
            )}
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
        gap: '10px',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.98)',
        padding: '14px 10px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Undo/Redo Buttons */}
      {renderButton({
        id: 'undo',
        label: 'Undo',
        icon: '↶',
        fontSize: '24px',
        shortcut: 'Cmd+Z',
        onClick: onUndo,
        disabled: !canUndo
      })}
      
      {renderButton({
        id: 'redo',
        label: 'Redo',
        icon: '↷',
        fontSize: '24px',
        shortcut: 'Cmd+Shift+Z',
        onClick: onRedo,
        disabled: !canRedo
      })}
      
      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
        margin: '4px 0'
      }} />
      
      {/* Duplicate Button */}
      {renderButton({
        id: 'duplicate',
        label: 'Duplicate',
        icon: '⎘',
        fontSize: '22px',
        shortcut: 'Selection',
        onClick: onDuplicate,
        disabled: !hasSelection
      })}
      
      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
        margin: '4px 0'
      }} />
      
      {/* Z-Index Controls */}
      {renderButton({
        id: 'bringToFront',
        label: 'To Front',
        icon: '⇈',
        fontSize: '22px',
        shortcut: 'Selection',
        onClick: onBringToFront,
        disabled: !hasSelection
      })}
      
      {renderButton({
        id: 'bringForward',
        label: 'Forward',
        icon: '⇑',
        fontSize: '22px',
        shortcut: ']',
        onClick: onBringForward,
        disabled: !hasSelection
      })}
      
      {renderButton({
        id: 'sendBackward',
        label: 'Backward',
        icon: '⇓',
        fontSize: '22px',
        shortcut: '[',
        onClick: onSendBackward,
        disabled: !hasSelection
      })}
      
      {renderButton({
        id: 'sendToBack',
        label: 'To Back',
        icon: '⇊',
        fontSize: '22px',
        shortcut: 'Selection',
        onClick: onSendToBack,
        disabled: !hasSelection
      })}
      
      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
        margin: '4px 0'
      }} />
      
      {/* Shape Tools */}
      {tools.map((tool) => renderButton(tool))}
    </div>
  );
}
