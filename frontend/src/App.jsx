import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import { LoginPage, RegisterPage } from "./pages/Auth";
import AppPage from "./pages/App";
import Payment from "./pages/Payment";
import Privacy from "./pages/Privacy"; // ✅ ADD THIS

// Only checks login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// Only checks subscription for dashboard
function AppRoute({ children }) {
  const { subscriptionActive, loading } = useAuth();

  if (loading) return null;
  if (!subscriptionActive) return <Navigate to="/payment" replace />;

  return children;
}

// Guest-only routes
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route path="/privacy" element={<Privacy />} /> {/* ✅ ADD THIS */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <AppRoute>
                  <AppPage />
                </AppRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <Payment />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
