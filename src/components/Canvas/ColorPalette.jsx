import { useState } from 'react';
import { COLOR_PALETTE } from './constants';
import { useColorHistory } from '../../hooks/useColorHistory';
import ColorPicker from '../UI/ColorPicker';
import GradientPicker from '../UI/GradientPicker';

/**
 * ColorPalette - Enhanced bottom-center color picker for selected shapes
 * Features:
 * - 20 preset colors with Shift+Scroll navigation
 * - Color history (last 12 colors used)
 * - Custom color picker button (full spectrum + opacity)
 * - Gradient picker button
 */
export default function ColorPalette({ onColorSelect, onGradientSelect, selectedCount }) {
  const [scrollIndex, setScrollIndex] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const { history, addColor } = useColorHistory();
  
  const VISIBLE_COLORS = 10; // Show 10 colors at a time
  const visibleColors = COLOR_PALETTE.slice(scrollIndex, scrollIndex + VISIBLE_COLORS);
  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex < COLOR_PALETTE.length - VISIBLE_COLORS;

  // Handle Shift+Scroll for palette navigation
  const handleWheel = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // Determine direction: deltaY > 0 = scroll down = move RIGHT (show next colors)
      //                      deltaY < 0 = scroll up = move LEFT (show previous colors)
      const direction = e.deltaY > 0 ? 1 : -1;
      const maxScroll = Math.max(0, COLOR_PALETTE.length - VISIBLE_COLORS);
      
      setScrollIndex(prev => {
        const next = prev + direction;
        const clamped = Math.max(0, Math.min(next, maxScroll));
        console.log('[ColorPalette] Shift+Scroll:', {
          deltaY: e.deltaY,
          direction,
          prev,
          next,
          clamped,
          maxScroll,
          totalColors: COLOR_PALETTE.length,
          visibleColors: VISIBLE_COLORS
        });
        return clamped;
      });
    }
  };

  // Handle color selection (add to history)
  const handleColorClick = (color, opacity = 100) => {
    addColor(color);
    onColorSelect(color, opacity);
  };

  // Handle custom color picker
  const handleCustomColor = (color, opacity) => {
    addColor(color);
    onColorSelect(color, opacity);
    setShowColorPicker(false);
  };

  // Handle gradient picker
  const handleGradient = (gradient) => {
    if (onGradientSelect) {
      onGradientSelect(gradient);
    }
    setShowGradientPicker(false);
  };

  return (
    <>
      <div
        onWheel={handleWheel}
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
          animation: 'fadeIn 0.2s ease-in-out',
          maxWidth: '90vw'
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

        {/* Color History */}
        {history.length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                gap: '3px',
                alignItems: 'center',
                paddingRight: '8px',
                borderRight: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              {history.slice(0, 4).map((color, idx) => (
                <button
                  key={`${color}-${idx}`}
                  onClick={() => handleColorClick(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: color,
                    border: '2px solid rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    padding: '0',
                    outline: 'none'
                  }}
                  title={`Recent: ${color}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Scroll indicator (left) */}
        {canScrollLeft && (
          <div
            style={{
              fontSize: '10px',
              opacity: 0.5,
              cursor: 'pointer'
            }}
            onClick={() => setScrollIndex(Math.max(0, scrollIndex - 1))}
          >
            ◀
          </div>
        )}

        {/* Color swatches (scrollable) */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}
        >
          {visibleColors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
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

        {/* Scroll indicator (right) */}
        {canScrollRight && (
          <div
            style={{
              fontSize: '10px',
              opacity: 0.5,
              cursor: 'pointer'
            }}
            onClick={() => setScrollIndex(Math.min(COLOR_PALETTE.length - VISIBLE_COLORS, scrollIndex + 1))}
          >
            ▶
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }}
        />

        {/* Gradient Button */}
        <button
          onClick={() => setShowGradientPicker(true)}
          style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
            border: '2px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            padding: '0',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}
          title="Gradient"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
          }}
        >
          🌈
        </button>

        {/* Custom Color Button */}
        <button
          onClick={() => setShowColorPicker(true)}
          style={{
            width: '40px',
            height: '40px',
            background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
            border: '2px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            padding: '0',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            position: 'relative'
          }}
          title="Custom Color"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
          }}
        >
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            +
          </span>
        </button>

        {/* Shift+Scroll hint */}
        {(canScrollLeft || canScrollRight) && (
          <div
            style={{
              fontSize: '10px',
              opacity: 0.4,
              whiteSpace: 'nowrap',
              marginLeft: '4px'
            }}
          >
            Shift+Scroll
          </div>
        )}

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

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          initialColor="#FF6B6B"
          initialOpacity={100}
          onColorChange={handleCustomColor}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {/* Gradient Picker Modal */}
      {showGradientPicker && (
        <GradientPicker
          onApply={handleGradient}
          onClose={() => setShowGradientPicker(false)}
        />
      )}
    </>
  );
}

