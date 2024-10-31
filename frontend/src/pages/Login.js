import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/images/logo-2.png';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

const Login = () => {

  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Use AuthContext

  // State variables for form inputs and feedback
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear specific field error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }

    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
  };

  // Validate form inputs
  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return; // Stop submission if there are validation errors
    }

    setIsSubmitting(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Assuming backend returns token and user info
      const { token, user } = response.data;

      // Store token in localStorage or any state management
      localStorage.setItem('token', token);

      // Update auth state using context
      login(token, user);

      // Redirect to home page
      setSuccessMessage('Login successful! Redirecting...');
      navigate('/home');

    } catch (error) {
      if (error.response && error.response.data) {
        setServerError(error.response.data.message || 'Login failed');
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#9500F0] min-h-screen flex justify-center items-center">
      <div className="bg-white flex flex-col md:flex-row w-full max-w-4xl shadow-lg rounded-lg overflow-hidden">
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10 bg-gray-100">
          <img src={logo} alt="Logo" className="w-32 h-32 md:w-48 md:h-48 object-contain" />
          <div className="font-[Mclaren] text-4xl md:text-5xl text-[#9500F0] mt-5 text-center">QuillQuest</div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Welcome back!</h2>
          <p className="text-md text-center mb-4">It's good to see you again</p>
          <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
            {/* Email Field */}
            <div className="flex flex-col mb-4">
              <label htmlFor="email" className="text-lg mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
              {errors.email && (
                <span className="text-red-500 text-sm mt-1">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col mb-2">
              <label htmlFor="password" className="text-lg mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
              {errors.password && (
                <span className="text-red-500 text-sm mt-1">{errors.password}</span>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="w-full text-right mb-4">
              <Link to="/reset-password" className="text-purple-700 hover:underline text-sm">Forgot password?</Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#9500F0] text-white py-3 rounded hover:bg-purple-800 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>

            {/* Display Server Error */}
            {serverError && (
              <div className="text-red-500 text-center mt-4">
                {serverError}
              </div>
            )}
          </form>
          <p className="text-sm text-gray-700 mt-4">
            Don’t have an account? <Link to="/register" className="text-purple-700 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
