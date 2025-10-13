import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";

function Guard({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function Home() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 16 }}>
      <div>Authed as: {user?.displayName || user?.email}</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/" element={<Guard><Home/></Guard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
