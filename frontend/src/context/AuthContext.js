import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.token && !auth.user) {
        try {
          const response = await api.get('/users/profile', {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          });
          const userData = response.data;

          // Store user in both state and localStorage
          setAuth((prevAuth) => ({
            ...prevAuth,
            user: userData,
          }));
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setAuth({
            token: null,
            user: null,
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    fetchUser();
  }, [auth.token]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({
      token,
      user,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({
      token: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
