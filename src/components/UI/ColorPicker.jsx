import { useState, useRef, useEffect } from 'react';

/**
 * ColorPicker - Full-spectrum color picker with opacity control
 * Features:
 * - HSV color wheel/square for full color selection
 * - Opacity slider (0-100%)
 * - Hex input field
 * - Visual preview with checkerboard background
 */
export default function ColorPicker({ initialColor = '#FF0000', initialOpacity = 100, onColorChange, onClose }) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [value, setValue] = useState(100);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [hexInput, setHexInput] = useState(initialColor);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  
  const svSquareRef = useRef(null);
  const hueSliderRef = useRef(null);

  // Parse initial color to HSV
  useEffect(() => {
    const rgb = hexToRgb(initialColor);
    if (rgb) {
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
    }
    setHexInput(initialColor);
  }, [initialColor]);

  // Convert HSV to RGB
  const hsvToRgb = (h, s, v) => {
    s = s / 100;
    v = v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // Convert RGB to HSV
  const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;

    return { h, s, v };
  };

  // Convert RGB to Hex
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  // Convert Hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Get current RGB color
  const getCurrentRgb = () => hsvToRgb(hue, saturation, value);

  // Get current hex color
  const getCurrentHex = () => {
    const rgb = getCurrentRgb();
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  // Get current RGBA color with opacity
  const getCurrentRgba = () => {
    const rgb = getCurrentRgb();
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
  };

  // Handle SV square interaction
  const handleSvSquareInteraction = (e) => {
    if (!svSquareRef.current) return;
    
    const rect = svSquareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const newSaturation = (x / rect.width) * 100;
    const newValue = 100 - (y / rect.height) * 100;
    
    setSaturation(newSaturation);
    setValue(newValue);
    updateHexInput();
  };

  // Handle hue slider interaction
  const handleHueSliderInteraction = (e) => {
    if (!hueSliderRef.current) return;
    
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    
    setHue(newHue);
    updateHexInput();
  };

  // Update hex input from HSV
  const updateHexInput = () => {
    setHexInput(getCurrentHex());
  };

  // Handle hex input change
  const handleHexInputChange = (e) => {
    const value = e.target.value;
    setHexInput(value);
    
    // Try to parse and update HSV
    if (/^#?[0-9A-Fa-f]{6}$/.test(value)) {
      const hex = value.startsWith('#') ? value : '#' + value;
      const rgb = hexToRgb(hex);
      if (rgb) {
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setValue(hsv.v);
      }
    }
  };

  // Handle apply button
  const handleApply = () => {
    if (onColorChange) {
      onColorChange(getCurrentHex(), opacity);
    }
    if (onClose) {
      onClose();
    }
  };

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      if (dragType === 'sv') {
        handleSvSquareInteraction(e);
      } else if (dragType === 'hue') {
        handleHueSliderInteraction(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragType]);

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      backdropFilter: 'blur(4px)'
    },
    panel: {
      backgroundColor: '#2a2a2a',
      borderRadius: '12px',
      padding: '24px',
      width: '320px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff'
    },
    header: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    svSquare: {
      width: '100%',
      height: '200px',
      borderRadius: '8px',
      marginBottom: '16px',
      cursor: 'crosshair',
      position: 'relative',
      background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
      border: '2px solid rgba(255, 255, 255, 0.2)'
    },
    svCursor: {
      position: 'absolute',
      width: '16px',
      height: '16px',
      border: '2px solid #fff',
      borderRadius: '50%',
      boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      left: `${saturation}%`,
      top: `${100 - value}%`
    },
    hueSlider: {
      width: '100%',
      height: '20px',
      borderRadius: '10px',
      marginBottom: '16px',
      cursor: 'pointer',
      position: 'relative',
      background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)'
    },
    hueCursor: {
      position: 'absolute',
      width: '8px',
      height: '24px',
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
      top: '-2px',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      left: `${(hue / 360) * 100}%`
    },
    sliderGroup: {
      marginBottom: '16px'
    },
    label: {
      fontSize: '13px',
      marginBottom: '6px',
      opacity: 0.8
    },
    opacitySlider: {
      width: '100%',
      height: '20px',
      borderRadius: '10px',
      cursor: 'pointer',
      position: 'relative',
      backgroundImage: `
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
      `,
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
      border: '2px solid rgba(255, 255, 255, 0.2)'
    },
    opacityGradient: {
      width: '100%',
      height: '100%',
      borderRadius: '8px',
      background: `linear-gradient(to right, transparent, ${getCurrentHex()})`
    },
    opacityCursor: {
      position: 'absolute',
      width: '8px',
      height: '24px',
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
      top: '-2px',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      left: `${opacity}%`
    },
    hexInput: {
      width: '100%',
      padding: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '14px',
      fontFamily: 'monospace',
      marginBottom: '16px',
      textAlign: 'center'
    },
    preview: {
      width: '100%',
      height: '50px',
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundImage: `
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
      `,
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      position: 'relative'
    },
    previewColor: {
      width: '100%',
      height: '100%',
      borderRadius: '6px',
      backgroundColor: getCurrentRgba()
    },
    buttons: {
      display: 'flex',
      gap: '12px'
    },
    button: {
      flex: 1,
      padding: '10px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    applyButton: {
      backgroundColor: '#22c55e',
      color: '#fff'
    },
    cancelButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>🎨 Custom Color</span>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>{opacity}%</span>
        </div>

        {/* Saturation/Value Square */}
        <div
          ref={svSquareRef}
          style={styles.svSquare}
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragType('sv');
            handleSvSquareInteraction(e);
          }}
        >
          <div style={styles.svCursor} />
        </div>

        {/* Hue Slider */}
        <div
          ref={hueSliderRef}
          style={styles.hueSlider}
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragType('hue');
            handleHueSliderInteraction(e);
          }}
        >
          <div style={styles.hueCursor} />
        </div>

        {/* Opacity Slider */}
        <div style={styles.sliderGroup}>
          <div style={styles.label}>Opacity</div>
          <div style={styles.opacitySlider}>
            <div style={styles.opacityGradient} />
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={styles.opacityCursor} />
          </div>
        </div>

        {/* Hex Input */}
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          placeholder="#FFFFFF"
          style={styles.hexInput}
          maxLength={7}
        />

        {/* Preview */}
        <div style={styles.preview}>
          <div style={styles.previewColor} />
        </div>

        {/* Action Buttons */}
        <div style={styles.buttons}>
          <button
            style={{ ...styles.button, ...styles.cancelButton }}
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.applyButton }}
            onClick={handleApply}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

