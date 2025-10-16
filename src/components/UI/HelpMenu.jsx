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
          
          <div style={styles.item}>
            <span style={styles.key}>Cmd/Ctrl + C</span>
            <span style={styles.desc}>Copy selected shape(s)</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Cmd/Ctrl + V</span>
            <span style={styles.desc}>Paste copied shape(s)</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Cmd/Ctrl + Z</span>
            <span style={styles.desc}>Undo last action</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Cmd/Ctrl + Shift + Z</span>
            <span style={styles.desc}>Redo last undone action</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Shift + L</span>
            <span style={styles.desc}>Toggle layers panel</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Shift + ]</span>
            <span style={styles.desc}>Bring selected shape(s) forward one layer</span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.key}>Shift + [</span>
            <span style={styles.desc}>Send selected shape(s) backward one layer</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📊 Performance Metrics (press ` to view)</div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>FPS</div>
            <div style={styles.metricDesc}>
              How smoothly the canvas renders. 60 FPS = butter smooth. Green is good, yellow means slight lag, red means performance issues.
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Sync Latency (p95)</div>
            <div style={styles.metricDesc}>
              How fast your changes appear on other users' screens. Under 100ms (green) = instant. Over 150ms (red) = noticeable delay. This measures the slowest 5% of syncs.
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Cursor Frequency</div>
            <div style={styles.metricDesc}>
              How many times per second other users see your cursor move. 30 updates/second is smooth. Lower means choppy cursor movement.
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Drag Saved (30s)</div>
            <div style={styles.metricDesc}>
              Network bandwidth saved by smart updates. When you drag smoothly, the system tries to send 100 updates/second but skips ones where nothing changed. High number = efficient! This counts skipped updates in the last 30 seconds.
            </div>
          </div>
          
          <div style={styles.metric}>
            <div style={styles.metricName}>Cursor Saved (30s)</div>
            <div style={styles.metricDesc}>
              How many cursor updates were skipped because you barely moved your mouse (less than 2 pixels). Filters out jitter and saves bandwidth. High number = good!
            </div>
          </div>
        </div>

        {/* Real-Time Collaboration */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>👥 Real-Time Collaboration</div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Object Locking:</strong> When you grab a shape, it's yours for 8 seconds (prevents edit conflicts). You'll see your own shape normally, others see it with a red outline and lock icon 🔒.
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Live Cursors:</strong> See where everyone else is pointing in real-time. Each cursor shows the user's name and updates 30 times per second for smooth tracking.
            </span>
          </div>
          
          <div style={styles.item}>
            <span style={styles.desc}>
              <strong>Drag Streaming:</strong> When you drag a shape, other users see it move in real-time (100 updates/second). When you pause mid-drag, they still see the shape (it doesn't disappear). Orange outline means someone else is dragging.
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

