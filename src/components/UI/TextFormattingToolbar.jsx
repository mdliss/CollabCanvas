import { useState, useEffect } from 'react';

export default function TextFormattingToolbar({ 
  shape, 
  position, 
  onUpdate,
  onClose 
}) {
  const [fontFamily, setFontFamily] = useState(shape.fontFamily || 'Inter');
  const [fontSize, setFontSize] = useState(shape.fontSize || 24);
  const [fontStyle, setFontStyle] = useState(shape.fontStyle || 'normal');
  const [fontWeight, setFontWeight] = useState(shape.fontWeight || 'normal');
  const [textDecoration, setTextDecoration] = useState(shape.textDecoration || '');
  const [align, setAlign] = useState(shape.align || 'left');
  const [lineHeight, setLineHeight] = useState(shape.lineHeight || 1.2);

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
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 10001,
      minWidth: '420px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    select: {
      padding: '6px 10px',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      fontSize: '13px',
      backgroundColor: '#fff',
      cursor: 'pointer',
      minWidth: '120px'
    },
    input: {
      padding: '6px 10px',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      fontSize: '13px',
      width: '60px'
    },
    button: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      backgroundColor: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '36px',
      height: '32px'
    },
    buttonActive: {
      backgroundColor: '#3b82f6',
      color: '#fff',
      borderColor: '#3b82f6'
    },
    slider: {
      flex: 1,
      minWidth: '100px'
    },
    label: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '500',
      minWidth: '70px'
    },
    divider: {
      width: '1px',
      height: '24px',
      backgroundColor: '#e5e7eb',
      margin: '0 4px'
    },
    closeButton: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      color: '#9ca3af',
      cursor: 'pointer',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <button 
        style={styles.closeButton}
        onClick={onClose}
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
        color: '#9ca3af', 
        textAlign: 'center',
        paddingTop: '4px',
        borderTop: '1px solid #e5e7eb'
      }}>
        Click outside to close • Changes apply immediately
      </div>
    </div>
  );
}

