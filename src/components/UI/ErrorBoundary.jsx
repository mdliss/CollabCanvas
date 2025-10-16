import React from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../services/firebase';

/**
 * Error Boundary Component
 * Catches React errors and provides graceful fallback UI
 * Prevents white screen of death
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Log to Firebase Analytics
    try {
      logEvent(analytics, 'canvas_error', {
        error_message: error.toString(),
        error_stack: error.stack?.substring(0, 500), // Limit stack trace length
        component_stack: errorInfo.componentStack?.substring(0, 500),
        error_id: this.state.errorId,
        timestamp: Date.now(),
        user_agent: navigator.userAgent
      });
    } catch (analyticsError) {
      console.error('[ErrorBoundary] Failed to log to Analytics:', analyticsError);
    }

    // Log to localStorage for offline error reporting
    try {
      const errorLog = {
        errorId: this.state.errorId,
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('collabcanvas_error_log') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      
      localStorage.setItem('collabcanvas_error_log', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.error('[ErrorBoundary] Failed to log to localStorage:', storageError);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearStorage = () => {
    if (confirm('Clear local storage? This will reset your view preferences but your canvas data is safe in the cloud.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  handleReport = () => {
    const { error, errorInfo, errorId } = this.state;
    const subject = `CollabCanvas Error Report - ${errorId}`;
    const body = `Error ID: ${errorId}

Error: ${error?.toString()}

Stack: ${error?.stack}

Component Stack: ${errorInfo?.componentStack}

Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}`;

    // Open email client (or could open issue tracker)
    window.location.href = `mailto:support@collabcanvas.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <div style={styles.icon}>⚠️</div>
            
            <h1 style={styles.title}>Something Went Wrong</h1>
            
            <p style={styles.message}>
              The canvas encountered an unexpected error and needs to reload.
            </p>
            
            <p style={styles.reassurance}>
              Don't worry! Your work has been saved to the database and will be restored when you reload.
            </p>
            
            <div style={styles.errorDetails}>
              <strong>Error ID:</strong> {this.state.errorId}
            </div>
            
            {this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Technical Details</summary>
                <pre style={styles.stack}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div style={styles.actions}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                Reload Canvas
              </button>
              
              <button onClick={this.handleClearStorage} style={styles.secondaryButton}>
                Clear Storage & Reload
              </button>
              
              <button onClick={this.handleReport} style={styles.secondaryButton}>
                Report Issue
              </button>
            </div>
            
            <p style={styles.footer}>
              If this error persists, try clearing your browser cache or using a different browser.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  errorBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    textAlign: 'center'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  message: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '12px',
    lineHeight: '1.6'
  },
  reassurance: {
    fontSize: '14px',
    color: '#059669',
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#d1fae5',
    borderRadius: '8px',
    lineHeight: '1.5'
  },
  errorDetails: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontFamily: 'monospace'
  },
  details: {
    marginTop: '16px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  summary: {
    cursor: 'pointer',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
    userSelect: 'none'
  },
  stack: {
    fontSize: '11px',
    color: '#374151',
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto',
    maxHeight: '200px',
    fontFamily: 'monospace',
    lineHeight: '1.4',
    border: '1px solid #e5e7eb'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '24px'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  footer: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '24px',
    lineHeight: '1.5'
  }
};

