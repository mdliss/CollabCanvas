import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

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
  hasSelection = false,
  isLayersPanelVisible = false,
  isVisible = true
}) {
  const { theme } = useTheme();
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

    // Themed button styles
    const getButtonStyle = () => {
      if (isDisabled) {
        return {
          background: theme.gradient.button,
          color: theme.text.disabled,
          cursor: 'not-allowed',
          opacity: 0.6,
          boxShadow: theme.shadow.sm
        };
      }
      if (isActive) {
        return {
          background: theme.gradient.active,
          color: theme.text.primary,
          transform: 'scale(0.96)',
          boxShadow: theme.shadow.inset
        };
      }
      if (isHovered) {
        return {
          background: theme.gradient.hover,
          color: theme.text.primary,
          transform: 'translateY(-1px)',
          boxShadow: theme.shadow.lg
        };
      }
      // Default
      return {
        background: theme.gradient.button,
        color: theme.text.primary,
        boxShadow: theme.shadow.md
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
            border: `1px solid ${theme.border.normal}`,
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
        
        {/* Tooltip on hover - Positioned on RIGHT side of toolbar */}
        {isHovered && !isDisabled && (
          <div
            style={{
              position: 'absolute',
              left: '60px', // Changed from right to left - shows on right side
              top: '50%',
              transform: 'translateY(-50%)',
              background: theme.gradient.tooltip,
              color: theme.text.inverse,
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: theme.isDark ? '0 4px 12px rgba(0, 0, 0, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              border: theme.isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Smooth animation
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
        left: '16px', // Moved to left side of screen
        top: '50%',
        transform: isVisible ? 'translateY(-50%)' : 'translate(-20px, -50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        background: theme.isDark ? 'rgba(26, 29, 36, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        padding: '14px 10px',
        borderRadius: '16px',
        boxShadow: `${theme.shadow.xl}, ${theme.shadow.md}`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.border.normal}`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
        background: theme.isDark 
          ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
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
        background: theme.isDark 
          ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
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
        background: theme.isDark 
          ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
        margin: '4px 0'
      }} />
      
      {/* Shape Tools */}
      {tools.map((tool) => renderButton(tool))}
    </div>
  );
}
