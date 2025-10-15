import { useEffect } from 'react';

export default function HelpMenu({ isVisible, onClose }) {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'h' || e.key === 'H' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      backdropFilter: 'blur(4px)'
    },
    panel: {
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '32px',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff'
    },
    header: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '24px',
      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
      paddingBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    closeHint: {
      fontSize: '14px',
      opacity: 0.6,
      fontWeight: 'normal'
    },
    section: {
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '12px',
      color: '#60a5fa',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    item: {
      marginBottom: '10px',
      paddingLeft: '8px',
      lineHeight: '1.5'
    },
    key: {
      display: 'inline-block',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '13px',
      fontFamily: 'monospace',
      marginRight: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    desc: {
      opacity: 0.9,
      fontSize: '14px'
    },
    metric: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      marginBottom: '12px',
      paddingLeft: '8px'
    },
    metricName: {
      fontWeight: 'bold',
      color: '#22c55e',
      fontSize: '14px'
    },
    metricDesc: {
      opacity: 0.8,
      fontSize: '13px',
      lineHeight: '1.4'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>📚 CollabCanvas Help</span>
          <span style={styles.closeHint}>Press H or Esc to close</span>
        </div>

        {/* Keyboard Shortcuts */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>⌨️ Keyboard Shortcuts</div>
          
          <div style={styles.item}>
            <span style={styles.key}>`</span>
            <span style={styles.desc}>Toggle performance monitor</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>H</span>
            <span style={styles.desc}>Toggle this help menu</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Space + Drag</span>
            <span style={styles.desc}>Pan the canvas</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Scroll</span>
            <span style={styles.desc}>Zoom in/out</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>R</span>
            <span style={styles.desc}>Create rectangle</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>C</span>
            <span style={styles.desc}>Create circle</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>L</span>
            <span style={styles.desc}>Create line</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>T</span>
            <span style={styles.desc}>Create text</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Shift + T</span>
            <span style={styles.desc}>Create triangle</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>S</span>
            <span style={styles.desc}>Create star</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Delete</span>
            <span style={styles.desc}>Delete selected shape(s)</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>V</span>
            <span style={styles.desc}>Deselect all shapes</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📊 Performance Metrics (press ` to view)</div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>FPS</div>
            <div style={styles.metricDesc}>
              Frames per second during editing. Target: 60+ (green).
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Sync Latency (p95)</div>
            <div style={styles.metricDesc}>
              Time for changes to sync across users. 95th percentile measurement. Target: &lt;100ms (green).
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Cursor Frequency</div>
            <div style={styles.metricDesc}>
              How often cursor positions update. ~30Hz is optimal.
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Drag Saved (30s)</div>
            <div style={styles.metricDesc}>
              RTDB writes prevented by delta compression in last 30 seconds. High number = good! System attempts 100 writes/second during drag, but only sends when position/rotation changes. Smooth drags = more saves.
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Cursor Saved (30s)</div>
            <div style={styles.metricDesc}>
              Cursor updates skipped due to 2px movement filter in last 30 seconds. Prevents noise from tiny mouse movements.
            </div>
          </div>
        </div>

        {/* Real-Time Collaboration */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>👥 Real-Time Collaboration</div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Object Locking:</strong> First user to touch a shape locks it for 8 seconds. Locked shapes show red outline + 🔒 badge.
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Live Cursors:</strong> See other users&apos; cursors in real-time with their names. Updates every 33ms.
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Drag Streaming:</strong> Shape positions stream at 100Hz (every 10ms) during drag for smooth synchronization.
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Presence List:</strong> See who&apos;s online in the top-right corner. Click avatars to view profiles.
            </span>
          </div>
        </div>

        {/* Canvas Controls */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎨 Canvas Controls</div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Pan:</strong> Hold Space and drag to move around the 20,000×20,000 canvas
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Zoom:</strong> Scroll to zoom in/out (0.05× to 3× range)
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Select:</strong> Click a shape to select it. Drag to move, use handles to resize/rotate
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Multi-Select:</strong> Shift+click to select multiple shapes. Drag to select area (marquee selection)
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Color Palette:</strong> Select shapes and click a color in the bottom toolbar to change their color
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

