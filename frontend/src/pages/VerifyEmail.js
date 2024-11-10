import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
  const [status, setStatus] = useState('Verifying...');
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the token from the URL
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      // Verify the token by calling the backend API
      api
        .get(`/auth/verify-email?token=${token}`)
        .then((response) => {
          setStatus('Email verified successfully. You can now log in.');
          setTimeout(() => navigate('/login'), 3000);
        })
        .catch((error) => {
          setError(
            error.response?.data?.message ||
              'Verification failed. The link may have expired or is invalid.'
          );
          setStatus(null);
        });
    } else {
      setError('Invalid verification link.');
      setStatus(null);
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-500 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">Email Verification</h2>
        {status && <p className="text-green-600 font-semibold mb-2">{status}</p>}
        {error && <p className="text-red-600 font-semibold">{error}</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
