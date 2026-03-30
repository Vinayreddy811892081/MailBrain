import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [token, setToken] = useState(localStorage.getItem("mb_token") || null);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("mb_token");
    setToken(null);
    setUser(null);
    setSubscriptionActive(false);
    setDaysLeft(0);
  }, []);

  // ✅ Fetch latest user
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();

      setUser(res.data.user);
      setSubscriptionActive(res.data.subscriptionActive ?? false);
      setDaysLeft(res.data.daysLeft ?? 0);

      return true;
    } catch (err) {
      console.error("Auth fetch failed:", err);
      clearAuth();
      return false;
    }
  }, [clearAuth]);

  // ✅ Init auth on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("mb_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);

        const res = await authAPI.me();

        setUser(res.data.user);
        setSubscriptionActive(res.data.subscriptionActive ?? false);
        setDaysLeft(res.data.daysLeft ?? 0);
      } catch (err) {
        console.error("Init auth failed:", err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [clearAuth]);

  // ✅ Login with JWT from backend
  const login = async (newToken) => {
    try {
      localStorage.setItem("mb_token", newToken);
      setToken(newToken);

      const res = await authAPI.me();

      setUser(res.data.user);
      setSubscriptionActive(res.data.subscriptionActive ?? false);
      setDaysLeft(res.data.daysLeft ?? 0);

      return true;
    } catch (err) {
      console.error("LOGIN FAILED:", err);
      clearAuth();
      return false;
    }
  };

  // ✅ Logout only clears auth
  // Navigation should be handled in components
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        subscriptionActive,
        daysLeft,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
