import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetPasswordForm = () => {
  const { token } = useParams(); // Get token from the URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      console.log('Token being used for reset:', token); // Debugging info
      await api.post(`/auth/reset-password/${token}`, { password });
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage(
        error.response && error.response.data
          ? error.response.data.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-purple-700 min-h-screen flex justify-center items-center">
      <div className="bg-white w-full max-w-md shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-6">Set New Password</h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col mb-4">
            <label htmlFor="password" className="text-lg mb-2">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="flex flex-col mb-6">
            <label htmlFor="confirmPassword" className="text-lg mb-2">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {message && (
            <div className={`text-center text-sm mb-4 ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-700 text-white py-3 rounded hover:bg-purple-800 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
