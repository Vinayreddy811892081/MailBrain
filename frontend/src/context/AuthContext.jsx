import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [token, setToken] = useState(null);

  // ✅ Fetch user
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();

      setUser(res.data.user);
      setSubscriptionActive(res.data.subscriptionActive ?? false);
      setDaysLeft(res.data.daysLeft ?? 0);

      return true;
    } catch (err) {
      console.error("Auth fetch failed:", err);
      logout();
      return false;
    }
  }, []);

  // ✅ Init auth on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("mb_token"); // ✅ FIXED

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
        localStorage.removeItem("mb_token"); // ✅ FIXED
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ LOGIN FIXED
  const login = async (token) => {
    try {
      // ✅ MUST match api.js
      localStorage.setItem("mb_token", token);

      setToken(token);

      const res = await authAPI.me();

      setUser(res.data.user);
      setSubscriptionActive(res.data.subscriptionActive ?? false);
      setDaysLeft(res.data.daysLeft ?? 0);

      return true;
    } catch (err) {
      console.error("LOGIN FAILED:", err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("mb_token");
    setToken(null);
    setUser(null);
    setSubscriptionActive(false);
    setDaysLeft(0);
    window.location.href = "/";
  };

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
