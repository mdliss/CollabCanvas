/**
 * Canvas Controls - UI controls for canvas operations
 */
export default function CanvasControls({ onAddShape, onLayerUp, onLayerDown, selectedShape }) {
  return (
    <div style={{
      position: "fixed",
      top: "80px",
      right: "20px",
      zIndex: 1000,
      background: "white",
      padding: "12px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }}>
      <button
        onClick={() => onAddShape('rectangle')}
        style={{
          padding: "8px 16px",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        ◼ Rectangle
      </button>
      <button
        onClick={() => onAddShape('circle')}
        style={{
          padding: "8px 16px",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        ● Circle
      </button>
      <button
        onClick={() => onAddShape('line')}
        style={{
          padding: "8px 16px",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        ─ Line
      </button>
      <button
        onClick={() => onAddShape('text')}
        style={{
          padding: "8px 16px",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        T Text
      </button>
      {selectedShape && (
        <>
          <div style={{
            height: "1px",
            background: "#ddd",
            margin: "4px 0"
          }} />
          <button
            onClick={onLayerUp}
            style={{
              padding: "6px 12px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            ↑ Bring Forward
          </button>
          <button
            onClick={onLayerDown}
            style={{
              padding: "6px 12px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            ↓ Send Backward
          </button>
        </>
      )}
    </div>
  );
}
