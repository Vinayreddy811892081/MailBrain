// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import { LoginPage, RegisterPage } from "./pages/Auth";
import AppPage from "./pages/App";
import Payment from "./pages/Payment";

// ✅ Only checks login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// ✅ Handles subscription (ONLY for dashboard)
function AppRoute({ children }) {
  const { subscriptionActive, loading } = useAuth();

  if (loading) return null;

  if (!subscriptionActive) {
    return <Navigate to="/payment" replace />;
  }

  return children;
}

// ✅ Guest routes (login/register)
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Navigate to="/app" replace /> : children;
}

// ✅ MAIN APP
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
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

          {/* Dashboard (requires subscription) */}
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

          {/* Payment (only requires login) */}
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <Payment />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
