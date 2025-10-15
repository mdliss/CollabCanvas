import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { offlineQueue } from '../../services/offline';

export default function ConnectionStatus() {
  const [status, setStatus] = useState('connected');
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Monitor Firebase RTDB connection
  useEffect(() => {
    const db = getDatabase();
    const connectedRef = ref(db, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val();
      
      if (isConnected) {
        setStatus('connected');
        setIsVisible(true);
        const timeout = setTimeout(() => setIsVisible(false), 2000);
        return () => clearTimeout(timeout);
      } else {
        setStatus('offline');
        setIsVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Monitor browser online/offline
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'offline') {
        setStatus('reconnecting');
        setIsVisible(true);
      }
    };

    const handleOffline = () => {
      setStatus('offline');
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
    const updateCount = async () => {
      try {
        const count = await offlineQueue.count();
        setPendingCount(count);
      } catch (error) {
        console.error('[ConnectionStatus] Failed to get queue count:', error);
      }
    };

    updateCount();
    const removeListener = offlineQueue.addListener(updateCount);
    const interval = setInterval(updateCount, 5000);

    return () => {
      removeListener();
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  const getConfig = () => {
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
        return { bg: '#6b7280', icon: '•', text: 'Unknown', color: '#fff' };
    }
  };

  const config = getConfig();

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
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
      }}>
        <span style={{
          fontSize: '16px',
          animation: status === 'reconnecting' ? 'spin 1s linear infinite' : 'none'
        }}>{config.icon}</span>
        <span>{config.text}</span>
        {status === 'connected' && (
          <button
            style={{
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
              padding: 0
            }}
            onClick={() => setIsVisible(false)}
          >×</button>
        )}
      </div>
    </>
  );
}

