import { COLOR_PALETTE } from './constants';

/**
 * ColorPalette - Bottom-center color picker for selected shapes
 * Displays 20 color swatches, applies color to all selected shapes
 */
export default function ColorPalette({ onColorSelect, selectedCount }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9998,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderBottom: 'none',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      {/* Selected count label */}
      <span
        style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#666',
          marginRight: '4px',
          whiteSpace: 'nowrap'
        }}
      >
        {selectedCount} selected
      </span>

      {/* Color swatches */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }}
      >
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: color,
              border: '2px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              padding: '0',
              outline: 'none'
            }}
            title={color}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

