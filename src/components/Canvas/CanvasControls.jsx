/**
 * Canvas Controls - UI controls for canvas operations
 */
export default function CanvasControls({ onAddShape }) {
  const buttonStyle = {
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    marginRight: '8px'
  };

  return (
    <div style={{ padding: '8px', marginBottom: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={() => onAddShape('rectangle')} style={buttonStyle}>
        ◼ Rectangle
      </button>
      <button onClick={() => onAddShape('circle')} style={buttonStyle}>
        ● Circle
      </button>
      <button onClick={() => onAddShape('line')} style={buttonStyle}>
        ─ Line
      </button>
      <button onClick={() => onAddShape('text')} style={buttonStyle}>
        T Text
      </button>
    </div>
  );
}

