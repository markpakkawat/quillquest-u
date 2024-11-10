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

// 1. First, apply critical middleware
// CORS Middleware must come before routes
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Increase preflight cache time to 10 minutes
}));

// 2. Body parsing middleware
app.use(express.json());

// 3. Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 4. Handle Preflight Requests (OPTIONS)
app.options('*', (req, res) => {
  // Set CORS headers explicitly for OPTIONS requests
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// 5. Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const promptRoutes = require('./routes/prompts');
const replyRoutes = require('./routes/replies');
const notificationRoutes = require('./routes/notifications');
const resetPasswordRoute = require('./routes/resetPassword');
const statisticsRoutes = require('./routes/statistics');

// 6. Apply Routes
// In app.js, modify the route mounting section to properly nest statistics routes

// ... other imports remain the same ...

// Update route mounting section
app.use('/api/auth', authRoutes, resetPasswordRoute);
app.use('/api/users', userRoutes);
app.use('/api/users', statisticsRoutes); // Move statistics under /api/users
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api', replyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', require('./routes/statistics'));

// 7. Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// 8. Error Handling Middleware (should be last)
app.use((err, req, res, next) => {
  // Log error details
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin
  });

  // Handle CORS errors specifically
  if (err.message && err.message.startsWith('CORS Error:')) {
    return res.status(403).json({
      message: 'CORS Error',
      error: err.message,
      allowedOrigins: process.env.NODE_ENV === 'production' ? [] : allowedOrigins
    });
  }

  // Handle other errors
  res.status(500).json({
    message: 'Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

module.exports = app;