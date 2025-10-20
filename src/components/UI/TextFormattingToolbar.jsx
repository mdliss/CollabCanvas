import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function TextFormattingToolbar({ 
  shape, 
  position, 
  onUpdate,
  onClose 
}) {
  const { theme } = useTheme();
  
  // CRITICAL FIX: Guard against undefined shape (happens when shape is deleted)
  if (!shape) {
    return null;
  }
  
  const [fontFamily, setFontFamily] = useState(shape.fontFamily || 'Inter');
  const [fontSize, setFontSize] = useState(shape.fontSize || 24);
  const [fontStyle, setFontStyle] = useState(shape.fontStyle || 'normal');
  const [fontWeight, setFontWeight] = useState(shape.fontWeight || 'normal');
  const [textDecoration, setTextDecoration] = useState(shape.textDecoration || '');
  const [align, setAlign] = useState(shape.align || 'left');
  const [lineHeight, setLineHeight] = useState(shape.lineHeight || 1.2);
  const [isVisible, setIsVisible] = useState(false);
  
  // Entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const fonts = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Courier New', label: 'Courier' },
    { value: 'Comic Sans MS', label: 'Comic Sans' }
  ];

  const handleApply = () => {
    onUpdate({
      fontFamily,
      fontSize,
      fontStyle,
      fontWeight,
      textDecoration,
      align,
      lineHeight
    });
  };

  const toggleBold = () => {
    const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
    setFontWeight(newWeight);
    onUpdate({ fontWeight: newWeight });
  };

  const toggleItalic = () => {
    const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
    setFontStyle(newStyle);
    onUpdate({ fontStyle: newStyle });
  };

  const toggleUnderline = () => {
    const newDecoration = textDecoration === 'underline' ? '' : 'underline';
    setTextDecoration(newDecoration);
    onUpdate({ textDecoration: newDecoration });
  };

  const handleFontChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    onUpdate({ fontFamily: newFont });
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setFontSize(newSize);
    onUpdate({ fontSize: newSize });
  };

  const handleAlignChange = (newAlign) => {
    setAlign(newAlign);
    onUpdate({ align: newAlign });
  };

  const handleLineHeightChange = (e) => {
    const newLineHeight = parseFloat(e.target.value);
    setLineHeight(newLineHeight);
    onUpdate({ lineHeight: newLineHeight });
  };

  const styles = {
    container: {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      backgroundColor: theme.background.card,
      borderRadius: '12px',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      zIndex: 10001,
      minWidth: '440px',
      fontFamily: "'Roboto Mono', monospace",
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-5px)',
      transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${theme.border.medium}`,
      fontSize: '13px',
      backgroundColor: theme.background.input,
      color: theme.text.primary,
      cursor: 'pointer',
      minWidth: '140px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    input: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${theme.border.medium}`,
      fontSize: '13px',
      width: '70px',
      backgroundColor: theme.background.input,
      color: theme.text.primary,
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    button: {
      padding: '8px 14px',
      borderRadius: '8px',
      border: `1px solid ${theme.border.medium}`,
      backgroundColor: theme.background.card,
      color: theme.text.primary,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px',
      height: '36px',
      boxShadow: theme.shadow.sm
    },
    buttonActive: {
      backgroundColor: theme.button.primary,
      color: theme.text.inverse,
      borderColor: theme.button.primary,
      boxShadow: theme.shadow.md
    },
    slider: {
      flex: 1,
      minWidth: '120px',
      accentColor: theme.button.primary
    },
    label: {
      fontSize: '12px',
      color: theme.text.secondary,
      fontWeight: '600',
      minWidth: '85px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    divider: {
      width: '1px',
      height: '28px',
      backgroundColor: theme.border.light,
      margin: '0 6px'
    },
    closeButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      color: theme.text.tertiary,
      cursor: 'pointer',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      transition: 'color 0.2s ease'
    }
  };

  return (
    <div style={styles.container}>
      <button 
        style={styles.closeButton}
        onClick={onClose}
        onMouseEnter={(e) => e.target.style.color = theme.text.primary}
        onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
        title="Close (Esc)"
      >
        ×
      </button>

      {/* Font Family & Size Row */}
      <div style={styles.row}>
        <select 
          style={styles.select}
          value={fontFamily}
          onChange={handleFontChange}
          onFocus={(e) => e.target.style.borderColor = theme.border.focus}
          onBlur={(e) => e.target.style.borderColor = theme.border.medium}
          title="Font family"
        >
          {fonts.map(font => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <input 
          type="number"
          style={styles.input}
          value={fontSize}
          onChange={handleSizeChange}
          onFocus={(e) => e.target.style.borderColor = theme.border.focus}
          onBlur={(e) => e.target.style.borderColor = theme.border.medium}
          min="8"
          max="144"
          title="Font size"
        />

        <div style={styles.divider} />

        {/* Bold, Italic, Underline */}
        <button
          style={{
            ...styles.button,
            ...(fontWeight === 'bold' ? styles.buttonActive : {})
          }}
          onClick={toggleBold}
          onMouseEnter={(e) => {
            if (fontWeight !== 'bold') {
              e.target.style.background = theme.background.elevated;
              e.target.style.borderColor = theme.border.strong;
            }
          }}
          onMouseLeave={(e) => {
            if (fontWeight !== 'bold') {
              e.target.style.background = theme.background.card;
              e.target.style.borderColor = theme.border.medium;
            }
          }}
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </button>

        <button
          style={{
            ...styles.button,
            ...(fontStyle === 'italic' ? styles.buttonActive : {})
          }}
          onClick={toggleItalic}
          onMouseEnter={(e) => {
            if (fontStyle !== 'italic') {
              e.target.style.background = theme.background.elevated;
              e.target.style.borderColor = theme.border.strong;
            }
          }}
          onMouseLeave={(e) => {
            if (fontStyle !== 'italic') {
              e.target.style.background = theme.background.card;
              e.target.style.borderColor = theme.border.medium;
            }
          }}
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </button>

        <button
          style={{
            ...styles.button,
            ...(textDecoration === 'underline' ? styles.buttonActive : {})
          }}
          onClick={toggleUnderline}
          onMouseEnter={(e) => {
            if (textDecoration !== 'underline') {
              e.target.style.background = theme.background.elevated;
              e.target.style.borderColor = theme.border.strong;
            }
          }}
          onMouseLeave={(e) => {
            if (textDecoration !== 'underline') {
              e.target.style.background = theme.background.card;
              e.target.style.borderColor = theme.border.medium;
            }
          }}
          title="Underline (Cmd+U)"
        >
          <u>U</u>
        </button>

        <div style={styles.divider} />

        {/* Text Alignment */}
        <button
          style={{
            ...styles.button,
            ...(align === 'left' ? styles.buttonActive : {})
          }}
          onClick={() => handleAlignChange('left')}
          onMouseEnter={(e) => {
            if (align !== 'left') {
              e.target.style.background = theme.background.elevated;
              e.target.style.borderColor = theme.border.strong;
            }
          }}
          onMouseLeave={(e) => {
            if (align !== 'left') {
              e.target.style.background = theme.background.card;
              e.target.style.borderColor = theme.border.medium;
            }
          }}
          title="Align left"
        >
          ≡
        </button>

        <button
          style={{
            ...styles.button,
            ...(align === 'center' ? styles.buttonActive : {})
          }}
          onClick={() => handleAlignChange('center')}
          onMouseEnter={(e) => {
            if (align !== 'center') {
              e.target.style.background = theme.background.elevated;
              e.target.style.borderColor = theme.border.strong;
            }
          }}
          onMouseLeave={(e) => {
            if (align !== 'center') {
              e.target.style.background = theme.background.card;
              e.target.style.borderColor = theme.border.medium;
            }
          }}
          title="Align center"
        >
          ≣
        </button>

        <button
          style={{
            ...styles.button,
            ...(align === 'right' ? styles.buttonActive : {})
          }}
          onClick={() => handleAlignChange('right')}
          onMouseEnter={(e) => {
            if (align !== 'right') {
              e.target.style.background = theme.background.elevated;
              e.target.style.borderColor = theme.border.strong;
            }
          }}
          onMouseLeave={(e) => {
            if (align !== 'right') {
              e.target.style.background = theme.background.card;
              e.target.style.borderColor = theme.border.medium;
            }
          }}
          title="Align right"
        >
          ≡
        </button>
      </div>

      {/* Line Height Slider */}
      <div style={styles.row}>
        <span style={styles.label}>Line Height:</span>
        <input
          type="range"
          style={styles.slider}
          min="1.0"
          max="3.0"
          step="0.1"
          value={lineHeight}
          onChange={handleLineHeightChange}
        />
        <span style={{ fontSize: '13px', minWidth: '40px' }}>{lineHeight.toFixed(1)}</span>
      </div>

      {/* Hint */}
      <div style={{ 
        fontSize: '11px', 
        color: theme.text.tertiary, 
        textAlign: 'center',
        paddingTop: '8px',
        borderTop: `1px solid ${theme.border.light}`,
        fontWeight: '400'
      }}>
        Changes apply instantly • Click outside to close
      </div>
    </div>
  );
}

