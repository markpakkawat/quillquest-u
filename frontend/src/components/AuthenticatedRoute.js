import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthenticatedRoute = ({ children }) => {
  // Check if the user is logged in
  const isAuthenticated = !!localStorage.getItem('token'); // Example: checking if a token is in localStorage

  // If user is logged in, redirect them to home
  if (isAuthenticated) {
    return <Navigate to="/home" />;
  }

  // If user is not logged in, render the children components (e.g., Login or Register page)
  return children;
};

export default AuthenticatedRoute;
