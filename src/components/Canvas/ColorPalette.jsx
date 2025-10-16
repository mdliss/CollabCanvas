import { useState, useEffect, useRef } from 'react';
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
  const [isHistoryHovered, setIsHistoryHovered] = useState(false);
  const { history, addColor, addGradient, clearHistory } = useColorHistory();
  const paletteRef = useRef(null);
  
  const VISIBLE_COLORS = 10; // Show 10 colors at a time
  const visibleColors = COLOR_PALETTE.slice(scrollIndex, scrollIndex + VISIBLE_COLORS);
  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex < COLOR_PALETTE.length - VISIBLE_COLORS;

  // Native wheel event listener for scrolling through colors
  // No Shift needed - just hover over the palette area and scroll!
  useEffect(() => {
    const paletteEl = paletteRef.current;
    if (!paletteEl) return;

    const handleWheel = (e) => {
      // Prevent default to avoid page scroll
      e.preventDefault();
      e.stopPropagation();
      
      const maxScroll = Math.max(0, COLOR_PALETTE.length - VISIBLE_COLORS);
      
      // Use deltaX for horizontal scroll OR deltaY for vertical scroll
      // This makes it work with trackpads (horizontal swipe) and mice (wheel)
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      
      // Filter out tiny values (noise)
      if (Math.abs(delta) < 3) {
        return;
      }
      
      // Normalize scroll direction: positive = scroll right (next), negative = scroll left (prev)
      const scrollAmount = delta > 0 ? 1 : -1;
      
      setScrollIndex(prev => {
        const next = prev + scrollAmount;
        const clamped = Math.max(0, Math.min(next, maxScroll));
        
        if (clamped !== prev) {
          console.log('[ColorPalette] Scroll:', {
            delta,
            scrollAmount,
            direction: scrollAmount > 0 ? 'RIGHT (next)' : 'LEFT (prev)',
            showing: `colors ${clamped}-${clamped + VISIBLE_COLORS - 1} of ${COLOR_PALETTE.length}`
          });
        }
        
        return clamped;
      });
    };

    // { passive: false } allows preventDefault()
    paletteEl.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      paletteEl.removeEventListener('wheel', handleWheel);
    };
  }, []); // Empty deps - only set up once
  
  // Scroll left/right with arrow buttons
  const scrollLeft = () => {
    setScrollIndex(prev => Math.max(0, prev - 1));
  };
  
  const scrollRight = () => {
    const maxScroll = Math.max(0, COLOR_PALETTE.length - VISIBLE_COLORS);
    setScrollIndex(prev => Math.min(maxScroll, prev + 1));
  };

  // Handle color selection (add to history with opacity)
  const handleColorClick = (color, opacity = 100) => {
    addColor(color, opacity / 100); // Store as 0-1 range
    onColorSelect(color, opacity);
  };

  // Handle custom color picker
  const handleCustomColor = (color, opacity) => {
    addColor(color, opacity / 100); // Store as 0-1 range
    onColorSelect(color, opacity);
    setShowColorPicker(false);
  };

  // Handle gradient picker
  const handleGradient = (gradient) => {
    addGradient(gradient); // Add gradient to history
    if (onGradientSelect) {
      onGradientSelect(gradient);
    }
    setShowGradientPicker(false);
  };

  // Handle clicking on history item (reapply color or gradient)
  const handleHistoryClick = (historyItem) => {
    if (historyItem.type === 'solid') {
      // Reapply solid color with opacity
      onColorSelect(historyItem.color, historyItem.opacity * 100);
    } else if (historyItem.type === 'gradient') {
      // Reapply gradient
      if (onGradientSelect) {
        onGradientSelect(historyItem.gradient);
      }
    }
  };

  return (
    <>
      <div
        ref={paletteRef}
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

        {/* Color History - Shows last 4 colors/gradients with opacity */}
        {history.length > 0 && (
          <>
            <div
              onMouseEnter={() => setIsHistoryHovered(true)}
              onMouseLeave={() => setIsHistoryHovered(false)}
              style={{
                display: 'flex',
                gap: '3px',
                alignItems: 'center',
                paddingRight: '8px',
                borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                position: 'relative'
              }}
            >
              {history.slice(0, 4).map((item, idx) => {
                // Generate unique key based on item type
                const itemKey = item.type === 'solid' 
                  ? `solid-${item.color}-${item.opacity}-${idx}`
                  : `gradient-${item.gradient.color1}-${item.gradient.color2}-${idx}`;
                
                // Determine display style based on type
                let backgroundStyle = {};
                let title = '';
                
                if (item.type === 'solid') {
                  // Solid color with checkerboard for transparency
                  const hasTransparency = item.opacity < 1.0;
                  title = `${item.color} (${Math.round(item.opacity * 100)}% opacity)`;
                  
                  if (hasTransparency) {
                    backgroundStyle = {
                      // Checkerboard pattern
                      backgroundImage: `
                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                      `,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                    };
                  }
                } else if (item.type === 'gradient') {
                  // Gradient
                  const g = item.gradient;
                  title = `Gradient: ${g.color1} → ${g.color2} (${g.angle}°)`;
                  backgroundStyle = {
                    background: `linear-gradient(${g.angle}deg, ${g.color1}, ${g.color2})`
                  };
                }
                
                return (
                  <button
                    key={itemKey}
                    onClick={() => handleHistoryClick(item)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '2px solid rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      padding: '0',
                      outline: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      ...backgroundStyle
                    }}
                    title={title}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    {/* Overlay for solid colors (shows color with opacity) */}
                    {item.type === 'solid' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: item.color,
                          opacity: item.opacity
                        }}
                      />
                    )}
                  </button>
                );
              })}
              
              {/* Clear History Button - Only visible on hover */}
              {isHistoryHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Clear all color history?')) {
                      clearHistory();
                    }
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    padding: '0',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    marginLeft: '4px'
                  }}
                  title="Clear history"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </>
        )}

        {/* Scroll Left Button */}
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          style={{
            width: '32px',
            height: '40px',
            backgroundColor: canScrollLeft ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            cursor: canScrollLeft ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            opacity: canScrollLeft ? 1 : 0.3,
            transition: 'all 0.15s ease',
            padding: 0,
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            if (canScrollLeft) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = canScrollLeft ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Previous colors"
        >
          ◀
        </button>

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

        {/* Scroll Right Button */}
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          style={{
            width: '32px',
            height: '40px',
            backgroundColor: canScrollRight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            cursor: canScrollRight ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            opacity: canScrollRight ? 1 : 0.3,
            transition: 'all 0.15s ease',
            padding: 0,
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            if (canScrollRight) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = canScrollRight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Next colors"
        >
          ▶
        </button>

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

        {/* Scroll hint */}
        {(canScrollLeft || canScrollRight) && (
          <div
            style={{
              fontSize: '10px',
              opacity: 0.5,
              whiteSpace: 'nowrap',
              marginLeft: '4px',
              fontStyle: 'italic'
            }}
          >
            Scroll here →
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

