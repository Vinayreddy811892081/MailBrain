// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (token) {
      authAPI.me()
        .then(res => {
          setUser(res.data.user);
          setSubscriptionActive(res.data.subscriptionActive);
          setDaysLeft(res.data.daysLeft);
        })
        .catch(() => {
          localStorage.removeItem('mb_token');
          localStorage.removeItem('mb_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, subActive, days) => {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_user', JSON.stringify(userData));
    setUser(userData);
    setSubscriptionActive(subActive);
    setDaysLeft(days);
  };

  const logout = () => {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    setUser(null);
    setSubscriptionActive(false);
  };

  const refreshUser = async () => {
    const res = await authAPI.me();
    setUser(res.data.user);
    setSubscriptionActive(res.data.subscriptionActive);
    setDaysLeft(res.data.daysLeft);
  };

  return (
    <AuthContext.Provider value={{ user, loading, subscriptionActive, daysLeft, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
