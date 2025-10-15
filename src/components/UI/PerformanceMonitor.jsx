import { useEffect, useState } from 'react';
import { usePerformance } from '../../hooks/usePerformance';

// Toggle button component
export function PerformanceToggleButton({ onClick, isVisible }) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    position: 'fixed',
    top: '50px',
    right: '10px',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: isVisible ? '#22c55e' : 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    zIndex: 9999,
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)'
  };

  if (isHovered) {
    buttonStyle.backgroundColor = isVisible ? '#16a34a' : 'rgba(0, 0, 0, 0.8)';
  }

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Toggle Performance Monitor (⚡ Cmd+Shift+P, Cmd+K, or `)"
      aria-label="Toggle Performance Monitor"
    >
      ⚡
    </button>
  );
}

export default function PerformanceMonitor() {
  const { metrics, isVisible, toggleVisibility } = usePerformance();

  // Multiple keyboard shortcuts with better detection
  useEffect(() => {
    console.log('[PerformanceMonitor] Keyboard listener mounted');
    
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Debug logging - remove after confirming it works
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        console.log('[PerformanceMonitor] Key pressed:', {
          key: e.key,
          code: e.code,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey
        });
      }

      // Option 1: Cmd/Ctrl + Shift + P (original) - check multiple ways
      const isPKey = e.key === 'P' || e.key === 'p' || e.code === 'KeyP';
      const option1 = (e.metaKey || e.ctrlKey) && e.shiftKey && isPKey;
      
      // Option 2: Cmd/Ctrl + K (common DevTools pattern)
      const option2 = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K') && !e.shiftKey;
      
      // Option 3: Backtick key ` (easy to reach, uncommon shortcut)
      const option3 = e.key === '`' && !e.metaKey && !e.ctrlKey && !e.shiftKey;

      if (option1 || option2 || option3) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[PerformanceMonitor] Performance monitor toggled!');
        toggleVisibility();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('[PerformanceMonitor] Keyboard listener unmounted');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleVisibility]);

  if (!isVisible || !metrics) return null;

  // Determine color based on performance
  const getSyncColor = (latency) => {
    if (latency < 100) return '#22c55e'; // green
    if (latency < 150) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getFpsColor = (fps) => {
    if (fps >= 60) return '#22c55e';
    if (fps >= 45) return '#eab308';
    return '#ef4444';
  };

  const styles = {
    container: {
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10000,
      minWidth: '280px',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
    },
    title: {
      fontSize: '13px',
      fontWeight: 'bold',
      marginBottom: '8px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      paddingBottom: '6px'
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
      alignItems: 'center'
    },
    label: {
      opacity: 0.8
    },
    value: {
      fontWeight: 'bold',
      textAlign: 'right'
    },
    hint: {
      fontSize: '10px',
      opacity: 0.5,
      marginTop: '8px',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>⚡ Performance Monitor</div>
      
      <div style={styles.row}>
        <span style={styles.label}>FPS:</span>
        <span style={{ ...styles.value, color: getFpsColor(metrics.fps.avg) }}>
          {Math.round(metrics.fps.avg)}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Sync Latency (p95):</span>
        <span style={{ ...styles.value, color: getSyncColor(metrics.syncLatency.p95) }}>
          {Math.round(metrics.syncLatency.p95)}ms
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Cursor Frequency:</span>
        <span style={styles.value}>
          {Math.round(metrics.cursorFrequency.hz)}Hz
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Network RTT:</span>
        <span style={styles.value}>
          {Math.round(metrics.networkRTT.avg)}ms
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Samples:</span>
        <span style={styles.value}>
          {metrics.syncLatency.samples}
        </span>
      </div>

      <div style={styles.hint}>
        Cmd+Shift+P, Cmd+K, or ` to toggle
      </div>
    </div>
  );
}

