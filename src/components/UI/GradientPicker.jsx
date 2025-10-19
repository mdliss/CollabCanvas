import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * GradientPicker - Simple two-color gradient picker
 * Features:
 * - Pick two colors for gradient
 * - Angle control (0-360 degrees)
 * - Linear gradient only (for simplicity)
 * - Visual preview
 * - Smooth animations
 * - Theme-aware styling
 */
export default function GradientPicker({ onApply, onClose }) {
  const { theme } = useTheme();
  const [color1, setColor1] = useState('#FF6B6B');
  const [color2, setColor2] = useState('#4ECDC4');
  const [angle, setAngle] = useState(90);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({ color1, color2, angle });
    }
    handleClose();
  };

  const presetGradients = [
    { name: 'Sunset', colors: ['#FF6B6B', '#FFE66D'], angle: 135 },
    { name: 'Ocean', colors: ['#4ECDC4', '#556270'], angle: 180 },
    { name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
    { name: 'Fire', colors: ['#F2994A', '#F2C94C'], angle: 45 },
    { name: 'Purple', colors: ['#667EEA', '#764BA2'], angle: 135 },
    { name: 'Mint', colors: ['#00B4DB', '#0083B0'], angle: 90 },
    { name: 'Rose', colors: ['#FF6B9D', '#C23866'], angle: 120 },
    { name: 'Sky', colors: ['#38B2AC', '#2C5282'], angle: 90 },
    { name: 'Peach', colors: ['#FFDAB9', '#FFB6C1'], angle: 45 },
    { name: 'Night', colors: ['#2C3E50', '#3498DB'], angle: 180 },
    { name: 'Autumn', colors: ['#F09819', '#EDDE5D'], angle: 135 },
    { name: 'Spring', colors: ['#56AB2F', '#A8E063'], angle: 90 },
  ];

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.backdrop,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    panel: {
      background: theme.background.card,
      borderRadius: '16px',
      padding: '32px',
      width: '500px',
      maxWidth: '90vw',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    header: {
      fontSize: '20px',
      fontWeight: '600',
      margin: '0 0 24px 0',
      color: theme.text.primary,
      textAlign: 'center',
      letterSpacing: '-0.02em'
    },
    preview: {
      width: '100%',
      height: '120px',
      borderRadius: '12px',
      marginBottom: '24px',
      background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
      border: `1px solid ${theme.border.medium}`,
      boxShadow: theme.shadow.md
    },
    section: {
      marginBottom: '20px'
    },
    label: {
      fontSize: '13px',
      marginBottom: '10px',
      color: theme.text.secondary,
      fontWeight: '500'
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
      height: '56px',
      borderRadius: '8px',
      border: `1px solid ${theme.border.medium}`,
      cursor: 'pointer',
      marginBottom: '8px',
      transition: 'all 0.2s ease'
    },
    colorLabel: {
      fontSize: '12px',
      textAlign: 'center',
      color: theme.text.tertiary,
      fontFamily: 'monospace',
      fontWeight: '500'
    },
    angleControl: {
      marginBottom: '20px'
    },
    angleSlider: {
      width: '100%',
      marginBottom: '6px'
    },
    angleDisplay: {
      fontSize: '14px',
      textAlign: 'center',
      color: theme.text.primary,
      fontWeight: '500'
    },
    presets: {
      marginBottom: '20px'
    },
    presetGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px'
    },
    preset: {
      height: '80px',
      borderRadius: '12px',
      border: `1px solid ${theme.border.medium}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '600',
      color: '#ffffff',
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
      boxShadow: theme.shadow.sm,
      padding: 0,
      outline: 'none'
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
      background: theme.button.primary,
      color: theme.text.inverse
    },
    cancelButton: {
      background: theme.background.elevated,
      color: theme.text.primary,
      border: `1px solid ${theme.border.medium}`
    }
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.header}>
          Gradient Picker
        </h3>

        {/* Gradient Presets Grid - Simple selection */}
        <div style={styles.presetGrid}>
          {presetGradients.map((preset) => (
            <button
              key={preset.name}
              style={{
                ...styles.preset,
                background: `linear-gradient(${preset.angle}deg, ${preset.colors[0]}, ${preset.colors[1]})`
              }}
              onClick={() => {
                onApply({ 
                  color1: preset.colors[0], 
                  color2: preset.colors[1], 
                  angle: preset.angle 
                });
                handleClose();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.button.primary;
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = theme.shadow.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border.medium;
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = theme.shadow.sm;
              }}
            >
              <span style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)'
              }}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

