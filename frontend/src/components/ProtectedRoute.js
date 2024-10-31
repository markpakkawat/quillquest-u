// src/components/ProtectedRoute.js
import { useContext } from 'react';
import { Navigate } from 'react-router-dom'; // For React Router v6
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);

  // If the user is not authenticated, redirect to login page
  if (!auth.token) {
    return <Navigate to="/login" />;
  }

  // If authenticated, render the child components (protected page)
  return children;
};

export default ProtectedRoute;
