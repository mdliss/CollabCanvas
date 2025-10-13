/**
 * Canvas Controls - UI controls for canvas operations
 */
export default function CanvasControls({ onAddRectangle }) {
  return (
    <div style={{ padding: '8px', marginBottom: '8px' }}>
      <button 
        onClick={onAddRectangle}
        style={{
          padding: '8px 16px',
          cursor: 'pointer',
          backgroundColor: '#4A90E2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Add Rectangle
      </button>
    </div>
  );
}

