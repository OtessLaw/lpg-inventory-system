import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lpg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('lpg_token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('lpg_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          localStorage.removeItem('lpg_token');
          localStorage.removeItem('lpg_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, user: userData } = res.data;
      localStorage.setItem('lpg_token', token);
      localStorage.setItem('lpg_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const logout = () => {
    localStorage.removeItem('lpg_token');
    localStorage.removeItem('lpg_user');
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
