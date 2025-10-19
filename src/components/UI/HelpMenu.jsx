import { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function HelpMenu({ isVisible, onClose }) {
  const { theme } = useTheme();
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
      backgroundColor: theme.backdrop,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    },
    panel: {
      backgroundColor: theme.background.card,
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '900px',
      maxHeight: '85vh',
      overflowY: 'auto',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.medium}`,
      color: theme.text.primary,
      animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    header: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
      color: theme.text.primary,
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '14px',
      color: theme.text.tertiary,
      marginBottom: '32px',
      paddingBottom: '24px',
      borderBottom: `1px solid ${theme.border.light}`
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '32px',
      marginBottom: '32px'
    },
    section: {
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '16px',
      color: theme.button.primary,
      letterSpacing: '-0.3px'
    },
    item: {
      display: 'flex',
      alignItems: 'baseline',
      marginBottom: '12px',
      paddingLeft: '4px',
      lineHeight: '1.6'
    },
    key: {
      display: 'inline-block',
      backgroundColor: theme.background.elevated,
      padding: '3px 10px',
      borderRadius: '6px',
      fontSize: '13px',
      fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
      marginRight: '12px',
      border: `1px solid ${theme.border.strong}`,
      color: theme.button.primary,
      fontWeight: '500',
      minWidth: '100px',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      flexShrink: 0
    },
    desc: {
      color: theme.text.secondary,
      fontSize: '14px',
      lineHeight: '1.6'
    },
    feature: {
      marginBottom: '16px',
      paddingLeft: '4px'
    },
    featureTitle: {
      fontWeight: '600',
      color: theme.text.primary,
      fontSize: '14px',
      marginBottom: '6px'
    },
    featureDesc: {
      color: theme.text.secondary,
      fontSize: '13px',
      lineHeight: '1.6',
      paddingLeft: '16px',
      borderLeft: `2px solid ${theme.border.strong}`
    },
    note: {
      backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.15)',
      border: `1px solid ${theme.accent.yellow}`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '24px',
      fontSize: '13px',
      color: theme.text.secondary,
      lineHeight: '1.6'
    },
    noteTitle: {
      fontWeight: '600',
      color: theme.accent.yellow,
      marginBottom: '4px'
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        /* Custom scrollbar for help panel */
        .help-panel::-webkit-scrollbar {
          width: 8px;
        }
        
        .help-panel::-webkit-scrollbar-track {
          background: ${theme.background.elevated};
          border-radius: 4px;
        }
        
        .help-panel::-webkit-scrollbar-thumb {
          background: ${theme.border.strong};
          border-radius: 4px;
        }
        
        .help-panel::-webkit-scrollbar-thumb:hover {
          background: ${theme.button.primary};
        }
      `}</style>
      <div style={styles.overlay} onClick={onClose}>
        <div className="help-panel" style={styles.panel} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>CollabCanvas Help</div>
          <div style={styles.subtitle}>
            Press H or Esc to close • All keyboard shortcuts work when not typing in text fields
          </div>

          <div style={styles.grid}>
            {/* Navigation & View Controls */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Navigation & View</div>
              
              <div style={styles.item}>
                <span style={styles.key}>Space + Drag</span>
                <span style={styles.desc}>Pan the canvas</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Middle Click</span>
                <span style={styles.desc}>Pan the canvas</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Scroll Wheel</span>
                <span style={styles.desc}>Zoom in/out</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>0 or Home</span>
                <span style={styles.desc}>Center view on canvas</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>H</span>
                <span style={styles.desc}>Toggle help menu</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>`</span>
                <span style={styles.desc}>Toggle performance monitor</span>
              </div>
            </div>

            {/* Shape Creation */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Shape Creation</div>
              
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
            </div>

            {/* Selection & Editing */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Selection & Editing</div>
              
              <div style={styles.item}>
                <span style={styles.key}>Click</span>
                <span style={styles.desc}>Select shape</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Shift + Click</span>
                <span style={styles.desc}>Multi-select shapes</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Drag</span>
                <span style={styles.desc}>Box select (marquee)</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Double Click</span>
                <span style={styles.desc}>Edit text shape</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>V</span>
                <span style={styles.desc}>Deselect all</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Delete</span>
                <span style={styles.desc}>Delete selected shapes</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Backspace</span>
                <span style={styles.desc}>Delete selected shapes</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Right Click</span>
                <span style={styles.desc}>Context menu</span>
              </div>
            </div>

            {/* Clipboard Operations */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Clipboard Operations</div>
              
              <div style={styles.item}>
                <span style={styles.key}>Cmd/Ctrl + C</span>
                <span style={styles.desc}>Copy selected</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Cmd/Ctrl + X</span>
                <span style={styles.desc}>Cut selected</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Cmd/Ctrl + V</span>
                <span style={styles.desc}>Paste</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Cmd/Ctrl + D</span>
                <span style={styles.desc}>Duplicate selected</span>
              </div>
            </div>

            {/* Undo/Redo */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>History</div>
              
              <div style={styles.item}>
                <span style={styles.key}>Cmd/Ctrl + Z</span>
                <span style={styles.desc}>Undo</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Cmd/Ctrl + ⇧ + Z</span>
                <span style={styles.desc}>Redo</span>
              </div>
            </div>

            {/* Layer Ordering */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Layer Ordering</div>
              
              <div style={styles.item}>
                <span style={styles.key}>]</span>
                <span style={styles.desc}>Bring forward</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>[</span>
                <span style={styles.desc}>Send backward</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Shift + {'}'}</span>
                <span style={styles.desc}>Bring to front</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Shift + {'{'}</span>
                <span style={styles.desc}>Send to back</span>
              </div>
            </div>

            {/* Panels & UI */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Panels & UI</div>
              
              <div style={styles.item}>
                <span style={styles.key}>Shift + L</span>
                <span style={styles.desc}>Toggle layers panel</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>M</span>
                <span style={styles.desc}>Toggle chat panel</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Shift + A</span>
                <span style={styles.desc}>Toggle AI assistant</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Shift + I</span>
                <span style={styles.desc}>Toggle AI design suggestions</span>
              </div>
              
              <div style={styles.item}>
                <span style={styles.key}>Esc</span>
                <span style={styles.desc}>Close open panels</span>
              </div>
            </div>
          </div>

          {/* Collaboration Features - Full Width */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Real-Time Collaboration Features</div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Live Cursors</div>
              <div style={styles.featureDesc}>
                See where other users are pointing in real-time with their names and colors. Updates 30 times per second for smooth tracking.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Shape Locking</div>
              <div style={styles.featureDesc}>
                When you select or drag a shape, it's automatically locked for 8 seconds to prevent edit conflicts. Locked shapes show a red outline and lock indicator to other users.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>100Hz Drag Streaming</div>
              <div style={styles.featureDesc}>
                When you drag shapes, other users see smooth real-time movement at 100 updates per second. Shapes being dragged by others show an orange outline.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Multi-Shape Drag</div>
              <div style={styles.featureDesc}>
                Select multiple shapes with Shift+Click or box selection, then drag any selected shape to move all of them together as a group.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Presence List</div>
              <div style={styles.featureDesc}>
                See who's online in the top-right corner. Click avatars to view user profiles and activity.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Real-Time Chat</div>
              <div style={styles.featureDesc}>
                Communicate with collaborators using the chat panel. Supports text messages, GIFs, and file attachments.
              </div>
            </div>
          </div>

          {/* Canvas Details - Full Width */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Canvas Features</div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Infinite Canvas</div>
              <div style={styles.featureDesc}>
                Work on a massive 30,000 × 30,000 pixel canvas with unlimited zoom levels from 0.01× to 5×.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Shape Transformation</div>
              <div style={styles.featureDesc}>
                Drag shapes to move them. Use corner handles to resize and rotation handle to rotate. Hold Shift while resizing to maintain aspect ratio.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Text Editing</div>
              <div style={styles.featureDesc}>
                Double-click any text shape to open the inline text editor. Select text shapes to access the formatting toolbar with font, size, weight, style, decoration, and alignment options.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Color & Styling</div>
              <div style={styles.featureDesc}>
                Select shapes to access the color palette at the bottom of the screen. Supports solid colors and gradients with multiple themes.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Undo/Redo System</div>
              <div style={styles.featureDesc}>
                Full command pattern with synced history across all users. Every action is undoable and redoable with descriptive feedback.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>AI Tools</div>
              <div style={styles.featureDesc}>
                AI Assistant provides design help and generation. AI Design Suggestions analyzes your canvas and offers improvement recommendations.
              </div>
            </div>
          </div>

          {/* Performance Monitor Info */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Performance Monitor Metrics</div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>FPS (Frames Per Second)</div>
              <div style={styles.featureDesc}>
                Measures canvas rendering smoothness. 60 FPS is ideal (green), 45-60 FPS is acceptable (yellow), below 45 FPS indicates performance issues (red).
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Sync Latency (p95)</div>
              <div style={styles.featureDesc}>
                Shows how fast your changes appear on other users' screens. Under 100ms is instant (green), 100-150ms is good (yellow), over 150ms is noticeable delay (red). Measures the slowest 5% of synchronization operations.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Cursor Frequency</div>
              <div style={styles.featureDesc}>
                Tracks cursor position update rate. 30 updates per second provides smooth cursor movement for other users.
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureTitle}>Drag Saved & Cursor Saved</div>
              <div style={styles.featureDesc}>
                Network bandwidth optimization metrics. Counts skipped updates when position hasn't changed (drag) or movement is less than 2 pixels (cursor). Higher numbers mean better efficiency.
              </div>
            </div>
          </div>

          {/* Viewer Mode Note */}
          <div style={styles.note}>
            <div style={styles.noteTitle}>Editor vs Viewer Mode</div>
            Some features are only available in editor mode. Viewers have read-only access and can see all changes in real-time, use the chat panel, and view AI suggestions, but cannot create, modify, or delete shapes.
          </div>
        </div>
      </div>
    </>
  );
}
