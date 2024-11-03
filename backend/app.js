const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const app = express();

// Allowed origins (Vercel frontend and local development)
const allowedOrigins = [
  process.env.FRONTEND_URL,  // Vercel frontend
  'http://localhost:3000'    // Local development
];

const statisticsRoutes = require('./routes/statistics');
app.use('/api/statistics', statisticsRoutes);

// CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    }
  },
  credentials: true,  // Allows credentials like cookies or authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
}));

// Middleware to parse JSON requests
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const promptRoutes = require('./routes/prompts');
const replyRoutes = require('./routes/replies');
const notificationRoutes = require('./routes/notifications');
const resetPasswordRoute = require('./routes/resetPassword');

// Routes
app.use('/api/auth', authRoutes, resetPasswordRoute);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api', replyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', statisticsRoutes);

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Handle Preflight Requests (OPTIONS)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.send();
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    message: 'Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

module.exports = app;