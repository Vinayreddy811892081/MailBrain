// context/AuthContext.jsx
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
  const [token, setToken] = useState(null);

  // Fetch user from server
  const refreshUser = useCallback(async () => {
    if (!token) return false;
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
  }, [token]);

  // On app load
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
        localStorage.removeItem("mb_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function — only token is needed
  const login = async (newToken) => {
    try {
      console.log("TOKEN RECEIVED:", newToken); // ✅

      localStorage.setItem("mb_token", newToken);

      console.log("TOKEN SAVED:", localStorage.getItem("mb_token")); // ✅

      const res = await authAPI.me();

      console.log("ME RESPONSE:", res.data); // ✅

      setToken(newToken);
      setUser(res.data.user);

      return true;
    } catch (err) {
      console.error("LOGIN FAILED:", err); // ✅
      localStorage.removeItem("mb_token");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("mb_token");
    setToken(null);
    setUser(null);
    setSubscriptionActive(false);
    setDaysLeft(0);
    window.location.href = "/login";
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

// ✅ Always export hook separately and last
export const useAuth = () => useContext(AuthContext);
