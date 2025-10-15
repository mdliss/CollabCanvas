import { useState } from 'react';

/**
 * GradientPicker - Simple two-color gradient picker
 * Features:
 * - Pick two colors for gradient
 * - Angle control (0-360 degrees)
 * - Linear gradient only (for simplicity)
 * - Visual preview
 */
export default function GradientPicker({ onApply, onClose }) {
  const [color1, setColor1] = useState('#FF6B6B');
  const [color2, setColor2] = useState('#4ECDC4');
  const [angle, setAngle] = useState(90);

  const handleApply = () => {
    if (onApply) {
      onApply({ color1, color2, angle });
    }
    if (onClose) {
      onClose();
    }
  };

  const presetGradients = [
    { name: 'Sunset', colors: ['#FF6B6B', '#FFE66D'], angle: 135 },
    { name: 'Ocean', colors: ['#4ECDC4', '#556270'], angle: 180 },
    { name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
    { name: 'Fire', colors: ['#F2994A', '#F2C94C'], angle: 45 },
    { name: 'Purple', colors: ['#667EEA', '#764BA2'], angle: 135 },
    { name: 'Mint', colors: ['#00B4DB', '#0083B0'], angle: 90 },
  ];

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
      width: '340px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff'
    },
    header: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '20px'
    },
    preview: {
      width: '100%',
      height: '100px',
      borderRadius: '8px',
      marginBottom: '20px',
      background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
      border: '2px solid rgba(255, 255, 255, 0.2)',
      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    section: {
      marginBottom: '20px'
    },
    label: {
      fontSize: '13px',
      marginBottom: '8px',
      opacity: 0.8
    },
    colorInputs: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px'
    },
    colorInput: {
      flex: 1
    },
    colorBox: {
      width: '100%',
      height: '50px',
      borderRadius: '6px',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      marginBottom: '6px'
    },
    colorLabel: {
      fontSize: '11px',
      textAlign: 'center',
      opacity: 0.6,
      fontFamily: 'monospace'
    },
    angleControl: {
      marginBottom: '20px'
    },
    angleSlider: {
      width: '100%',
      marginBottom: '6px'
    },
    angleDisplay: {
      fontSize: '13px',
      textAlign: 'center',
      opacity: 0.8
    },
    presets: {
      marginBottom: '20px'
    },
    presetGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px'
    },
    preset: {
      height: '50px',
      borderRadius: '6px',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '500',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
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
          🌈 Gradient Picker
        </div>

        {/* Preview */}
        <div style={styles.preview} />

        {/* Color Inputs */}
        <div style={styles.section}>
          <div style={styles.label}>Gradient Colors</div>
          <div style={styles.colorInputs}>
            <div style={styles.colorInput}>
              <div
                style={{ ...styles.colorBox, backgroundColor: color1 }}
                onClick={() => {
                  const newColor = prompt('Enter hex color (e.g., #FF6B6B):', color1);
                  if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
                    setColor1(newColor);
                  }
                }}
              />
              <div style={styles.colorLabel}>Start: {color1}</div>
            </div>
            <div style={styles.colorInput}>
              <div
                style={{ ...styles.colorBox, backgroundColor: color2 }}
                onClick={() => {
                  const newColor = prompt('Enter hex color (e.g., #4ECDC4):', color2);
                  if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
                    setColor2(newColor);
                  }
                }}
              />
              <div style={styles.colorLabel}>End: {color2}</div>
            </div>
          </div>
        </div>

        {/* Angle Control */}
        <div style={styles.angleControl}>
          <div style={styles.label}>Angle</div>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))}
            style={styles.angleSlider}
          />
          <div style={styles.angleDisplay}>{angle}°</div>
        </div>

        {/* Presets */}
        <div style={styles.presets}>
          <div style={styles.label}>Presets</div>
          <div style={styles.presetGrid}>
            {presetGradients.map((preset) => (
              <div
                key={preset.name}
                style={{
                  ...styles.preset,
                  background: `linear-gradient(${preset.angle}deg, ${preset.colors[0]}, ${preset.colors[1]})`
                }}
                onClick={() => {
                  setColor1(preset.colors[0]);
                  setColor2(preset.colors[1]);
                  setAngle(preset.angle);
                }}
                onMouseEnter={(e) => e.target.style.borderColor = '#22c55e'}
                onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              >
                {preset.name}
              </div>
            ))}
          </div>
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
            Apply Gradient
          </button>
        </div>
      </div>
    </div>
  );
}

