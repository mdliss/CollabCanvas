import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UndoProvider } from "./contexts/UndoContext";
import AuthBar from "./components/Auth/AuthBar";
import EmailLoginModal from "./components/Auth/EmailLoginModal";
import Canvas from "./components/Canvas/Canvas";
import ErrorBoundary from "./components/UI/ErrorBoundary";

function AppContent() {
  const { user, loading } = useAuth();
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#f5f5f5'
        }}
      >
        <div
          style={{
            fontSize: '18px',
            color: '#666',
            fontWeight: '500'
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top-center Auth Bar */}
      <AuthBar onShowEmailLogin={() => setShowEmailLogin(true)} />

      {/* Email Login Modal */}
      {showEmailLogin && (
        <EmailLoginModal onClose={() => setShowEmailLogin(false)} />
      )}

      {/* Canvas (wrapped in ErrorBoundary for graceful error handling) */}
      {user && (
        <ErrorBoundary>
          <Canvas />
        </ErrorBoundary>
      )}

      {/* Unauthed state - show welcome message */}
      {!user && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '48px 32px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '700',
                margin: '0 0 16px 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              CollabCanvas
            </h1>
            <p
              style={{
                fontSize: '20px',
                margin: '0 0 32px 0',
                opacity: 0.9,
                lineHeight: '1.6'
              }}
            >
              Real-time collaborative canvas with multiplayer editing, live cursors, and instant sync.
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '16px',
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '24px',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <span>Create shapes with keyboard shortcuts (R, C, L, T)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>👥</span>
                <span>See other users' cursors and selections in real-time</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <span>First-touch locking prevents edit conflicts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <span>Sub-100ms synchronization across all clients</span>
              </div>
            </div>
            <p
              style={{
                fontSize: '16px',
                marginTop: '32px',
                opacity: 0.8
              }}
            >
              👆 Sign in above to start collaborating
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UndoProvider>
        <AppContent />
      </UndoProvider>
    </AuthProvider>
  );
}
