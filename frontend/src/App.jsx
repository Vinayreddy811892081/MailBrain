// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import { LoginPage, RegisterPage } from "./pages/Auth";
import AppPage from "./pages/App";
import Payment from "./pages/Payment";
import { useLocation } from "react-router-dom";

function PrivateRoute({ children }) {
  const { user, loading, subscriptionActive } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // 🔥 ONLY block /app (NOT payment page)
  if (!subscriptionActive && location.pathname === "/app") {
    return <Navigate to="/payment" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#4dffb8", secondary: "#0f0f11" },
            },
            error: { iconTheme: { primary: "#ff4d6a", secondary: "#0f0f11" } },
          }}
        />
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
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <AppPage />
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
