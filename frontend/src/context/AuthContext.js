import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { setLogoutHandler } from '../services/api';

export const AuthContext = createContext();
let logout; // Define the logout function to be exported later
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

          // Token might be invalid or user might be deleted, so log out
          logout();
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
  useEffect(() => {
    setLogoutHandler(logout); // Set the logout handler from the context
  }, [logout]);

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { logout };
export default AuthProvider;
