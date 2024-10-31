import React, { useState, useContext } from 'react';
import api from '../services/api';
import { Link , useNavigate } from 'react-router-dom';
import '../assets/css/pages/Register.css';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate(); // Use useHistory from react-router-dom if using React Router
  const { login } = useContext(AuthContext); // Use AuthContext
  const history = useNavigate();

  const [formData, setFormData] = useState({
    email: '', 
    username: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await api.post('/auth/register', {
        "username": formData.username,
        "email": formData.email,
        "password": formData.password,
      });

      // Assuming backend returns token and user info
      const { token, user } = response.data;

      // Store token in localStorage or any state management
      localStorage.setItem('token', token);
      // Update auth state using context
      login(token, user);
      // Optionally, store user info in context or state
      // Redirect to dashboard or home page
      setSuccessMessage('Registration successful! Redirecting...');
      navigate('/home');
      
    } catch (error) {
      if (error.response && error.response.data) {
        setServerError(error.response.data.message || 'Registration failed');
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
      
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="title-text">Create an account</h2>
        <form onSubmit={handleSubmit} noValidate>
        {/* Username Field */}
        <div className="signup-form">
          <label className="signup-label">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? 'input-error' : ''}
            required
          />
          {errors.username && (
            <span className="error-text">{errors.username}</span>
          )}
        </div>

        {/* Email Field */}
        <div className="signup-form">
          <label className="signup-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'input-error' : ''}
            required
          />
          {errors.email && (
            <span className="error-text">{errors.email}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="signup-form">
          <label className="signup-label">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'input-error' : ''}
            required
          />
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="signup-form">
          <label className="signup-label">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'input-error' : ''}
            required
          />
          {errors.confirmPassword && (
            <span className="error-text">{errors.confirmPassword}</span>
          )}
        </div>

        {/* Submit Button */}
        <button type="signup-form" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;