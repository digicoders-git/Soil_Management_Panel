import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Cookie helpers
const setCookie = (name, value, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const eraseCookie = (name) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Lax';
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Try sessionStorage first, then cookie
    let token = sessionStorage.getItem('token');
    if (!token) {
      token = getCookie('token');
      if (token) {
        sessionStorage.setItem('token', token);
      }
    }

    if (token) {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data);
      } catch (error) {
        sessionStorage.removeItem('token');
        eraseCookie('token');
      }
    }
    setLoading(false);
  };

  const login = async (mobile, password) => {
    try {
      const { data } = await api.post('/auth/login', { mobile, password });

      // Save to sessionStorage and Cookie
      sessionStorage.setItem('token', data.token);
      setCookie('token', data.token);

      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    sessionStorage.removeItem('token');
    eraseCookie('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
