// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [token, setToken] = useState(null); // ✅ store token

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem("mb_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      setToken(storedToken); // ✅ set token in state

      try {
        const res = await authAPI.me();
        const subActive = res.data.subscriptionActive ?? false;
        setUser(res.data.user);
        setSubscriptionActive(subActive);
        setDaysLeft(res.data.daysLeft ?? 0);
      } catch (err) {
        localStorage.removeItem("mb_token");
        localStorage.removeItem("mb_user");
        setToken(null);
        setUser(null);
        setSubscriptionActive(false);
        setDaysLeft(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (newToken, userData, subActive = false, days = 0) => {
    localStorage.setItem("mb_token", newToken);
    localStorage.setItem("mb_user", JSON.stringify(userData));
    setToken(newToken); // ✅ save token
    setUser(userData);
    setSubscriptionActive(subActive);
    setDaysLeft(days);
  };

  const logout = () => {
    localStorage.removeItem("mb_token");
    localStorage.removeItem("mb_user");
    setToken(null); // ✅ clear token
    setUser(null);
    setSubscriptionActive(false);
    setDaysLeft(0);
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const subActive = res.data.subscriptionActive ?? false;
      setUser(res.data.user);
      setSubscriptionActive(subActive);
      setDaysLeft(res.data.daysLeft ?? 0);
      return subActive;
    } catch {
      setUser(null);
      setSubscriptionActive(false);
      setDaysLeft(0);
      setToken(null);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // ✅ expose token
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
