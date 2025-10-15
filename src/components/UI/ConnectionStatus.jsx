import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, onDisconnect } from 'firebase/database';
import { offlineQueue } from '../../services/offline';

export default function ConnectionStatus() {
  const [status, setStatus] = useState('connected'); // 'connected' | 'reconnecting' | 'offline'
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [autoHideTimeout, setAutoHideTimeout] = useState(null);

  // Monitor Firebase RTDB connection
  useEffect(() => {
    const db = getDatabase();
    const connectedRef = ref(db, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val();
      
      if (isConnected) {
        console.debug('[ConnectionStatus] Connected to Firebase');
        setStatus('connected');
        setIsVisible(true);
        
        // Auto-hide after 2 seconds
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, 2000);
        setAutoHideTimeout(timeout);
      } else {
        console.debug('[ConnectionStatus] Disconnected from Firebase');
        setStatus('offline');
        setIsVisible(true);
        
        // Clear auto-hide timeout
        if (autoHideTimeout) {
          clearTimeout(autoHideTimeout);
          setAutoHideTimeout(null);
        }
      }
    });

    return () => {
      unsubscribe();
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    };
  }, [autoHideTimeout]);

  // Monitor browser online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.debug('[ConnectionStatus] Browser online');
      if (status === 'offline') {
        setStatus('reconnecting');
        setIsVisible(true);
      }
    };

    const handleOffline = () => {
      console.debug('[ConnectionStatus] Browser offline');
      setStatus('offline');
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setStatus('offline');
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status]);

  // Monitor offline queue
  useEffect(() => {
    const updateQueueCount = async () => {
      try {
        const count = await offlineQueue.count();
        setPendingCount(count);
      } catch (error) {
        console.error('[ConnectionStatus] Failed to get queue count:', error);
      }
    };

    // Initial update
    updateQueueCount();

    // Listen for queue changes
    const removeListener = offlineQueue.addListener(updateQueueCount);

    // Poll every 5 seconds as backup
    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      removeListener();
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          bg: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
          icon: '✓',
          text: 'Connected',
          color: '#fff'
        };
      case 'reconnecting':
        return {
          bg: 'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)',
          icon: '↻',
          text: 'Reconnecting...',
          color: '#fff'
        };
      case 'offline':
        return {
          bg: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
          icon: '⚠',
          text: pendingCount > 0 
            ? `Offline - ${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`
            : 'Offline',
          color: '#fff'
        };
      default:
        return {
          bg: '#6b7280',
          icon: '•',
          text: 'Unknown',
          color: '#fff'
        };
    }
  };

  const config = getStatusConfig();

  const styles = {
    banner: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: config.bg,
      color: config.color,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: '500',
      zIndex: 100000,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      animation: 'slideDown 0.3s ease-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    icon: {
      fontSize: '16px',
      animation: status === 'reconnecting' ? 'spin 1s linear infinite' : 'none'
    },
    text: {
      letterSpacing: '0.02em'
    },
    closeButton: {
      marginLeft: '16px',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      color: '#fff',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      transition: 'background 0.2s',
      padding: 0
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        [data-connection-close]:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>
      <div style={styles.banner}>
        <span style={styles.icon}>{config.icon}</span>
        <span style={styles.text}>{config.text}</span>
        {status === 'connected' && (
          <button
            data-connection-close
            style={styles.closeButton}
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </>
  );
}

