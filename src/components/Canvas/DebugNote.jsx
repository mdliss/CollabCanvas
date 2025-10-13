/**
 * Debug overlay component - displays diagnostic info
 */
export default function DebugNote({ projectId, docPath, count, error, rtdbUrl, presenceCount, cursorCount }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: 8,
        fontSize: 12,
        borderRadius: 4,
        zIndex: 9999,
        fontFamily: "monospace"
      }}
    >
      <div>Project: {projectId || "N/A"}</div>
      <div>Doc: {docPath}</div>
      <div>Shapes: {count}</div>
      {rtdbUrl && <div>RTDB: {rtdbUrl}</div>}
      {presenceCount != null && <div>Presence: {presenceCount}</div>}
      {cursorCount != null && <div>Cursors: {cursorCount}</div>}
      {error && <div style={{ color: "#ff3b30" }}>Error: {error}</div>}
    </div>
  );
}

