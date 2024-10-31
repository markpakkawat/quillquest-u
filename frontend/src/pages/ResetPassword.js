import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Send request to backend to initiate password reset
      await api.post('/auth/reset-password', { email });
      setSuccessMessage('Password reset link has been sent to your email address. Please check your inbox.');
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message || 'Unable to send reset link. Please try again later.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-purple-700 min-h-screen flex justify-center items-center">
      <div className="bg-white w-full max-w-md shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-6">Reset Password</h2>
        <p className="text-center text-gray-600 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="w-full" noValidate>
          <div className="flex flex-col mb-4">
            <label htmlFor="email" className="text-lg mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errorMessage ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-purple-500`}
              required
            />
          </div>
          {errorMessage && (
            <div className="text-red-500 text-sm mb-4 text-center">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="text-green-500 text-sm mb-4 text-center">
              {successMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-700 text-white py-3 rounded hover:bg-purple-800 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-sm text-gray-700 mt-4 text-center">
          Remembered your password? <Link to="/login" className="text-purple-700 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
