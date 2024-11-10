// backend/routes/posts.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts
} = require('../controllers/postController');

// @route   GET /api/posts/user
// @desc    Get all posts by a specific user
// @access  Private
router.get('/user', protect, getUserPosts);

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, createPost);

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', getPosts);

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', getPostById);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', protect, updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, deletePost);

// @route   PUT /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.put('/:id/like', protect, likePost);

// @route   PUT /api/posts/:id/unlike
// @desc    Unlike a post
// @access  Private
router.put('/:id/unlike', protect, unlikePost);

module.exports = router;