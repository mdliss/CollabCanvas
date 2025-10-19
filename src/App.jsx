import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import ModernLogin from "./components/Auth/ModernLogin";
import LandingPage from "./components/Landing/LandingPage";
import Canvas from "./components/Canvas/Canvas";
import ErrorBoundary from "./components/UI/ErrorBoundary";

function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: theme.background.page
        }}
      >
        <div
          style={{
            fontSize: '18px',
            color: theme.text.secondary,
            fontWeight: '500'
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Page */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <ModernLogin />} 
      />
      
      {/* Landing Page (Project Grid) */}
      <Route 
        path="/" 
        element={user ? <LandingPage /> : <Navigate to="/login" replace />} 
      />
      
      {/* Canvas Editor - Note: Canvas handles its own UndoProvider internally */}
      <Route 
        path="/canvas/:canvasId" 
        element={
          user ? (
            <ErrorBoundary>
              <Canvas />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
