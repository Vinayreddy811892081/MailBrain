// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  // ✅ Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("mb_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.me();
        const subActive = res.data.subscriptionActive ?? false;
        setUser(res.data.user);
        setSubscriptionActive(subActive);
        setDaysLeft(res.data.daysLeft ?? 0);
      } catch (err) {
        localStorage.removeItem("mb_token");
        localStorage.removeItem("mb_user");
        setUser(null);
        setSubscriptionActive(false);
        setDaysLeft(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ✅ Login method
  const login = (token, userData, subActive = false, days = 0) => {
    localStorage.setItem("mb_token", token);
    localStorage.setItem("mb_user", JSON.stringify(userData));
    setUser(userData);
    setSubscriptionActive(subActive);
    setDaysLeft(days);
  };

  // ✅ Logout method
  const logout = () => {
    localStorage.removeItem("mb_token");
    localStorage.removeItem("mb_user");
    setUser(null);
    setSubscriptionActive(false);
    setDaysLeft(0);
  };

  // ✅ Refresh user and subscription status
  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const subActive = res.data.subscriptionActive ?? false;
      setUser(res.data.user);
      setSubscriptionActive(subActive);
      setDaysLeft(res.data.daysLeft ?? 0);
      return subActive; // return subscription status for navigation
    } catch {
      setUser(null);
      setSubscriptionActive(false);
      setDaysLeft(0);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
